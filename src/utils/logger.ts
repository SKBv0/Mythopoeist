type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogData {
  [key: string]: unknown;
}

const isDevelopment = import.meta.env.DEV;

class Logger {
  private log(level: LogLevel, message: string, data?: LogData | Error): void {
    if (!isDevelopment) {
      return;
    }

    const timestamp = new Date().toISOString();

    switch (level) {
      case 'error':
        console.error(`[${timestamp}] ERROR:`, message, data);
        break;
      case 'warn':
        if (data) {
          console.warn(`[${timestamp}] WARN:`, message, data);
        } else {
          console.warn(`[${timestamp}] WARN:`, message);
        }
        break;
      case 'info':
        if (data) {
          console.log(`[${timestamp}] INFO:`, message, data);
        } else {
          console.log(`[${timestamp}] INFO:`, message);
        }
        break;
      case 'debug':
        if (data) {
          console.debug(`[${timestamp}] DEBUG:`, message, data);
        } else {
          console.debug(`[${timestamp}] DEBUG:`, message);
        }
        break;
    }

  }

  info(message: string, data?: LogData): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: LogData): void {
    this.log('warn', message, data);
  }

  error(message: string, error?: Error | LogData): void {
    this.log('error', message, error);
  }

  debug(message: string, data?: LogData): void {
    this.log('debug', message, data);
  }
}

export const logger = new Logger();