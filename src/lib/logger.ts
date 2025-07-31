type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVEL: LogLevel = process.env.NEXT_PUBLIC_LOG_LEVEL || 'warn';

const logLevels = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const isDev = process.env.NODE_ENV === 'development';

export const log = {
  debug: (...args: any[]) => {
    if (isDev && logLevels[LOG_LEVEL] <= logLevels.debug) {
      console.log('[DEBUG]', ...args);
    }
  },
  info: (...args: any[]) => {
    if (isDev && logLevels[LOG_LEVEL] <= logLevels.info) {
      console.info('[INFO]', ...args);
    }
  },
  warn: (...args: any[]) => {
    if (isDev && logLevels[LOG_LEVEL] <= logLevels.warn) {
      console.warn('[WARN]', ...args);
    }
  },
  error: (...args: any[]) => {
    if (isDev && logLevels[LOG_LEVEL] <= logLevels.error) {
      console.error('[ERROR]', ...args);
    }
  },
  table: (data: any) => {
    if (isDev && logLevels[LOG_LEVEL] <= logLevels.debug) {
      console.table(data);
    }
  },
  time: (label: string) => {
    if (isDev && logLevels[LOG_LEVEL] <= logLevels.debug) {
      console.time(label);
    }
  },
  timeEnd: (label: string) => {
    if (isDev && logLevels[LOG_LEVEL] <= logLevels.debug) {
      console.timeEnd(label);
    }
  },
  group: (label: string) => {
    if (isDev && logLevels[LOG_LEVEL] <= logLevels.debug) {
      console.group(label);
    }
  },
  groupEnd: () => {
    if (isDev && logLevels[LOG_LEVEL] <= logLevels.debug) {
      console.groupEnd();
    }
  }
}; 