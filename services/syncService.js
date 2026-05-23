const cron = require("node-cron");
const fs = require("fs-extra");
const { configPath } = require("../config/paths");
const { fetchLogs } = require("./dbService");
const { sendLogs } = require("./cloudService");
const { acquireLock, releaseLock } = require("../utils/lock");
const { getRuntimeConfig } = require("./runtimeConfig");

let task = null;

async function runSync() {
  if (!acquireLock()) {
    console.log("⚠ Sync already running");
    return;
  }

  try {
    console.log("🚀 Sync started");

    let localConfig = null;

    if (await fs.pathExists(configPath)) {
      localConfig = await fs.readJson(configPath);
    }

    const config = getRuntimeConfig();

    const { logs, lastSyncTime } = await fetchLogs(config, config.lastSyncTime);

    if (!logs.length) {
      console.log("⚡ No logs found");
      return;
    }

    console.log(`📦 ${logs.length} logs fetched`);

    await sendLogs(config, logs);

    console.log("✅ Sync completed");
  } catch (err) {
    console.error(err);
  } finally {
    releaseLock();
  }
}

function startSync(interval) {
  if (task) {
    task.stop();
  }

  task = cron.schedule(`*/${interval} * * * *`, runSync);
}

module.exports = {
  runSync,
  startSync,
};
