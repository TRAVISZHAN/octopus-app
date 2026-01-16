/**
 * Tauri event handling utilities
 * Provides type-safe wrappers for Tauri events
 */

import { isDesktopAppSync } from './desktop';

type UnlistenFn = () => void;

interface TauriEvent<T> {
    payload: T;
}

/**
 * Subscribe to Go backend log events
 */
export async function subscribeToLogs(
    onLog: (log: string) => void
): Promise<UnlistenFn> {
    if (!isDesktopAppSync()) {
        return () => {};
    }

    try {
        const { listen } = await import('@tauri-apps/api/event');
        return listen<string>('go-backend-log', (event: TauriEvent<string>) => {
            onLog(event.payload);
        });
    } catch {
        console.warn('Failed to subscribe to logs - Tauri API not available');
        return () => {};
    }
}

/**
 * Subscribe to Go backend error events
 */
export async function subscribeToErrors(
    onError: (error: string) => void
): Promise<UnlistenFn> {
    if (!isDesktopAppSync()) {
        return () => {};
    }

    try {
        const { listen } = await import('@tauri-apps/api/event');
        return listen<string>('go-backend-error', (event: TauriEvent<string>) => {
            onError(event.payload);
        });
    } catch {
        console.warn('Failed to subscribe to errors - Tauri API not available');
        return () => {};
    }
}

/**
 * Subscribe to backend termination events
 */
export async function subscribeToTermination(
    onTerminated: (info: string) => void
): Promise<UnlistenFn> {
    if (!isDesktopAppSync()) {
        return () => {};
    }

    try {
        const { listen } = await import('@tauri-apps/api/event');
        return listen<string>('go-backend-terminated', (event: TauriEvent<string>) => {
            onTerminated(event.payload);
        });
    } catch {
        console.warn('Failed to subscribe to termination - Tauri API not available');
        return () => {};
    }
}

/**
 * Subscribe to show logs event (from tray menu)
 */
export async function subscribeToShowLogs(
    onShowLogs: () => void
): Promise<UnlistenFn> {
    if (!isDesktopAppSync()) {
        return () => {};
    }

    try {
        const { listen } = await import('@tauri-apps/api/event');
        return listen('show-logs', () => {
            onShowLogs();
        });
    } catch {
        console.warn('Failed to subscribe to show-logs - Tauri API not available');
        return () => {};
    }
}

/**
 * Start the Go backend
 */
export async function startBackend(): Promise<string> {
    if (!isDesktopAppSync()) {
        throw new Error('Not running in desktop mode');
    }

    try {
        const { invoke } = await import('@tauri-apps/api/core');
        return invoke<string>('start_go_backend');
    } catch (error) {
        throw new Error(`Failed to start backend: ${error}`);
    }
}

/**
 * Stop the Go backend
 */
export async function stopBackend(): Promise<string> {
    if (!isDesktopAppSync()) {
        throw new Error('Not running in desktop mode');
    }

    try {
        const { invoke } = await import('@tauri-apps/api/core');
        return invoke<string>('stop_go_backend');
    } catch (error) {
        throw new Error(`Failed to stop backend: ${error}`);
    }
}

/**
 * Restart the Go backend
 */
export async function restartBackend(): Promise<string> {
    if (!isDesktopAppSync()) {
        throw new Error('Not running in desktop mode');
    }

    try {
        const { invoke } = await import('@tauri-apps/api/core');
        return invoke<string>('restart_go_backend');
    } catch (error) {
        throw new Error(`Failed to restart backend: ${error}`);
    }
}

/**
 * Get the backend status
 */
export async function getBackendStatus(): Promise<boolean> {
    if (!isDesktopAppSync()) {
        return false;
    }

    try {
        const { invoke } = await import('@tauri-apps/api/core');
        return invoke<boolean>('get_backend_status');
    } catch {
        return false;
    }
}
