let runtimeConfig = null;

function setRuntimeConfig(config) {
  runtimeConfig = config;
}

function getRuntimeConfig() {
  return runtimeConfig;
}

module.exports = {
  setRuntimeConfig,
  getRuntimeConfig,
};
