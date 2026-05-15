const express = require("express");
const fs = require("fs-extra");
const path = require("path");
const open = require("open").default;
const { registerAgent } = require("../services/cloudService");
const { configPath } = require("../config/paths");

const app = express();

const PORT = 4001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "setup.html"));
});

app.post("/save-config", async (req, res) => {
  try {
    const { agentKey, dbHost, dbUser, dbPassword, dbName } = req.body;

    if (!agentKey) {
      return res.status(400).json({
        success: false,
        message: "agentKey and cloudUrl required",
      });
    }

    // Validate/Register agent
    await registerAgent(req);

    // Save minimal config
    await fs.writeJson(
      configPath,
      {
        agentKey: req.body.agentKey,
      },
      { spaces: 2 },
    );

    res.json({
      success: true,
      message: "Agent configured successfully",
    });

    // Restart app
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

app.get("/config", async (req, res) => {
  try {
    const localConfig = await getLocalConfig();

    if (!localConfig?.agentKey) {
      return res.json({});
    }

    const remoteConfig = await getRemoteConfig(
      localConfig.agentKey
    );

    return res.json({
      success: true,
      data: remoteConfig,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

app.put("/update-config", async (req, res) => {
  try {
    const localConfig = await getLocalConfig();

    if (!localConfig?.agentKey) {
      return res.status(400).json({
        success: false,
        message: "Agent not configured",
      });
    }

    const url =
      `${process.env.CLOUD_URL}` +
      `/client/api/deviceConfig/v1/update/${localConfig.agentKey}`;

    const response = await axios.put(
      url,
      req.body,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return res.json({
      success: true,
      data: response.data,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
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

module.exports = {
  startSetupServer,
};
