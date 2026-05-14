const winston = require("winston");
require("winston-daily-rotate-file");

const { logPath } = require("../config/paths");

const transport = new winston.transports.DailyRotateFile({
  filename: `${logPath}/agent-%DATE%.log`,
  datePattern: "YYYY-MM-DD",
  maxFiles: "30d",
});

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [transport, new winston.transports.Console()],
});

module.exports = logger;
