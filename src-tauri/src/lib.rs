use std::sync::Mutex;
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, State,
};
use tauri_plugin_shell::{process::CommandChild, process::CommandEvent, ShellExt};

/// Go backend process state
pub struct GoProcess {
    child: Mutex<Option<CommandChild>>,
}

impl Default for GoProcess {
    fn default() -> Self {
        Self {
            child: Mutex::new(None),
        }
    }
}

/// Start the Go backend process
#[tauri::command]
async fn start_go_backend(
    app: AppHandle,
    state: State<'_, GoProcess>,
) -> Result<String, String> {
    let mut child_guard = state.child.lock().map_err(|e| e.to_string())?;

    // Check if already running
    if child_guard.is_some() {
        return Err("Backend is already running".to_string());
    }

    // Get the sidecar command
    let sidecar = app
        .shell()
        .sidecar("octopus-server")
        .map_err(|e| format!("Failed to create sidecar command: {}", e))?
        .args(["start"])
        .env("OCTOPUS_CORS_ALLOW_ORIGINS", "*");

    // Spawn the process
    let (mut rx, child) = sidecar
        .spawn()
        .map_err(|e| format!("Failed to spawn sidecar: {}", e))?;

    *child_guard = Some(child);
    drop(child_guard);

    // Clone app handle for the async task
    let app_handle = app.clone();

    // Spawn a task to handle stdout/stderr
    tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(line) => {
                    let log_line = String::from_utf8_lossy(&line).to_string();
                    let _ = app_handle.emit("go-backend-log", log_line);
                }
                CommandEvent::Stderr(line) => {
                    let log_line = String::from_utf8_lossy(&line).to_string();
                    let _ = app_handle.emit("go-backend-error", log_line);
                }
                CommandEvent::Terminated(payload) => {
                    let _ = app_handle.emit("go-backend-terminated", format!("{:?}", payload));
                }
                _ => {}
            }
        }
    });

    // Update tray icon
    update_tray_menu(&app, true);

    Ok("Backend started successfully".to_string())
}

/// Stop the Go backend process
#[tauri::command]
async fn stop_go_backend(state: State<'_, GoProcess>) -> Result<String, String> {
    let mut child_guard = state.child.lock().map_err(|e| e.to_string())?;

    match child_guard.take() {
        Some(child) => {
            child.kill().map_err(|e| format!("Failed to kill process: {}", e))?;
            Ok("Backend stopped successfully".to_string())
        }
        None => Err("Backend is not running".to_string()),
    }
}

/// Restart the Go backend process - internal implementation
async fn do_restart(app: AppHandle, state: &GoProcess) -> Result<String, String> {
    // Stop if running - scope the lock guard
    {
        let mut child_guard = state.child.lock().map_err(|e| e.to_string())?;
        if let Some(child) = child_guard.take() {
            let _ = child.kill();
        }
    } // MutexGuard dropped here before await

    // Wait a bit for the process to fully terminate
    tauri::async_runtime::spawn(async {
        tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    }).await.map_err(|e| e.to_string())?;

    // Start again - need to acquire lock again
    let mut child_guard = state.child.lock().map_err(|e| e.to_string())?;

    // Check if already running (shouldn't be, but just in case)
    if child_guard.is_some() {
        return Err("Backend is already running".to_string());
    }

    // Get the sidecar command
    let sidecar = app
        .shell()
        .sidecar("octopus-server")
        .map_err(|e| format!("Failed to create sidecar command: {}", e))?
        .args(["start"])
        .env("OCTOPUS_CORS_ALLOW_ORIGINS", "*");

    // Spawn the process
    let (mut rx, child) = sidecar
        .spawn()
        .map_err(|e| format!("Failed to spawn sidecar: {}", e))?;

    *child_guard = Some(child);
    drop(child_guard);

    // Clone app handle for the async task
    let app_handle = app.clone();

    // Spawn a task to handle stdout/stderr
    tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(line) => {
                    let log_line = String::from_utf8_lossy(&line).to_string();
                    let _ = app_handle.emit("go-backend-log", log_line);
                }
                CommandEvent::Stderr(line) => {
                    let log_line = String::from_utf8_lossy(&line).to_string();
                    let _ = app_handle.emit("go-backend-error", log_line);
                }
                CommandEvent::Terminated(payload) => {
                    let _ = app_handle.emit("go-backend-terminated", format!("{:?}", payload));
                }
                _ => {}
            }
        }
    });

    // Update tray icon
    update_tray_menu(&app, true);

    Ok("Backend restarted successfully".to_string())
}

/// Restart the Go backend process
#[tauri::command]
async fn restart_go_backend(
    app: AppHandle,
    state: State<'_, GoProcess>,
) -> Result<String, String> {
    do_restart(app, state.inner()).await
}

/// Get the backend status
#[tauri::command]
async fn get_backend_status(state: State<'_, GoProcess>) -> Result<bool, String> {
    let child_guard = state.child.lock().map_err(|e| e.to_string())?;
    Ok(child_guard.is_some())
}

/// Create the system tray
fn create_tray(app: &AppHandle) -> tauri::Result<()> {
    let menu = build_tray_menu(app, false)?;

    TrayIconBuilder::with_id("main")
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| {
            handle_tray_menu_event(app, event.id.as_ref());
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)?;

    Ok(())
}

/// Build the tray menu
fn build_tray_menu(app: &AppHandle, is_running: bool) -> tauri::Result<Menu<tauri::Wry>> {
    let status_text = if is_running {
        "Status: Running"
    } else {
        "Status: Stopped"
    };

    Menu::with_items(
        app,
        &[
            &MenuItem::with_id(app, "status", status_text, false, None::<&str>)?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "show", "Show Window", true, None::<&str>)?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "start", "Start Service", !is_running, None::<&str>)?,
            &MenuItem::with_id(app, "stop", "Stop Service", is_running, None::<&str>)?,
            &MenuItem::with_id(app, "restart", "Restart Service", is_running, None::<&str>)?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "logs", "View Logs", true, None::<&str>)?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?,
        ],
    )
}

/// Update the tray menu based on running state
fn update_tray_menu(app: &AppHandle, is_running: bool) {
    if let Some(tray) = app.tray_by_id("main") {
        if let Ok(menu) = build_tray_menu(app, is_running) {
            let _ = tray.set_menu(Some(menu));
        }
    }
}

/// Handle tray menu events
fn handle_tray_menu_event(app: &AppHandle, event_id: &str) {
    match event_id {
        "show" => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
        "start" => {
            let app_handle = app.clone();
            tauri::async_runtime::spawn(async move {
                if let Some(state) = app_handle.try_state::<GoProcess>() {
                    match start_go_backend(app_handle.clone(), state).await {
                        Ok(_) => {}
                        Err(e) => eprintln!("Failed to start backend: {}", e),
                    }
                }
            });
        }
        "stop" => {
            let app_handle = app.clone();
            tauri::async_runtime::spawn(async move {
                if let Some(state) = app_handle.try_state::<GoProcess>() {
                    match stop_go_backend(state).await {
                        Ok(_) => {
                            update_tray_menu(&app_handle, false);
                        }
                        Err(e) => eprintln!("Failed to stop backend: {}", e),
                    }
                }
            });
        }
        "restart" => {
            let app_handle = app.clone();
            tauri::async_runtime::spawn(async move {
                if let Some(state) = app_handle.try_state::<GoProcess>() {
                    match do_restart(app_handle.clone(), state.inner()).await {
                        Ok(_) => {}
                        Err(e) => eprintln!("Failed to restart backend: {}", e),
                    }
                }
            });
        }
        "logs" => {
            // Emit event to frontend to show logs
            let _ = app.emit("show-logs", ());
        }
        "quit" => {
            // Stop the backend before quitting
            let app_handle = app.clone();
            tauri::async_runtime::spawn(async move {
                if let Some(state) = app_handle.try_state::<GoProcess>() {
                    let _ = stop_go_backend(state).await;
                }
                app_handle.exit(0);
            });
        }
        _ => {}
    }
}

/// Main entry point
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(GoProcess::default())
        .invoke_handler(tauri::generate_handler![
            start_go_backend,
            stop_go_backend,
            restart_go_backend,
            get_backend_status,
        ])
        .setup(|app| {
            // Create system tray
            create_tray(app.handle())?;

            // Auto-start the backend
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                // Wait a bit for the app to fully initialize
                tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
                if let Some(state) = app_handle.try_state::<GoProcess>() {
                    match start_go_backend(app_handle.clone(), state).await {
                        Ok(_) => {}
                        Err(e) => eprintln!("Failed to auto-start backend: {}", e),
                    }
                }
            });

            Ok(())
        })
        .on_window_event(|window, event| {
            // Hide window instead of closing on macOS
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                #[cfg(target_os = "macos")]
                {
                    let _ = window.hide();
                    api.prevent_close();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
