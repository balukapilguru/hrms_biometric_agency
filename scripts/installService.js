const Service = require("node-windows").Service;

const svc = new Service({
  name: "EmplaiBiometricAgent",
  description: "Emplai Biometric Background Agent",
  script: require("path").join(__dirname, "../server.js"),
});

svc.on("install", () => {
  svc.start();
});

svc.install();
