/**
 * In-memory error logger for development and debugging
 * Stores recent errors and warnings in memory (last 500 entries)
 */

export type LogLevel = 'error' | 'warning' | 'info' | 'debug';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  source?: string;
  stack?: string;
  metadata?: Record<string, any>;
}

class ErrorLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 500;
  private idCounter = 0;

  log(level: LogLevel, message: string, options?: {
    source?: string;
    stack?: string;
    metadata?: Record<string, any>;
  }) {
    const entry: LogEntry = {
      id: `log-${++this.idCounter}`,
      timestamp: new Date(),
      level,
      message,
      source: options?.source,
      stack: options?.stack,
      metadata: options?.metadata,
    };

    this.logs.unshift(entry); // Add to beginning
    
    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Also log to console for development
    const consoleMethod = level === 'error' ? console.error : 
                         level === 'warning' ? console.warn :
                         console.log;
    consoleMethod(`[${level.toUpperCase()}]`, message, options?.metadata || '');
  }

  error(message: string, options?: Parameters<typeof this.log>[2]) {
    this.log('error', message, options);
  }

  warning(message: string, options?: Parameters<typeof this.log>[2]) {
    this.log('warning', message, options);
  }

  info(message: string, options?: Parameters<typeof this.log>[2]) {
    this.log('info', message, options);
  }

  debug(message: string, options?: Parameters<typeof this.log>[2]) {
    this.log('debug', message, options);
  }

  getLogs(filters?: {
    level?: LogLevel;
    search?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): LogEntry[] {
    let filtered = [...this.logs];

    if (filters?.level) {
      filtered = filtered.filter(log => log.level === filters.level);
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(searchLower) ||
        log.source?.toLowerCase().includes(searchLower)
      );
    }

    if (filters?.startDate) {
      filtered = filtered.filter(log => log.timestamp >= filters.startDate!);
    }

    if (filters?.endDate) {
      filtered = filtered.filter(log => log.timestamp <= filters.endDate!);
    }

    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }

  getStats() {
    const stats = {
      total: this.logs.length,
      errors: 0,
      warnings: 0,
      info: 0,
      debug: 0,
    };

    this.logs.forEach(log => {
      if (log.level === 'error') stats.errors++;
      else if (log.level === 'warning') stats.warnings++;
      else if (log.level === 'info') stats.info++;
      else if (log.level === 'debug') stats.debug++;
    });

    return stats;
  }

  clear() {
    this.logs = [];
    this.idCounter = 0;
  }
}

// Singleton instance
export const errorLogger = new ErrorLogger();

// Capture unhandled errors
if (typeof process !== 'undefined') {
  process.on('uncaughtException', (error) => {
    errorLogger.error('Uncaught Exception', {
      source: 'process',
      stack: error.stack,
      metadata: { name: error.name, message: error.message },
    });
  });

  process.on('unhandledRejection', (reason: any) => {
    errorLogger.error('Unhandled Promise Rejection', {
      source: 'process',
      stack: reason?.stack,
      metadata: { reason: String(reason) },
    });
  });
}
