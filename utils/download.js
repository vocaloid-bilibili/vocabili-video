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
const LOCK_TIMEOUT = 60 * 1000;

function isValidBvid(bvid) {
  if (!bvid || typeof bvid !== "string") return false;
  return /^BV[a-zA-Z0-9]{10}$/.test(bvid);
}

async function acquireLock(lockKey, timeout = LOCK_TIMEOUT) {
  if (downloadLocks.has(lockKey)) {
    const lock = downloadLocks.get(lockKey);
    if (Date.now() - lock.startTime > timeout) {
      if (lock.resolve) lock.resolve();
      downloadLocks.delete(lockKey);
    } else {
      try {
        await Promise.race([
          lock.promise,
          new Promise((_, rej) =>
            setTimeout(() => rej(new Error("timeout")), timeout),
          ),
        ]);
      } catch (e) {
        downloadLocks.delete(lockKey);
      }
      return false;
    }
  }

  let resolve;
  const promise = new Promise((r) => (resolve = r));
  downloadLocks.set(lockKey, { promise, resolve, startTime: Date.now() });
  return true;
}

function releaseLock(lockKey) {
  const lock = downloadLocks.get(lockKey);
  if (lock && lock.resolve) lock.resolve();
  downloadLocks.delete(lockKey);
}

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
      timeout: 30000,
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
  if (!isValidBvid(bvid)) return null;

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

  const lockKey = `full_${bvid}`;
  const gotLock = await acquireLock(lockKey);

  if (!gotLock) {
    // 等待结束，检查文件
    if (fs.existsSync(outputPath)) {
      try {
        const dur = await getDuration(outputPath);
        return { path: outputPath, duration: dur };
      } catch (e) {}
    }
    return null;
  }

  try {
    log(`下载视频: ${bvid}`);
    const url = `https://www.bilibili.com/video/${bvid}`;
    const cmd = `yt-dlp "${url}" -o "${outputPath}" --playlist-items 1 --format "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best" --merge-output-format mp4 --force-overwrites --no-warnings`;

    await execPromise(cmd);

    if (fs.existsSync(outputPath)) {
      const dur = await getDuration(outputPath);
      return { path: outputPath, duration: dur };
    }
    return null;
  } catch (e) {
    log(`下载失败: ${bvid}`);
    return null;
  } finally {
    releaseLock(lockKey);
  }
}

// 从完整视频裁剪片段
async function clipFromFullVideo(
  fullVideoPath,
  startTime,
  duration,
  outputPath,
) {
  const cmd = `ffmpeg -hwaccel cuda -ss ${startTime} -i "${fullVideoPath}" -t ${duration} -c:v h264_nvenc -preset p1 -rc vbr -cq 23 -r 60 -g 60 -bf 0 -pix_fmt yuv420p -movflags +faststart -c:a aac -ar 48000 -b:a 192k -y "${outputPath}"`;

  try {
    await execPromise(cmd);
    return true;
  } catch (e) {
    // GPU 失败，回退到 CPU
    const cpuCmd = `ffmpeg -ss ${startTime} -i "${fullVideoPath}" -t ${duration} -c:v libx264 -preset fast -crf 23 -r 60 -g 60 -bf 0 -pix_fmt yuv420p -movflags +faststart -c:a aac -ar 48000 -b:a 192k -y "${outputPath}"`;
    await execPromise(cpuCmd);
    return true;
  }
}

async function downloadClip(bvid, startTime, duration, retries = 3) {
  if (!isValidBvid(bvid)) return null;

  const fileName = `${bvid}_${startTime.toFixed(2)}_${duration}.mp4`;
  const outputPath = path.join(DIR_DOWNLOADS, fileName);

  // 已存在且有效
  if (fs.existsSync(outputPath)) {
    try {
      const actualDuration = await getDuration(outputPath);
      if (actualDuration >= duration - 1) {
        return outputPath;
      }
      fs.unlinkSync(outputPath);
    } catch (e) {
      fs.unlinkSync(outputPath);
    }
  }

  const lockKey = `clip_${fileName}`;
  const gotLock = await acquireLock(lockKey);

  if (!gotLock) {
    if (fs.existsSync(outputPath)) return outputPath;
  }

  try {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        if (attempt > 1) {
          await new Promise((r) => setTimeout(r, 2000 * attempt));
        }

        const fullVideo = await downloadFullVideoInternal(bvid);
        if (!fullVideo) {
          throw new Error("视频下载失败");
        }

        let clipDuration = duration;
        if (startTime + duration > fullVideo.duration + 1) {
          clipDuration = Math.max(5, fullVideo.duration - startTime);
        }

        await clipFromFullVideo(
          fullVideo.path,
          startTime,
          clipDuration,
          outputPath,
        );

        if (fs.existsSync(outputPath)) {
          const actualDuration = await getDuration(outputPath);
          if (actualDuration >= clipDuration - 2) {
            return outputPath;
          }
          fs.unlinkSync(outputPath);
        }
      } catch (e) {
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      }
    }

    log(`裁剪失败: ${bvid}`);
    return null;
  } finally {
    releaseLock(lockKey);
  }
}

async function downloadAudio(bvid, name) {
  if (!isValidBvid(bvid)) return null;

  const output = path.join(DIR_DOWNLOADS, name);
  if (fs.existsSync(output) && fs.statSync(output).size > 1000) return output;

  const cmd = `yt-dlp -x --audio-format mp3 --playlist-items 1 -o "${output}" "https://www.bilibili.com/video/${bvid}" --force-overwrites`;
  try {
    await execPromise(cmd);
    return output;
  } catch (e) {
    log(`音频下载失败: ${bvid}`);
    return null;
  }
}

module.exports = { downloadImage, downloadClip, downloadAudio };
