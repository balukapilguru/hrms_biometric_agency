const axios = require("axios");
const {
  saveFailedLogs,
  getQueuedLogs,
  removeQueue,
} = require("./queueService");
const API_TIMEOUT = 30000;
require("dotenv").config({
  quiet: true,
});

async function registerAgent(req) {
  const url = `${process.env.CLOUD_URL}/client/api/deviceConfig/v1/agent/register`;

  try {
    const response = await axios.post(url, req.body, {
      timeout: API_TIMEOUT,
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("✅ Agent Registered");

    return response.data;
  } catch (error) {
    handleAxiosError(error, "Agent Registration Failed");
    throw error;
  }
}

async function getRemoteConfig(agentKey) {
  const url = `${process.env.CLOUD_URL}/client/api/deviceConfig/v1/agent/getById/${agentKey}`;
  try {
    const response = await axios.get(url, {
      timeout: API_TIMEOUT,
    });

    console.log("✅ Remote Config Loaded");

    return response.data.data;
  } catch (error) {
    handleAxiosError(error, "Fetching Remote Config Failed");
    throw error;
  }
}

async function updateLastSync(config, lastSyncTime) {
  const url =
    `${process.env.CLOUD_URL}` +
    `/client/api/deviceConfig/v1/agent/updateLastSync/${config.publicId}`;

  try {
    console.log("🔄 Updating last sync...", {
      publicId: config.publicId,
      lastSyncTime,
    });

    const response = await axios.patch(
      url,
      {
        config,
        lastSyncTime,
      },
      {
        timeout: API_TIMEOUT,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    console.log("✅ Last sync updated successfully", {
      status: response.status,
      publicId: config.publicId,
      lastSyncTime,
    });

    return response.data;
  } catch (error) {
    console.error("❌ Failed to update last sync");

    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error("Error:", error.message);
    }

    throw error;
  }
}

async function sendLogs(config, logs, retryCount = 0) {
  const url = `${process.env.CLOUD_URL}/client/api/attendance/v1/biometric/sync`;
  console.log("📡 Sending logs...");

  try {
    const response = await axios.post(
      url,
      {
        agentKey: config.agentKey,
        logs,
      },
      {
        timeout: API_TIMEOUT,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    console.log("✅ API Response:", response.status);

    // UPDATE CLOUD LAST SYNC
    if (response.status === 200) {
      const now = new Date();

      const formatted =
        now.getFullYear() +
        "-" +
        String(now.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(now.getDate()).padStart(2, "0") +
        " " +
        String(now.getHours()).padStart(2, "0") +
        ":" +
        String(now.getMinutes()).padStart(2, "0") +
        ":" +
        String(now.getSeconds()).padStart(2, "0");

      const lastSyncTime = formatted;
      await updateLastSync(config, lastSyncTime);
    }

    return response.data;
  } catch (error) {
    handleAxiosError(error, "API Error");

    if (retryCount < 3) {
      console.log(`🔁 Retrying... (${retryCount + 1})`);
      await delay(2000);
      return sendLogs(config, logs, lastSyncTime, retryCount + 1);
    }

    await saveFailedLogs({
      config,
      logs,
      lastSyncTime,
    });
    console.error("❌ Max retries reached. Failed to send logs.");

    throw error;
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function handleAxiosError(error, title) {
  console.error(`❌ ${title}`);

  if (error.response) {
    console.error("Status:", error.response.status);
    console.error("Data:", error.response.data);
  } else {
    console.error("Error:", error.message);
  }
}
module.exports = { registerAgent, getRemoteConfig, updateLastSync, sendLogs };
