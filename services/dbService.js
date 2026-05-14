const sql = require("mssql");
let pool = null;
const { getRemoteConfig } = require("./cloudService");

function getDbConfig(config) {
  return {
    user: config.dbUser,
    password: config.dbPassword,
    database: config.dbName,
    server: "DESKTOP-JM68784\\SQLEXPRESS",
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  };
}

async function getPool(config) {
  try {
    if (pool?.connected) {
      return pool;
    }
    pool = await sql.connect(getDbConfig(config));
    console.log("✅ MSSQL Pool Connected");

    return pool;
  } catch (err) {
    console.error("❌ MSSQL Pool Error:", err.message);
    pool = null;
    throw err;
  }
}

function getTableNamesBetween(startDate, endDate) {
  const tables = [];

  let current = new Date(startDate);

  current.setDate(1);

  while (current <= endDate) {
    const month = current.getMonth() + 1;
    const year = current.getFullYear();

    tables.push(`dbo.DeviceLogs_${month}_${year}`);

    current.setMonth(current.getMonth() + 1);
  }

  return [...new Set(tables)];
}

async function fetchLogs(config, lastSyncTime) {
  try {    
    const dbConfig = await getRemoteConfig(config.agentKey);
    const p = await getPool(dbConfig);
    let lastSync = lastSyncTime;
    if (!lastSync || isNaN(new Date(lastSync))) {
      lastSync = new Date(Date.now() - 24 * 60 * 60 * 1000);
    }

    function toIST(date) {
      return new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
    }

    const lastSyncDate = lastSync;
    const nowIST = toIST(new Date());
    const tables = getTableNamesBetween(lastSyncDate, nowIST);
    let allRows = [];

    for (const table of tables) {
      try {
        console.log(`📂 Reading ${table}`);

        const result = await p
          .request()
          .input("lastSyncTime", sql.DateTime, lastSyncDate)
          .input("currentTime", sql.DateTime, nowIST).query(`
            SELECT
              UserId,
              LogDate,
              Direction
            FROM ${table}
            WHERE LogDate > @lastSyncTime
              AND LogDate <= @currentTime
            ORDER BY LogDate ASC
          `);

        allRows.push(...result.recordset);
      } catch (err) {
        console.log(`⚠ Skipping ${table}`);
      }
    }

    allRows.sort((a, b) => new Date(a.LogDate) - new Date(b.LogDate));

    const logs = allRows.map((row) => ({
      USERID: row.UserId,
      CHECKTIME: row.LogDate,
      CHECKTYPE: row.Direction?.toLowerCase(),
    }));

    const newLastSyncTime =
      allRows.length > 0 ? allRows[allRows.length - 1].LogDate : lastSyncDate;

    return {
      logs,
      lastSyncTime: newLastSyncTime,
    };
  } catch (err) {
    console.error("❌ Fetch Logs Error:", err.message);

    return {
      logs: [],
      lastSyncTime,
    };
  }
}

module.exports = {
  fetchLogs,
};
