// utils/download.js
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");
const { execPromise, getDuration } = require("./ffmpeg");
const {
  DIR_DOWNLOADS,
  DIR_IMAGES,
  DIR_FULL_VIDEO,
  PORT,
} = require("../config");
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

// 下载完整视频（仅P1）
async function downloadFullVideoInternal(bvid) {
  fs.ensureDirSync(DIR_FULL_VIDEO);
  const outputPath = path.join(DIR_FULL_VIDEO, `${bvid}.mp4`);

  // 已存在且有效
  if (fs.existsSync(outputPath)) {
    try {
      const dur = await getDuration(outputPath);
      if (dur > 10) {
        return { path: outputPath, duration: dur };
      }
    } catch (e) {
      fs.unlinkSync(outputPath);
    }
  }

  // 下载锁
  const lockKey = `full_${bvid}`;
  if (downloadLocks.has(lockKey)) {
    log(`等待完整视频下载: ${bvid}`);
    await downloadLocks.get(lockKey);
    if (fs.existsSync(outputPath)) {
      const dur = await getDuration(outputPath);
      return { path: outputPath, duration: dur };
    }
    return null;
  }

  let resolve;
  const lockPromise = new Promise((r) => (resolve = r));
  downloadLocks.set(lockKey, lockPromise);

  try {
    log(`下载完整视频: ${bvid}`);
    const url = `https://www.bilibili.com/video/${bvid}`;

    // 关键：--playlist-items 1 确保只下载P1
    const cmd = `yt-dlp "${url}" -o "${outputPath}" --playlist-items 1 --format "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best" --merge-output-format mp4 --force-overwrites --no-warnings`;

    await execPromise(cmd);

    if (fs.existsSync(outputPath)) {
      const dur = await getDuration(outputPath);
      log(`完整视频下载完成: ${bvid} (${dur.toFixed(1)}s)`);
      return { path: outputPath, duration: dur };
    }
    return null;
  } catch (e) {
    log(`完整视频下载失败 ${bvid}: ${e.message}`);
    return null;
  } finally {
    downloadLocks.delete(lockKey);
    resolve();
  }
}

// 从完整视频裁剪片段（GPU加速）
async function clipFromFullVideo(
  fullVideoPath,
  startTime,
  duration,
  outputPath,
) {
  // GPU 解码 + 编码
  const cmd = `ffmpeg -hwaccel cuda -ss ${startTime} -i "${fullVideoPath}" -t ${duration} -c:v h264_nvenc -preset p1 -rc vbr -cq 23 -r 60 -g 60 -bf 0 -pix_fmt yuv420p -movflags +faststart -c:a aac -ar 48000 -b:a 192k -y "${outputPath}"`;

  try {
    await execPromise(cmd);
    return true;
  } catch (e) {
    // GPU 失败，回退到 CPU
    log(`GPU裁剪失败，使用CPU: ${e.message.split("\n")[0]}`);
    const cpuCmd = `ffmpeg -ss ${startTime} -i "${fullVideoPath}" -t ${duration} -c:v libx264 -preset fast -crf 23 -r 60 -g 60 -bf 0 -pix_fmt yuv420p -movflags +faststart -c:a aac -ar 48000 -b:a 192k -y "${outputPath}"`;
    await execPromise(cpuCmd);
    return true;
  }
}

async function downloadClip(bvid, startTime, duration, retries = 3) {
  const fileName = `${bvid}_${startTime.toFixed(2)}_${duration}.mp4`;
  const outputPath = path.join(DIR_DOWNLOADS, fileName);

  // 已存在且有效
  if (fs.existsSync(outputPath)) {
    try {
      const actualDuration = await getDuration(outputPath);
      if (actualDuration >= duration - 1) {
        return outputPath;
      }
      log(`视频不完整 ${fileName}，重新裁剪`);
      fs.unlinkSync(outputPath);
    } catch (e) {
      log(`视频损坏 ${fileName}，重新裁剪`);
      fs.unlinkSync(outputPath);
    }
  }

  // 片段下载锁
  const lockKey = `clip_${fileName}`;
  if (downloadLocks.has(lockKey)) {
    log(`等待片段处理: ${fileName}`);
    await downloadLocks.get(lockKey);
    if (fs.existsSync(outputPath)) return outputPath;
  }

  let resolve;
  const lockPromise = new Promise((r) => (resolve = r));
  downloadLocks.set(lockKey, lockPromise);

  let lastError = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (attempt > 1) {
        log(`重试裁剪 (${attempt}/${retries}): ${bvid}`);
        await new Promise((r) => setTimeout(r, 2000 * attempt));
      }

      // 1. 获取或下载完整视频
      const fullVideo = await downloadFullVideoInternal(bvid);
      if (!fullVideo) {
        throw new Error("完整视频下载失败");
      }

      // 2. 检查裁剪范围是否有效
      if (startTime + duration > fullVideo.duration + 1) {
        log(
          `警告: 裁剪范围超出视频时长 (${startTime}+${duration} > ${fullVideo.duration.toFixed(1)})`,
        );
        // 调整 duration
        duration = Math.max(5, fullVideo.duration - startTime);
      }

      // 3. 从完整视频裁剪
      log(
        `裁剪片段: ${bvid} (${startTime.toFixed(1)}s - ${(startTime + duration).toFixed(1)}s)`,
      );
      await clipFromFullVideo(fullVideo.path, startTime, duration, outputPath);

      // 4. 验证
      if (fs.existsSync(outputPath)) {
        const actualDuration = await getDuration(outputPath);
        if (actualDuration >= duration - 2) {
          log(`裁剪完成: ${fileName} (${actualDuration.toFixed(1)}s)`);
          downloadLocks.delete(lockKey);
          resolve();
          return outputPath;
        } else {
          log(`裁剪不完整: ${actualDuration.toFixed(1)}s < ${duration}s`);
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
          lastError = new Error("裁剪时长不足");
          continue;
        }
      }
    } catch (e) {
      lastError = e;
      const shortMsg = e.message.split("\n")[0].substring(0, 100);
      log(`裁剪出错 (${attempt}/${retries}): ${shortMsg}`);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      continue;
    }
  }

  log(`裁剪失败 ${bvid}: 重试${retries}次后仍失败`);
  downloadLocks.delete(lockKey);
  resolve();
  return null;
}

async function downloadAudio(bvid, name) {
  const output = path.join(DIR_DOWNLOADS, name);
  if (fs.existsSync(output) && fs.statSync(output).size > 1000) return output;

  // 关键：--playlist-items 1 确保只下载P1的音频
  const cmd = `yt-dlp -x --audio-format mp3 --playlist-items 1 -o "${output}" "https://www.bilibili.com/video/${bvid}" --force-overwrites`;
  try {
    await execPromise(cmd);
    return output;
  } catch (e) {
    log(`音频下载失败 ${bvid}`);
    return null;
  }
}

module.exports = { downloadImage, downloadClip, downloadAudio };
