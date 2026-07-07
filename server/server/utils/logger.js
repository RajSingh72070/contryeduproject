const colors = {
  reset: "\x1b[0m",
  info: "\x1b[36m", // cyan
  warn: "\x1b[33m", // yellow
  error: "\x1b[31m", // red
  debug: "\x1b[90m"  // dark grey
};

const formatMessage = (level, message, meta) => {
  const timestamp = new Date().toISOString();
  const metaStr = meta && Object.keys(meta).length ? ` | Meta: ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
};

const logger = {
  info: (msg, meta = {}) => {
    console.log(`${colors.info}${formatMessage('info', msg, meta)}${colors.reset}`);
  },
  warn: (msg, meta = {}) => {
    console.warn(`${colors.warn}${formatMessage('warn', msg, meta)}${colors.reset}`);
  },
  error: (msg, meta = {}) => {
    console.error(`${colors.error}${formatMessage('error', msg, meta)}${colors.reset}`);
  },
  debug: (msg, meta = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`${colors.debug}${formatMessage('debug', msg, meta)}${colors.reset}`);
    }
  }
};

export default logger;
