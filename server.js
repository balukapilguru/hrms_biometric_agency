const fs = require("fs-extra");
const { configPath } = require("./config/paths");
const { initializeAgent } = require("./services/agentService");
const { startSetupServer } = require("./setup/setupServer");
const { clear } = require("winston");

async function bootstrap() {
  try {
    let config = null;

    if (await fs.pathExists(configPath)) {
      config = await fs.readJson(configPath);
    }

    if (!config?.agentKey) {
      console.log("⚙️ Agent not configured");
      await startSetupServer();
      return;
    }

    await initializeAgent(config.agentKey);
  } catch (err) {
    console.error("❌ Bootstrap Failed:", err.message);
    console.error(err);
  }
}

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err);
});

process.on("SIGINT", () => {
  console.log("🛑 Agent shutting down...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("🛑 Agent terminated");
  process.exit(0);
});

bootstrap();
