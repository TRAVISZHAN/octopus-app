/**
 * Desktop mode detection and utilities for Tauri integration
 */

/**
 * Check if running in Tauri desktop environment
 * This checks for the __TAURI_INTERNALS__ object which is injected by Tauri v2
 */
export function isDesktopAppSync(): boolean {
    if (typeof window === 'undefined') {
        return false;
    }
    // Tauri v2 uses __TAURI_INTERNALS__
    const isTauri = '__TAURI_INTERNALS__' in window || '__TAURI__' in window;
    // Debug log
    if (typeof console !== 'undefined') {
        console.log('[Desktop] isDesktopAppSync:', isTauri,
            '__TAURI_INTERNALS__' in window,
            '__TAURI__' in window);
    }
    return isTauri;
}

/**
 * Async version for initial check
 */
export async function isDesktopApp(): Promise<boolean> {
    return isDesktopAppSync();
}

/**
 * Get the API base URL based on environment
 * In desktop mode, always connect to local Go backend
 */
export function getApiBaseUrl(): string {
    const isTauri = isDesktopAppSync();
    const url = isTauri ? 'http://127.0.0.1:8080' : (process.env.NEXT_PUBLIC_API_BASE_URL || '.');
    console.log('[Desktop] getApiBaseUrl:', url, 'isTauri:', isTauri);
    return url;
}
