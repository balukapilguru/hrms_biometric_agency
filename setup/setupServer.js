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
