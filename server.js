// server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs-extra");
const { spawn } = require("child_process");

const {
  PORT,
  DIR_DATA,
  DIR_DOWNLOADS,
  DIR_IMAGES,
  DIR_VIDEO_ROOT,
  DIR_AUDIO_CACHE,
  DIR_FULL_VIDEO,
} = require("./config");
const apiRoutes = require("./routes/api");

// 确保目录存在
fs.ensureDirSync(DIR_DATA);
fs.ensureDirSync(DIR_DOWNLOADS);
fs.ensureDirSync(DIR_IMAGES);
fs.ensureDirSync(DIR_VIDEO_ROOT);
fs.ensureDirSync(DIR_AUDIO_CACHE);

// 启动 Python 分析服务
let pythonProcess = null;

function startPythonAnalyzer() {
  const script = path.join(__dirname, "analyzer", "chorus_analyzer.py");

  if (!fs.existsSync(script)) {
    console.log("[WARN] chorus_analyzer.py not found, skip python service");
    return;
  }

  pythonProcess = spawn("python", [script], {
    cwd: __dirname,
    stdio: ["ignore", "pipe", "pipe"],
  });

  pythonProcess.stdout.on("data", (data) => {
    console.log(`[Python] ${data.toString().trim()}`);
  });

  pythonProcess.stderr.on("data", (data) => {
    console.log(`[Python] ${data.toString().trim()}`);
  });

  pythonProcess.on("close", (code) => {
    console.log(`[Python] process exited with code ${code}`);
    // 意外退出时重启
    if (code !== 0 && code !== null) {
      console.log("[Python] restarting in 3s...");
      setTimeout(startPythonAnalyzer, 3000);
    }
  });

  pythonProcess.on("error", (err) => {
    console.log(`[Python] failed to start: ${err.message}`);
  });

  console.log("[Python] chorus analyzer started on port 8000");
}

// 清理退出
process.on("SIGINT", () => {
  if (pythonProcess) {
    pythonProcess.kill();
  }
  process.exit();
});

process.on("SIGTERM", () => {
  if (pythonProcess) {
    pythonProcess.kill();
  }
  process.exit();
});

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/downloads", express.static(DIR_DOWNLOADS));
app.use("/downloads/full_videos", express.static(DIR_FULL_VIDEO));
app.use("/video", express.static(DIR_VIDEO_ROOT));

app.use("/api", apiRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startPythonAnalyzer();
});
