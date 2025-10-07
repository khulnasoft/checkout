/**
 * Logger utility for KhulnaSoft Development Space Engine
 *
 * Provides structured logging with different levels, formatting,
 * and output destinations.
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
} as const;

export class Logger {
  private static currentLevel: LogLevel = 'info';
  private static readonly levels = LOG_LEVELS;
  private static readonly emojiMap: Record<LogLevel, string> = {
    error: '❌',
    warn: '⚠️',
    info: 'ℹ️',
    debug: '🐛',
  };

  /**
   * Set the current log level
   * @param level - The log level to set
   */
  static setLevel(level: LogLevel): void {
    if (level in this.levels) {
      this.currentLevel = level;
    } else {
      console.warn(`Invalid log level: ${level}. Using 'info'`);
      this.currentLevel = 'info';
    }
  }

  /**
   * Log an error message
   * @param args - Arguments to log
   */
  static error(...args: unknown[]): void {
    this.log('error', ...args);
  }

  /**
   * Log a warning message
   * @param args - Arguments to log
   */
  static warn(...args: unknown[]): void {
    this.log('warn', ...args);
  }

  /**
   * Log an info message
   * @param args - Arguments to log
   */
  static info(...args: unknown[]): void {
    this.log('info', ...args);
  }

  /**
   * Log a debug message
   * @param args - Arguments to log
   */
  static debug(...args: unknown[]): void {
    this.log('debug', ...args);
  }

  /**
   * Internal method to handle logging
   * @param level - Log level
   * @param args - Arguments to log
   */
  private static log(level: LogLevel, ...args: unknown[]): void {
    if (this.levels[this.currentLevel] < this.levels[level]) {
      return;
    }

    const timestamp = new Date().toISOString();
    const emoji = this.emojiMap[level] || '';
    const logMethod = console[level] || console.log;

    // Format the log message
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');

    // Create a structured log entry
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...(args.length > 1 && { details: args.slice(1) })
    };

    // Output the log
    logMethod(`${emoji} [${timestamp}] [${level.toUpperCase()}]`, message);
    
    // For objects, log them with proper formatting
    if (args.some(arg => typeof arg === 'object' && arg !== null)) {
      console.dir(logEntry, { depth: null, colors: true });
    }
  }

  /**
   * Create a child logger with additional context
   * @param context - Context to add to log messages
   * @returns A child logger instance
   */
  static child(context: Record<string, unknown>): typeof Logger {
    return new Proxy(Logger, {
      get(target, prop: string) {
        if (['error', 'warn', 'info', 'debug'].includes(prop)) {
          return (...args: unknown[]) => {
            const message = args[0];
            const rest = args.slice(1);
            const contextStr = Object.entries(context)
              .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
              .join(' ');
            
            target[prop as LogLevel](`[${contextStr}] ${message}`, ...rest);
          };
        }
        return target[prop as keyof typeof target];
      },
    }) as typeof Logger;
  }
}

export default Logger;
