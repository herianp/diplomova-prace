type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
}

const currentLevel: LogLevel = import.meta.env.PROD ? 'error' : 'debug'

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel]
}

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`
  return context
    ? `${prefix} ${message} ${JSON.stringify(context)}`
    : `${prefix} ${message}`
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    if (shouldLog('debug')) console.debug(formatMessage('debug', message, context))
  },
  info(message: string, context?: LogContext): void {
    if (shouldLog('info')) console.info(formatMessage('info', message, context))
  },
  warn(message: string, context?: LogContext): void {
    if (shouldLog('warn')) console.warn(formatMessage('warn', message, context))
  },
  error(message: string, context?: LogContext): void {
    if (shouldLog('error')) console.error(formatMessage('error', message, context))
  }
}

/**
 * Create a scoped logger that automatically includes a service/module name in context
 */
export function createLogger(scope: string) {
  return {
    debug: (msg: string, ctx?: LogContext) => logger.debug(msg, { scope, ...ctx }),
    info: (msg: string, ctx?: LogContext) => logger.info(msg, { scope, ...ctx }),
    warn: (msg: string, ctx?: LogContext) => logger.warn(msg, { scope, ...ctx }),
    error: (msg: string, ctx?: LogContext) => logger.error(msg, { scope, ...ctx }),
  }
}
