const config = require("../config/config");

class Logger {
  static info(message, data = null) {
    if (config.LOG_LEVEL === "info" || config.NODE_ENV === "development") {
      console.log(`[INFO] ${new Date().toISOString()}: ${message}`);
      if (data) console.log(data);
    }
  }

  static error(message, error = null) {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`);
    if (error) {
      console.error(error.stack || error);
    }
  }

  static warn(message, data = null) {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`);
    if (data) console.warn(data);
  }

  static debug(message, data = null) {
    if (config.NODE_ENV === "development") {
      console.debug(`[DEBUG] ${new Date().toISOString()}: ${message}`);
      if (data) console.debug(data);
    }
  }
}

module.exports = Logger;
