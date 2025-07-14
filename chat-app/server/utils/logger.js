const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = {
  info: (message, meta = {}) => {
    const log = {
      level: 'info',
      message,
      meta,
      timestamp: new Date().toISOString()
    };
    
    console.log(`[INFO] ${log.timestamp}: ${message}`, meta);
    
    if (process.env.NODE_ENV === 'production') {
      fs.appendFileSync(
        path.join(logDir, 'app.log'),
        JSON.stringify(log) + '\n'
      );
    }
  },

  error: (message, error = {}) => {
    const log = {
      level: 'error',
      message,
      error: error.message || error,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };
    
    console.error(`[ERROR] ${log.timestamp}: ${message}`, error);
    
    if (process.env.NODE_ENV === 'production') {
      fs.appendFileSync(
        path.join(logDir, 'error.log'),
        JSON.stringify(log) + '\n'
      );
    }
  },

  warn: (message, meta = {}) => {
    const log = {
      level: 'warn',
      message,
      meta,
      timestamp: new Date().toISOString()
    };
    
    console.warn(`[WARN] ${log.timestamp}: ${message}`, meta);
    
    if (process.env.NODE_ENV === 'production') {
      fs.appendFileSync(
        path.join(logDir, 'app.log'),
        JSON.stringify(log) + '\n'
      );
    }
  },

  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${new Date().toISOString()}: ${message}`, meta);
    }
  }
};

module.exports = logger;