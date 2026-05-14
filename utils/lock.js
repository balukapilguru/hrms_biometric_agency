let isRunning = false;

function acquireLock() {
  if (isRunning) return false;

  isRunning = true;
  return true;
}

function releaseLock() {
  isRunning = false;
}

module.exports = {
  acquireLock,
  releaseLock,
};