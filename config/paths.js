const path = require("path");
const os = require("os");
const fs = require("fs-extra");
require("dotenv").config({
  quiet: true,
});

const isDev = !process.pkg;

const basePath = isDev
  ? path.join(__dirname, "../config")
  : process.platform === "win32"
    ? path.join(process.env.APPDATA, "hrms_biometric_agency")
    : path.join(os.homedir(), ".emplai-biometric-agent");

const configPath = path.join(basePath, "config.json");
const logPath = path.join(basePath, "logs");

const queuePath = path.join(basePath, "queue");

fs.ensureDirSync(basePath);
fs.ensureDirSync(logPath);
fs.ensureDirSync(queuePath);

module.exports = {
  basePath,
  logPath,
  configPath,
  queuePath,
};
