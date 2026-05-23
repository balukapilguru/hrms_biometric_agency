const express = require("express");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const open = require("open").default;
const { registerAgent } = require("../services/cloudService");
const { configPath } = require("../config/paths");

const app = express();
const PORT = 4001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function getLocalConfig() {
  try {
    if (await fs.pathExists(configPath)) {
      return await fs.readJson(configPath);
    }
    return null;
  } catch (err) {
    console.error("Failed reading local config:", err);
    return null;
  }
}

async function getRemoteConfig(agentKey) {
  const url =
    `${process.env.CLOUD_URL}` + `/client/api/deviceConfig/v1/get/${agentKey}`;
  const response = await axios.get(url, {
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "setup.html"));
});

app.get("/status", async (req, res) => {
  const localConfig = await getLocalConfig();
  res.json({
    configured: Boolean(localConfig?.agentKey),
    agentKey: localConfig?.agentKey || null,
  });
});

app.get("/config", async (req, res) => {
  try {
    const localConfig = await getLocalConfig();
    if (!localConfig?.agentKey) {
      return res.json({ configured: false, data: {} });
    }
    const remoteConfig = await getRemoteConfig(localConfig.agentKey);
    return res.json({
      configured: true,
      success: true,
      data: { ...remoteConfig, agentKey: localConfig.agentKey },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/save-config", async (req, res) => {
  try {
    const { agentKey } = req.body;
    if (!agentKey) {
      return res.status(400).json({
        success: false,
        message: "agentKey is required",
      });
    }

    // If already registered, short-circuit
    const existing = await getLocalConfig();
    if (existing?.agentKey) {
      return res.json({
        success: true,
        alreadyConfigured: true,
        message: "Agent already configured. Continuing.",
      });
    }

    // Register against cloud + persist to DB (inside registerAgent)
    await registerAgent(req);

    // Save minimal local config
    await fs.writeJson(configPath, { agentKey }, { spaces: 2 });

    res.json({ success: true, message: "Agent configured successfully" });

    // Restart app after response is flushed
    setTimeout(() => process.exit(0), 1000);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put("/update-config", async (req, res) => {
  try {
    const localConfig = await getLocalConfig();
    if (!localConfig?.agentKey) {
      return res
        .status(400)
        .json({ success: false, message: "Agent not configured" });
    }
    const url =
      `${process.env.CLOUD_URL}` +
      `/client/api/deviceConfig/v1/update/${localConfig.agentKey}`;
    const response = await axios.put(url, req.body, {
      headers: { "Content-Type": "application/json" },
    });
    return res.json({ success: true, data: response.data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

function startSetupServer() {
  return new Promise((resolve) => {
    app.listen(PORT, async () => {
      console.log(`🌐 Setup UI: http://localhost:${PORT}`);
      await open(`http://localhost:${PORT}`);
      resolve();
    });
  });
}

module.exports = { startSetupServer };
