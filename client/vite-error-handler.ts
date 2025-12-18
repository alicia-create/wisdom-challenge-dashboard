/**
 * Suppress Vite HMR WebSocket connection errors in proxied environments
 * These errors don't affect functionality, only hot reload capability
 */
if (import.meta.env.DEV) {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    
    // Suppress Vite WebSocket connection errors
    if (
      message.includes('WebSocket closed without opened') ||
      message.includes('failed to connect to websocket') ||
      message.includes('[vite] failed to connect')
    ) {
      // Silently ignore these errors
      return;
    }
    
    // Pass through all other errors
    originalError.apply(console, args);
  };
}

export {};
