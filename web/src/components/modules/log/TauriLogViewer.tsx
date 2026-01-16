'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { isDesktopAppSync } from '@/lib/desktop';
import {
    subscribeToLogs,
    subscribeToErrors,
    subscribeToTermination,
    subscribeToShowLogs,
    getBackendStatus,
    startBackend,
    stopBackend,
    restartBackend,
} from '@/lib/tauri-events';
import { Button } from '@/components/ui/button';
import { Play, Square, RotateCcw, Trash2, Download, Circle } from 'lucide-react';

interface LogEntry {
    id: number;
    timestamp: Date;
    type: 'log' | 'error' | 'system';
    message: string;
}

const MAX_LOGS = 1000;

/**
 * Tauri Log Viewer Component
 * Displays real-time logs from the Go backend in desktop mode
 */
export function TauriLogViewer() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [autoScroll, setAutoScroll] = useState(true);
    const [isVisible, setIsVisible] = useState(false);
    const logContainerRef = useRef<HTMLDivElement>(null);
    const logIdRef = useRef(0);

    const addLog = useCallback((type: LogEntry['type'], message: string) => {
        setLogs((prev) => {
            const newLog: LogEntry = {
                id: logIdRef.current++,
                timestamp: new Date(),
                type,
                message: message.trim(),
            };
            const updated = [...prev, newLog];
            // Keep only the last MAX_LOGS entries
            return updated.slice(-MAX_LOGS);
        });
    }, []);

    // Check backend status periodically
    useEffect(() => {
        if (!isDesktopAppSync()) return;

        const checkStatus = async () => {
            const status = await getBackendStatus();
            setIsRunning(status);
        };

        checkStatus();
        const interval = setInterval(checkStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    // Subscribe to events
    useEffect(() => {
        if (!isDesktopAppSync()) return;

        let unlistenLog: (() => void) | undefined;
        let unlistenError: (() => void) | undefined;
        let unlistenTerminated: (() => void) | undefined;
        let unlistenShowLogs: (() => void) | undefined;

        const setup = async () => {
            unlistenLog = await subscribeToLogs((log) => {
                addLog('log', log);
            });

            unlistenError = await subscribeToErrors((error) => {
                addLog('error', error);
            });

            unlistenTerminated = await subscribeToTermination((info) => {
                addLog('system', `Backend terminated: ${info}`);
                setIsRunning(false);
            });

            unlistenShowLogs = await subscribeToShowLogs(() => {
                setIsVisible(true);
            });
        };

        setup();

        return () => {
            unlistenLog?.();
            unlistenError?.();
            unlistenTerminated?.();
            unlistenShowLogs?.();
        };
    }, [addLog]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (autoScroll && logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs, autoScroll]);

    const handleStart = async () => {
        try {
            addLog('system', 'Starting backend...');
            await startBackend();
            setIsRunning(true);
            addLog('system', 'Backend started');
        } catch (error) {
            addLog('error', `Failed to start: ${error}`);
        }
    };

    const handleStop = async () => {
        try {
            addLog('system', 'Stopping backend...');
            await stopBackend();
            setIsRunning(false);
            addLog('system', 'Backend stopped');
        } catch (error) {
            addLog('error', `Failed to stop: ${error}`);
        }
    };

    const handleRestart = async () => {
        try {
            addLog('system', 'Restarting backend...');
            await restartBackend();
            setIsRunning(true);
            addLog('system', 'Backend restarted');
        } catch (error) {
            addLog('error', `Failed to restart: ${error}`);
        }
    };

    const handleClear = () => {
        setLogs([]);
        logIdRef.current = 0;
    };

    const handleExport = () => {
        const content = logs
            .map((log) => `[${log.timestamp.toISOString()}] [${log.type.toUpperCase()}] ${log.message}`)
            .join('\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `octopus-logs-${new Date().toISOString().slice(0, 10)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleScroll = () => {
        if (!logContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current;
        // If user scrolls up, disable auto-scroll
        // If user scrolls to bottom, enable auto-scroll
        setAutoScroll(scrollHeight - scrollTop - clientHeight < 50);
    };

    // Don't render if not in desktop mode
    if (!isDesktopAppSync()) {
        return null;
    }

    // Minimized view (just a status indicator)
    if (!isVisible) {
        return (
            <button
                onClick={() => setIsVisible(true)}
                className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-background/80 px-3 py-2 text-sm shadow-lg backdrop-blur-sm border hover:bg-accent transition-colors"
            >
                <Circle
                    className={`h-3 w-3 ${isRunning ? 'fill-green-500 text-green-500' : 'fill-red-500 text-red-500'}`}
                />
                <span className="text-muted-foreground">
                    {isRunning ? 'Running' : 'Stopped'}
                </span>
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 w-[600px] max-w-[calc(100vw-2rem)] rounded-lg border bg-background shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-2">
                <div className="flex items-center gap-2">
                    <Circle
                        className={`h-3 w-3 ${isRunning ? 'fill-green-500 text-green-500' : 'fill-red-500 text-red-500'}`}
                    />
                    <span className="font-medium">System Logs</span>
                    <span className="text-xs text-muted-foreground">
                        ({logs.length} entries)
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={handleStart}
                        disabled={isRunning}
                        title="Start"
                    >
                        <Play className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={handleStop}
                        disabled={!isRunning}
                        title="Stop"
                    >
                        <Square className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={handleRestart}
                        disabled={!isRunning}
                        title="Restart"
                    >
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                    <div className="mx-1 h-4 w-px bg-border" />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={handleClear}
                        title="Clear"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={handleExport}
                        title="Export"
                    >
                        <Download className="h-4 w-4" />
                    </Button>
                    <div className="mx-1 h-4 w-px bg-border" />
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => setIsVisible(false)}
                    >
                        Minimize
                    </Button>
                </div>
            </div>

            {/* Log content */}
            <div
                ref={logContainerRef}
                onScroll={handleScroll}
                className="h-[300px] overflow-auto p-2 font-mono text-xs"
            >
                {logs.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                        No logs yet
                    </div>
                ) : (
                    logs.map((log) => (
                        <div
                            key={log.id}
                            className={`py-0.5 ${
                                log.type === 'error'
                                    ? 'text-red-500'
                                    : log.type === 'system'
                                      ? 'text-blue-500'
                                      : 'text-foreground'
                            }`}
                        >
                            <span className="text-muted-foreground">
                                [{log.timestamp.toLocaleTimeString()}]
                            </span>{' '}
                            {log.message}
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t px-4 py-1 text-xs text-muted-foreground">
                <span>
                    Auto-scroll: {autoScroll ? 'On' : 'Off'}
                </span>
                <span>
                    Backend: {isRunning ? 'Running' : 'Stopped'}
                </span>
            </div>
        </div>
    );
}
