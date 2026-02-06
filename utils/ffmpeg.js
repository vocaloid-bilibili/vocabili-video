// utils/ffmpeg.js
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs-extra");
const { log } = require("../state");

// 编码配置
const VIDEO_CODEC = "h264_nvenc";
const ENCODE_OPTS = "-preset p1 -rc vbr -cq 23 -b:v 6M -maxrate 10M";
const HWACCEL = "-hwaccel cuda";

function execPromise(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { maxBuffer: 1024 * 1024 * 100 }, (err, stdout, stderr) => {
      if (err) reject(err);
      else resolve(stdout);
    });
  });
}

async function getDuration(filePath) {
  const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`;
  const result = await execPromise(cmd);
  return parseFloat(result.trim());
}

async function addAudioFade(inputPath, outputPath, fadeDuration = 2) {
  const duration = await getDuration(inputPath);
  if (duration <= fadeDuration * 2) {
    await fs.copy(inputPath, outputPath);
    return outputPath;
  }

  const fadeOutStart = Math.max(0, duration - fadeDuration);
  const cmd = `ffmpeg ${HWACCEL} -i "${inputPath}" -af "afade=t=in:st=0:d=${fadeDuration},afade=t=out:st=${fadeOutStart}:d=${fadeDuration}" -c:v copy "${outputPath}" -y`;

  try {
    await execPromise(cmd);
    return outputPath;
  } catch (e) {
    log(`音频淡入淡出失败: ${e.message}`);
    await fs.copy(inputPath, outputPath);
    return outputPath;
  }
}

// 合并多个片段
async function concatVideos(list, outputName, dir) {
  const filtered = list.filter((p) => p && fs.existsSync(p));
  if (filtered.length === 0) return null;
  if (filtered.length === 1) return filtered[0];

  const out = path.join(dir, outputName);

  log(`合并 ${filtered.length} 个片段 -> ${outputName}`);

  const inputs = filtered.map((p) => `${HWACCEL} -i "${p}"`).join(" ");
  const filterParts = filtered.map((_, i) => `[${i}:v][${i}:a]`).join("");
  const filter = `${filterParts}concat=n=${filtered.length}:v=1:a=1[outv][outa]`;

  const cmd = `ffmpeg ${inputs} -filter_complex "${filter}" -map "[outv]" -map "[outa]" -c:v ${VIDEO_CODEC} ${ENCODE_OPTS} -r 60 -c:a aac -ar 48000 -b:a 192k "${out}" -y`;

  await execPromise(cmd);
  return out;
}

// P1 混音 OP
async function processP1(videoPath, audioPath, outputName, dir) {
  const out = path.join(dir, outputName);

  const cmd = `ffmpeg ${HWACCEL} -i "${videoPath}" -i "${audioPath}" -filter_complex "[1:a]afade=t=in:st=0:d=2,afade=t=out:st=43:d=2,volume=0.7[opa];[0:a][opa]amix=inputs=2:duration=first[outa]" -map 0:v -map "[outa]" -c:v ${VIDEO_CODEC} ${ENCODE_OPTS} -r 60 -c:a aac -ar 48000 -b:a 192k "${out}" -y`;
  log("P1 混音处理");
  await execPromise(cmd);
  return out;
}

// P3 混音 ED
async function processP3(p3Pre, p3Sub, edAudio, outputName, dir) {
  const out = path.join(dir, outputName);

  const preConcat = path.join(dir, "p3_concat_temp.mp4");

  let concatCmd = `ffmpeg ${HWACCEL} -i "${p3Pre}" ${HWACCEL} -i "${p3Sub}" -filter_complex "[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[outv][outa]" -map "[outv]" -map "[outa]" -c:v ${VIDEO_CODEC} ${ENCODE_OPTS} -r 60 -c:a aac -ar 48000 -b:a 192k "${preConcat}" -y`;
  await execPromise(concatCmd);

  const videoDuration = await getDuration(preConcat);
  const fadeOutStart = Math.max(0, videoDuration - 5);

  const cmd = `ffmpeg ${HWACCEL} -i "${preConcat}" -i "${edAudio}" -filter_complex "[1:a]afade=t=in:st=0:d=2,afade=t=out:st=${fadeOutStart}:d=5[eda];[0:a][eda]amix=inputs=2:duration=first[outa]" -map 0:v -map "[outa]" -c:v ${VIDEO_CODEC} ${ENCODE_OPTS} -r 60 -c:a aac -ar 48000 -b:a 192k "${out}" -y`;
  log("P3 ED混音处理");
  await execPromise(cmd);

  if (fs.existsSync(preConcat)) fs.unlinkSync(preConcat);
  return out;
}

// 最终合并
async function finalMerge(p1, p2, p3, output) {
  log("最终合并");

  const cmd = `ffmpeg ${HWACCEL} -i "${p1}" ${HWACCEL} -i "${p2}" ${HWACCEL} -i "${p3}" -filter_complex "[0:v][0:a][1:v][1:a][2:v][2:a]concat=n=3:v=1:a=1[outv][outa]" -map "[outv]" -map "[outa]" -c:v ${VIDEO_CODEC} ${ENCODE_OPTS} -r 60 -c:a aac -ar 48000 -b:a 192k "${output}" -y`;

  await execPromise(cmd);
}

module.exports = {
  execPromise,
  concatVideos,
  processP1,
  processP3,
  finalMerge,
  getDuration,
  addAudioFade,
};
