// utils/fullVideo.js
const fs = require("fs-extra");
const path = require("path");
const { execPromise, getDuration } = require("./ffmpeg");
const { DIR_FULL_VIDEO, PORT } = require("../config");
const { log } = require("../state");

fs.ensureDirSync(DIR_FULL_VIDEO);

const downloadLocks = new Map();

async function downloadFullVideo(bvid) {
  const outputPath = path.join(DIR_FULL_VIDEO, `${bvid}.mp4`);
  const publicUrl = `http://localhost:${PORT}/downloads/full_videos/${bvid}.mp4`;

  // 已存在
  if (fs.existsSync(outputPath)) {
    try {
      const dur = await getDuration(outputPath);
      if (dur > 10) {
        return { path: outputPath, url: publicUrl, duration: dur };
      }
    } catch (e) {
      fs.unlinkSync(outputPath);
    }
  }

  // 下载锁
  if (downloadLocks.has(bvid)) {
    log(`等待完整视频下载: ${bvid}`);
    await downloadLocks.get(bvid);
    if (fs.existsSync(outputPath)) {
      const dur = await getDuration(outputPath);
      return { path: outputPath, url: publicUrl, duration: dur };
    }
  }

  let resolve;
  const lockPromise = new Promise((r) => (resolve = r));
  downloadLocks.set(bvid, lockPromise);

  try {
    log(`下载完整视频: ${bvid}`);
    const url = `https://www.bilibili.com/video/${bvid}`;

    const cmd = `yt-dlp "${url}" -o "${outputPath}" --playlist-items 1 --format "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best" --merge-output-format mp4 --force-overwrites --no-warnings`;

    await execPromise(cmd);

    if (fs.existsSync(outputPath)) {
      const dur = await getDuration(outputPath);
      log(`完整视频下载完成: ${bvid} (${dur.toFixed(1)}s)`);
      return { path: outputPath, url: publicUrl, duration: dur };
    }
    return null;
  } catch (e) {
    log(`完整视频下载失败 ${bvid}: ${e.message}`);
    return null;
  } finally {
    downloadLocks.delete(bvid);
    resolve();
  }
}

function getFullVideoInfo(bvid) {
  const outputPath = path.join(DIR_FULL_VIDEO, `${bvid}.mp4`);
  const publicUrl = `http://localhost:${PORT}/downloads/full_videos/${bvid}.mp4`;

  if (fs.existsSync(outputPath)) {
    return { path: outputPath, url: publicUrl, exists: true };
  }
  return { exists: false };
}

module.exports = {
  downloadFullVideo,
  getFullVideoInfo,
};
