const fs = require("fs-extra");
const path = require("path");

const { queuePath } = require("../config/paths");

async function saveFailedLogs(logs) {
  const file = path.join(queuePath, `${Date.now()}.json`);

  await fs.writeJson(file, logs);
}

async function getQueuedLogs() {
  const files = await fs.readdir(queuePath);

  const allLogs = [];

  for (const file of files) {
    const logs = await fs.readJson(path.join(queuePath, file));

    allLogs.push({
      file,
      logs,
    });
  }

  return allLogs;
}

async function removeQueue(file) {
  await fs.remove(path.join(queuePath, file));
}

module.exports = {
  saveFailedLogs,
  getQueuedLogs,
  removeQueue,
};
