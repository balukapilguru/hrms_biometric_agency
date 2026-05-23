const Service = require("node-windows").Service;
const path = require("path");
const fs = require("fs-extra");

const daemonPath = path.join(
  __dirname,
  "../daemon"
);

const svc = new Service({
  name: "EmplaiBiometricAgent",
  script: path.join(__dirname, "../server.js"),
});

svc.on("uninstall", async () => {

  console.log("✅ Service removed");

  if (await fs.pathExists(daemonPath)) {
    await fs.remove(daemonPath);

    console.log("🗑 Daemon cleaned");
  }

  process.exit();
});

svc.uninstall();