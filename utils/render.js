// utils/render.js
const fs = require("fs-extra");
const path = require("path");
const { execPromise, addAudioFade } = require("./ffmpeg");
const { CHROME_EXECUTABLE, PORT } = require("../config");
const { log } = require("../state");
const { getCopyrightLabel } = require("./helpers");

const FPS = 60;
const CONCURRENCY = 4;

// 渲染组件（不带淡入淡出）
async function renderCompositionRaw(
  comp,
  props,
  name,
  dir,
  durationSec = null,
) {
  const out = path.join(dir, name);
  if (fs.existsSync(out)) return out;

  const temp = path.join(dir, `temp_props_${comp}_${Date.now()}.json`);
  fs.writeJsonSync(temp, props);

  try {
    log(`渲染 ${comp} -> ${name}${durationSec ? ` (${durationSec}s)` : ""}`);

    let cmd = `npx remotion render ${comp} "${out}" --props="${temp}" --browser-executable="${CHROME_EXECUTABLE}" --gl=angle --concurrency=${CONCURRENCY} --quiet`;

    if (durationSec) {
      const frames = Math.round(durationSec * FPS);
      cmd += ` --frames=0-${frames - 1}`;
    }

    await execPromise(cmd);
    return out;
  } catch (e) {
    log(`渲染失败 ${comp}: ${e.message}`);
    return null;
  } finally {
    if (fs.existsSync(temp)) fs.unlinkSync(temp);
  }
}

// 渲染组件（带1秒淡入淡出）
async function renderComposition(comp, props, name, dir, durationSec = null) {
  const finalPath = path.join(dir, name);
  if (fs.existsSync(finalPath)) return finalPath;

  const rawName = name.replace(".mp4", "_raw.mp4");
  const rawPath = path.join(dir, rawName);

  // 先渲染到临时文件
  const rendered = await renderCompositionRaw(
    comp,
    props,
    rawName,
    dir,
    durationSec,
  );

  if (rendered && fs.existsSync(rendered)) {
    // 添加淡入淡出
    log(`添加淡入淡出: ${name}`);
    await addAudioFade(rendered, finalPath, 2);
    // 删除临时文件
    fs.removeSync(rendered);
    return finalPath;
  }

  return null;
}

// 渲染榜单片段（带淡入淡出）
async function renderRankSegment(
  data,
  videoPath,
  thumb,
  type,
  dir,
  durationSec = 20,
  customFileName = null,
) {
  const baseName =
    customFileName ||
    `rank_${type}_${data.rank.toString().padStart(2, "0")}.mp4`;
  const finalPath = path.join(dir, baseName);

  if (fs.existsSync(finalPath)) return finalPath;

  const rawName = baseName.replace(".mp4", "_raw.mp4");
  const rawPath = path.join(dir, rawName);

  const videoUrl = `http://localhost:${PORT}/downloads/${path.basename(videoPath)}`;

  const props = {
    rank: data.rank,
    rank_before: data.rank_before,
    title: data.title,
    score: data.point,
    point_before: data.point_before || 0,
    score_rate: data.rate,
    fixA: data.fixA,
    fixB: data.fixB,
    fixC: data.fixC,
    fixD: data.fixD,
    count: data.count,
    uploader: data.uploader,
    copyrightLabel: getCopyrightLabel(data.copyright),
    vocalists: data.vocal,
    producers: data.author,
    synthesizers: data.synthesizer,
    bvid: data.bvid,
    pubdate: data.pubdate,
    duration: data.duration,
    songType: data.type,
    honor: data.honor,
    thumb,
    videoSource: videoUrl,
    view: data.view,
    view_rank: data.view_rank,
    view_rate: data.viewR,
    favorite: data.favorite,
    favorite_rank: data.favorite_rank,
    favorite_rate: data.favoriteR,
    coin: data.coin,
    coin_rank: data.coin_rank,
    coin_rate: data.coinR,
    like: data.like,
    like_rank: data.like_rank,
    like_rate: data.likeR,
    danmaku: data.danmaku,
    danmaku_rank: data.danmaku_rank,
    danmaku_rate: data.danmakuR,
    reply: data.reply,
    reply_rank: data.reply_rank,
    reply_rate: data.replyR,
    share: data.share,
    share_rank: data.share_rank,
    share_rate: data.shareR,
    daily_trends: data.daily_trends,
    main_rank: data.main_rank,
  };

  const temp = path.join(dir, `temp_props_rank_${type}_${data.rank}.json`);
  fs.writeJsonSync(temp, props);

  try {
    const typeName = type === "new" ? "新曲榜" : "主榜";
    log(`渲染 ${typeName} #${data.rank} (${durationSec}s)`);
    const compName = type === "new" ? "NewSongCard" : "RankCard";
    const frames = Math.round(durationSec * FPS);

    await execPromise(
      `npx remotion render ${compName} "${rawPath}" --props="${temp}" --browser-executable="${CHROME_EXECUTABLE}" --gl=angle --concurrency=${CONCURRENCY} --frames=0-${frames - 1} --quiet`,
    );

    if (fs.existsSync(rawPath)) {
      // 添加淡入淡出
      log(`添加淡入淡出: ${typeName} #${data.rank}`);
      await addAudioFade(rawPath, finalPath, 2);
      fs.removeSync(rawPath);
      return finalPath;
    }

    return null;
  } catch (e) {
    log(`渲染失败 ${type} #${data.rank}: ${e.message}`);
    return null;
  } finally {
    if (fs.existsSync(temp)) fs.unlinkSync(temp);
  }
}

async function renderStill(
  compositionId,
  props,
  outputName,
  outDir,
  frameNumber = 0,
) {
  const outPath = path.join(outDir, outputName);
  if (fs.existsSync(outPath)) return outPath;

  const temp = path.join(outDir, `temp_props_still_${Date.now()}.json`);
  fs.writeJsonSync(temp, props);

  try {
    const cmd = `npx remotion still ${compositionId} "${outPath}" --props="${temp}" --browser-executable="${CHROME_EXECUTABLE}" --frame=${frameNumber}`;
    log(`渲染封面: ${outputName} (frame ${frameNumber})`);
    await execPromise(cmd);
    return outPath;
  } catch (e) {
    log(`封面渲染失败: ${e.message}`);
    return null;
  } finally {
    if (fs.existsSync(temp)) fs.unlinkSync(temp);
  }
}

module.exports = { renderComposition, renderRankSegment, renderStill };
