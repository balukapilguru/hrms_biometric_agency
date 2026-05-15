const { startSync } = require("./services/syncService");
const { registerAgent, getRemoteConfig } = require("./services/cloudService");

async function start() {
  try {
    if (!localConfig.agentKey) {
      throw new Error("agentKey missing in config");
    }

    console.log("🔐 Verifying agent...");

    const registerResponse = await registerAgent(localConfig);

    if (!registerResponse.success) {
      console.log("❌ Registration failed:", registerResponse.message);

      return;
    }

    console.log("✅ Agent verified");
    console.log("☁️ Loading remote config...");

    const remoteConfig = await getRemoteConfig(localConfig?.agentKey);

    if (!remoteConfig) {
      throw new Error("Failed to load remote config");
    }

    console.log("✅ Remote config loaded");
    console.log("🚀 Agent started successfully");

    startSync(remoteConfig.syncInterval || 5, remoteConfig);
  } catch (err) {
    console.error("❌ Agent start failed:", err.message);
  }
}

start();
