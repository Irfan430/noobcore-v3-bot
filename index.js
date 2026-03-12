const { spawn } = require("child_process");
require("ts-node/register");

const log = require("./core/logger/log.js");
const autoPushToGitHub = require("./git");
const config = require("./config.json");

const fileState = new Map();
const uploadQueue = new Map();

let autoPushInterval = null;
let isRunning = false;

/* ================= AUTO GIT PUSH ================= */

async function runAutoPush() {
  if (isRunning) {
    log.warn("⏳ Auto push still running — skip");
    return;
  }

  isRunning = true;

  try {
    await autoPushToGitHub({
      token: config.autogit.GITHUB_TOKEN,
      owner: config.autogit.owner,
      repo: config.autogit.repo,
      branch: config.autogit.branch || "main",
      rootDir: ".",
      fileState,
      uploadQueue
    });
  } catch (err) {
    log.error("❌ Auto push error:", err.message);
  } finally {
    isRunning = false;
  }
}

function startAutoPushLoop() {
  if (!config.autogit?.enable) {
    log.info("⏹️ AutoGit disabled in config");
    return;
  }

  if (autoPushInterval) return;

  const INTERVAL = (config.autogit.interval || 60) * 1000;

  runAutoPush();

  autoPushInterval = setInterval(() => {
    runAutoPush();
  }, INTERVAL);

  log.info(`📡 AutoGit started (${INTERVAL / 1000}s)`);
}

/* ================= PROJECT START ================= */

function startProject() {
  const child = spawn("node", ["NoobCore.js"], {
    cwd: __dirname,
    stdio: "inherit",
    shell: true
  });

  child.on("close", (code) => {
    log.warn(`⚠️ Project exited with code ${code}`);

    setTimeout(() => {
      log.info("🔄 Restarting Project...");
      startProject();
    }, 3000);
  });

  child.on("error", (err) => {
    log.error("❌ Failed to start project:", err.message);
  });
}

/* ================= RENDER KEEP ALIVE ================= */

function startServer() {
  const http = require("http");

  const PORT = process.env.PORT || 3000;

  http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("NoobCore Bot Running 🚀");
  }).listen(PORT, () => {
    log.info(`🌐 KeepAlive server running on port ${PORT}`);
  });
}

/* ================= START EVERYTHING ================= */

startProject();
startAutoPushLoop();
startServer();