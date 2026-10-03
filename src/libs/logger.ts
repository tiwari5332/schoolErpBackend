export interface LogContext {
  requestId?: string;
  sessionId?: string;
  actorId?: string;
  schoolId?: string | null;
  [key: string]: any;
}

export class Logger {
  private static formatMessage(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', message: string, context?: LogContext) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context || {}),
    });
  }

  static info(message: string, context?: LogContext) {
    console.log(this.formatMessage('INFO', message, context));
  }

  static warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage('WARN', message, context));
  }

  static error(message: string, error?: any, context?: LogContext) {
    const errorDetails = error instanceof Error ? {
      name: error.name,
      errorMessage: error.message,
      stack: error.stack,
    } : { error };

    console.error(this.formatMessage('ERROR', message, { ...context, ...errorDetails }));
  }

  static debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      console.log(this.formatMessage('DEBUG', message, context));
    }
  }
}
