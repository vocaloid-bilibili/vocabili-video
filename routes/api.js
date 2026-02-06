// routes/api.js
const express = require("express");
const multer = require("multer");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const {
  DIR_DATA,
  DIR_VIDEO_ROOT,
  API_KEY,
  PYTHON_API,
  PORT,
} = require("../config");
const {
  getTask,
  resetTask,
  setTaskStatus,
  log,
  TASK_STATUS,
} = require("../state");
const { getPaths } = require("../utils/helpers");
const {
  runSynthesisTask,
  runMergeOnly,
  reRenderSegment,
} = require("../synthesis/task");
const {
  getClipSetting,
  setClipSetting,
  deleteClipSetting,
  getAllClipSettings,
} = require("../utils/clips");
const { downloadFullVideo, getFullVideoInfo } = require("../utils/fullVideo");

const router = express.Router();

// 鉴权
router.use((req, res, next) => {
  const clientKey = req.headers["x-api-key"] || req.query.key;
  if (!clientKey || clientKey !== API_KEY) {
    return res.status(401).send({ error: "Unauthorized" });
  }
  next();
});

// Multer 配置
const segmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const date = req.body.date;
    if (!date) return cb(new Error("缺少日期参数"));
    const dir = path.join(DIR_VIDEO_ROOT, date, "segments");
    fs.ensureDirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    file.originalname = Buffer.from(file.originalname, "latin1").toString(
      "utf8",
    );
    cb(null, file.originalname);
  },
});
const uploadSegment = multer({ storage: segmentStorage });

const dataStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, DIR_DATA),
  filename: (req, file, cb) => {
    file.originalname = Buffer.from(file.originalname, "latin1").toString(
      "utf8",
    );
    cb(null, file.originalname);
  },
});
const uploadData = multer({ storage: dataStorage });

// ========== 原有API ==========

// 上传数据文件
router.post("/upload", uploadData.array("files"), (req, res) => {
  const names = req.files.map((f) => f.filename);
  log(`上传数据文件: ${names.join(", ")}`);
  res.send({ status: "success", files: names });
});

// 获取文件列表
router.get("/files", async (req, res) => {
  try {
    const files = await fs.readdir(DIR_DATA);
    const dataFiles = files.filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f));
    const result = await Promise.all(
      dataFiles.map(async (f) => {
        const date = f.replace(".json", "");
        const { final } = getPaths(date);
        const hasVideo = await fs.pathExists(final);
        return {
          date,
          dataFile: f,
          infoFile: files.includes(`${date}信息.json`)
            ? `${date}信息.json`
            : null,
          hasVideo,
        };
      }),
    );
    res.send({ files: result.sort((a, b) => b.date.localeCompare(a.date)) });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

// 获取分片列表
router.get("/segments", async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).send({ error: "缺少日期参数" });
  try {
    const { segments } = getPaths(date);
    if (!(await fs.pathExists(segments))) {
      return res.send({ segments: [] });
    }
    const files = await fs.readdir(segments);
    res.send({ segments: files.filter((f) => f.endsWith(".mp4")).sort() });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

// 上传替换分片
router.post("/segment/upload", uploadSegment.single("file"), (req, res) => {
  if (!req.file) return res.status(400).send({ error: "上传失败" });
  log(`手动上传分片: ${req.body.date}/${req.file.filename}`);
  res.send({ status: "success", filename: req.file.filename });
});

// 删除分片
router.delete("/segment", async (req, res) => {
  const { date, name } = req.body;
  if (!date || !name) return res.status(400).send({ error: "参数不完整" });

  try {
    const { segments } = getPaths(date);
    const filePath = path.join(segments, name);
    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
      log(`删除分片: ${date}/${name}`);
      res.send({ status: "success" });
    } else {
      res.status(404).send({ error: "文件不存在" });
    }
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

// 获取任务状态
router.get("/status", (req, res) => res.send(getTask()));

// 全量合成
router.post("/synthesis/start", async (req, res) => {
  const { date } = req.body;
  const task = getTask();

  if (!date) return res.status(400).send({ error: "缺少日期" });
  if (task.status === TASK_STATUS.PROCESSING) {
    return res.status(400).send({ error: "任务进行中" });
  }

  resetTask(date);
  log(`开始全量合成: ${date}`);
  res.send({ status: "started" });

  runSynthesisTask(date).catch((e) => {
    setTaskStatus(TASK_STATUS.FAILED, e.message);
    log(`任务失败: ${e.message}`);
  });
});

// 仅合并（复用现有分片）
router.post("/synthesis/merge", async (req, res) => {
  const { date } = req.body;
  const task = getTask();

  if (!date) return res.status(400).send({ error: "缺少日期" });
  if (task.status === TASK_STATUS.PROCESSING) {
    return res.status(400).send({ error: "任务进行中" });
  }

  resetTask(date);
  log(`开始合并: ${date}`);
  res.send({ status: "started" });

  const fn =
    typeof runMergeOnly === "function" ? runMergeOnly : runSynthesisTask;
  fn(date).catch((e) => {
    setTaskStatus(TASK_STATUS.FAILED, e.message);
    log(`合并失败: ${e.message}`);
  });
});

// 单片重绘
router.post("/synthesis/segment", async (req, res) => {
  const { date, type, rank, segmentName } = req.body;
  const task = getTask();

  if (!date) return res.status(400).send({ error: "缺少日期" });
  if (task.status === TASK_STATUS.PROCESSING) {
    return res.status(400).send({ error: "任务进行中" });
  }

  try {
    const { segments } = getPaths(date);
    let targetFile = segmentName;

    if (type && rank) {
      targetFile = `rank_${type}_${rank.toString().padStart(2, "0")}.mp4`;
    }

    if (targetFile) {
      const filePath = path.join(segments, targetFile);
      if (await fs.pathExists(filePath)) {
        await fs.remove(filePath);
        log(`删除分片以触发重绘: ${targetFile}`);
      }
    }

    res.send({
      status: "success",
      message: `已删除 ${targetFile}，下次合成时会重新生成`,
    });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

// ========== 新增：歌曲和裁切API ==========

// 获取某期的所有歌曲
router.get("/songs/:date", async (req, res) => {
  const { date } = req.params;
  const dataFile = path.join(DIR_DATA, `${date}.json`);

  if (!fs.existsSync(dataFile)) {
    return res.status(404).send({ error: "数据文件不存在" });
  }

  try {
    const data = await fs.readJson(dataFile);
    const newRankList = (data.new_rank_top10 || []).slice(0, 10);
    const mainRankList = (data.total_rank_top20 || []).slice(0, 20);

    // 附加裁切信息和视频信息
    const enrichSong = (song, type) => {
      const clip = getClipSetting(song.bvid);
      const video = getFullVideoInfo(song.bvid);
      return {
        ...song,
        _type: type,
        _clip: clip,
        _videoExists: video.exists,
        _videoUrl: video.exists ? video.url : null,
      };
    };

    const songs = {
      newRank: newRankList.map((s) => enrichSong(s, "new")),
      mainRank: mainRankList.map((s) => enrichSong(s, "main")),
    };

    res.send({ date, songs, index: data.index });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

// 获取所有裁切设置
router.get("/clips", (req, res) => {
  res.send(getAllClipSettings());
});

// 获取单个裁切设置
router.get("/clips/:bvid", (req, res) => {
  const clip = getClipSetting(req.params.bvid);
  if (clip) {
    res.send(clip);
  } else {
    res.send({ exists: false });
  }
});

// 保存裁切设置
router.post("/clips/:bvid", (req, res) => {
  const { bvid } = req.params;
  const { startTime, endTime } = req.body;

  if (typeof startTime !== "number" || startTime < 0) {
    return res.status(400).send({ error: "startTime 无效" });
  }

  const result = setClipSetting(bvid, startTime, endTime);
  log(`保存裁切设置: ${bvid} (${result.startTime}s - ${result.endTime}s)`);
  res.send({ success: true, clip: result });
});

// 删除裁切设置
router.delete("/clips/:bvid", (req, res) => {
  const deleted = deleteClipSetting(req.params.bvid);
  if (deleted) {
    log(`删除裁切设置: ${req.params.bvid}`);
  }
  res.send({ success: deleted });
});

// 下载完整视频（用于预览）
router.post("/full-video/:bvid", async (req, res) => {
  const { bvid } = req.params;

  try {
    const result = await downloadFullVideo(bvid);
    if (result) {
      res.send({ success: true, ...result });
    } else {
      res.status(500).send({ error: "下载失败" });
    }
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

// 批量下载完整视频
router.post("/full-video/batch", async (req, res) => {
  const { bvids } = req.body;
  if (!Array.isArray(bvids)) {
    return res.status(400).send({ error: "bvids 必须是数组" });
  }

  // 立即返回，后台下载
  res.send({ success: true, message: `开始下载 ${bvids.length} 个视频` });

  // 串行下载避免过载
  for (const bvid of bvids) {
    try {
      await downloadFullVideo(bvid);
    } catch (e) {
      log(`批量下载失败 ${bvid}: ${e.message}`);
    }
  }
});

// 自动分析高潮点（调用Python）
router.post("/analyze/:bvid", async (req, res) => {
  const { bvid } = req.params;
  const { duration = 20 } = req.body;

  try {
    const result = await axios.post(PYTHON_API, { bvid, duration });
    res.send(result.data);
  } catch (e) {
    res.status(500).send({ error: "分析失败", message: e.message });
  }
});

module.exports = router;
