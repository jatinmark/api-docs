
const ENV = process.env.NODE_ENV || 'development';
function formatLog(level: string, args: any[]) {
  // Structured log output as JSON
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message: args.map(a => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' ')
  });
}
export const logger = {
  error: (...args: any[]) => {
    // Always log errors
    console.error(formatLog('error', args));
  },
  warn: (...args: any[]) => {
    // Always log warnings
    console.warn(formatLog('warn', args));
  },
  info: (...args: any[]) => {
    // Log info in non-production
    if (ENV !== 'production') {
      console.info(formatLog('info', args));
    }
  },
  log: (...args: any[]) => {
    // Log general logs in non-production
    if (ENV !== 'production') {
      console.log(formatLog('log', args));
    }
  },
  debug: (...args: any[]) => {
    // Log debug only in development
    if (ENV === 'development') {
      console.debug(formatLog('debug', args));
    }
  }
};
