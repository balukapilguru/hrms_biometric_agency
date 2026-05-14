const { getRemoteConfig } = require("./cloudService");
const { setRuntimeConfig } = require("./runtimeConfig.js");
const { startSync, runSync } = require("./syncService");

async function initializeAgent(agentKey) {
  try {
    console.log("🚀 Initializing agent...");
    const config = await getRemoteConfig(agentKey);

    // Store globally in memory
    setRuntimeConfig(config);

    console.log("✅ Remote config loaded");

    await runSync();

    startSync(config.syncInterval || 5);

    console.log(`⏰ Sync scheduled every ${config.syncInterval || 5} mins`);
  } catch (err) {
    console.error("❌ Agent Init Failed:", err.message);
    throw err;
  }
}

module.exports = {
  initializeAgent,
};
