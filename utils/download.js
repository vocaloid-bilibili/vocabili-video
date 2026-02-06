// utils/download.js
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");
const { execPromise, getDuration } = require("./ffmpeg");
const { DIR_DOWNLOADS, DIR_IMAGES, PORT } = require("../config");
const { log } = require("../state");

const downloadLocks = new Map();

async function downloadImage(url) {
  if (!url) return "";
  const hash = crypto.createHash("md5").update(url).digest("hex");
  const ext = path.extname(url).split("?")[0] || ".jpg";
  const filename = `${hash}${ext}`;
  const localPath = path.join(DIR_IMAGES, filename);
  const publicUrl = `http://localhost:${PORT}/downloads/images/${filename}`;

  if (fs.existsSync(localPath)) return publicUrl;

  try {
    const res = await axios({
      url,
      method: "GET",
      responseType: "stream",
      headers: {
        Referer: "https://www.bilibili.com/",
        "User-Agent": "Mozilla/5.0",
      },
    });
    const w = fs.createWriteStream(localPath);
    res.data.pipe(w);
    return new Promise((resolve, reject) => {
      w.on("finish", () => resolve(publicUrl));
      w.on("error", reject);
    });
  } catch (e) {
    return url;
  }
}

async function downloadClip(bvid, startTime, duration, retries = 3) {
  const fileName = `${bvid}_${startTime.toFixed(2)}_${duration}.mp4`;
  const outputPath = path.join(DIR_DOWNLOADS, fileName);
  const rawPath = path.join(
    DIR_DOWNLOADS,
    `raw_${Date.now()}_${Math.random().toString(36).slice(2)}.mp4`,
  );

  // 已存在且有效
  if (fs.existsSync(outputPath)) {
    try {
      const actualDuration = await getDuration(outputPath);
      if (actualDuration >= duration - 1) {
        return outputPath;
      }
      log(`视频不完整 ${fileName}，重新下载`);
      fs.unlinkSync(outputPath);
    } catch (e) {
      log(`视频损坏 ${fileName}，重新下载`);
      fs.unlinkSync(outputPath);
    }
  }

  // 下载锁
  if (downloadLocks.has(fileName)) {
    log(`等待下载完成: ${fileName}`);
    await downloadLocks.get(fileName);
    if (fs.existsSync(outputPath)) return outputPath;
  }

  let resolve;
  const lockPromise = new Promise((r) => (resolve = r));
  downloadLocks.set(fileName, lockPromise);

  let lastError = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (attempt > 1) {
        log(`重试下载 (${attempt}/${retries}): ${bvid}`);
        await new Promise((r) => setTimeout(r, 2000 * attempt));
      } else {
        log(`下载片段: ${bvid} (${startTime}s - ${startTime + duration}s)`);
      }

      const url = `https://www.bilibili.com/video/${bvid}`;
      const ytdlpCmd = `yt-dlp --downloader ffmpeg --downloader-args "ffmpeg_i:-ss ${startTime} -t ${duration}" "${url}" -o "${rawPath}" --format "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --force-overwrites --no-warnings`;

      await execPromise(ytdlpCmd);

      if (fs.existsSync(rawPath)) {
        log(`转码修复: ${fileName}`);
        // 强制 60fps + 每秒关键帧 + 禁用 B 帧 + 标准像素格式
        const fixCmd = `ffmpeg -i "${rawPath}" -c:v libx264 -preset fast -crf 23 -r 60 -g 60 -bf 0 -pix_fmt yuv420p -movflags +faststart -c:a aac -ar 48000 -b:a 192k -y "${outputPath}"`;
        await execPromise(fixCmd);

        if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath);

        const actualDuration = await getDuration(outputPath);
        if (actualDuration >= duration - 2) {
          log(`下载完成: ${fileName} (${actualDuration.toFixed(1)}s)`);
          downloadLocks.delete(fileName);
          resolve();
          return outputPath;
        } else {
          log(
            `下载不完整: ${fileName} (${actualDuration.toFixed(1)}s < ${duration}s)`,
          );
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
          lastError = new Error("视频时长不足");
          continue;
        }
      }
    } catch (e) {
      lastError = e;
      const shortMsg = e.message.split("\n")[0].substring(0, 100);
      log(`下载出错 (${attempt}/${retries}): ${shortMsg}`);
      if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      continue;
    }
  }

  log(`下载失败 ${bvid}: 重试${retries}次后仍失败`);
  downloadLocks.delete(fileName);
  resolve();
  return null;
}

async function downloadAudio(bvid, name) {
  const output = path.join(DIR_DOWNLOADS, name);
  if (fs.existsSync(output) && fs.statSync(output).size > 1000) return output;

  const cmd = `yt-dlp -x --audio-format mp3 -o "${output}" "https://www.bilibili.com/video/${bvid}" --force-overwrites`;
  try {
    await execPromise(cmd);
    return output;
  } catch (e) {
    log(`音频下载失败 ${bvid}`);
    return null;
  }
}

module.exports = { downloadImage, downloadClip, downloadAudio };
