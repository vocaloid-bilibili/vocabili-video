// synthesis/task.js
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const {
  DIR_DATA,
  DIR_DOWNLOADS,
  PYTHON_API,
  PORT,
  STAFF_LIST,
} = require("../config");
const { log, updateProgress, setTaskStatus, TASK_STATUS } = require("../state");
const { getPaths, chunkArray } = require("../utils/helpers");
const {
  downloadImage,
  downloadClip,
  downloadAudio,
} = require("../utils/download");
const {
  concatVideos,
  processP1,
  processP3,
  finalMerge,
  getDuration,
} = require("../utils/ffmpeg");
const {
  renderComposition,
  renderRankSegment,
  renderStill,
} = require("../utils/render");
const { getClipSetting } = require("../utils/clips");

// 时长配置
const DUR_INTRO = 3;
const DUR_INFOCARD = 5;
const DUR_RULES = 35;
const DUR_SECTION_TITLE = 2;
const DUR_SHORT = 7;
const FPS = 60;

// 并行配置
const DOWNLOAD_CONCURRENCY = 4;
const RENDER_POOL_SIZE = 2;
const SUB_RANK_POOL_SIZE = 4;

// 获取裁切参数（仅自动分析，不检查手动设置）
async function autoAnalyzeClip(bvid, defaultDuration = 20) {
  try {
    const res = await axios.post(PYTHON_API, {
      bvid,
      duration: defaultDuration,
    });
    const startTime = res.data.start_time || 0;
    return { startTime, duration: defaultDuration };
  } catch (e) {
    log(`分析失败 ${bvid}, 从头开始`);
    return { startTime: 0, duration: defaultDuration };
  }
}

async function prepareAllAssets(songs, progressCallback) {
  log("========== 准备视频素材 ==========");

  // 第一轮：收集所有歌曲的裁切参数
  const needAnalyze = [];

  for (const song of songs) {
    const saved = getClipSetting(song.bvid);

    if (saved) {
      // 有手动设置，使用手动参数
      song._startTime = saved.startTime;
      song._duration = saved.duration;
      song._isManual = true;
      log(
        `手动设置: ${song.bvid} (${saved.startTime.toFixed(1)}s - ${saved.endTime.toFixed(1)}s)`,
      );
    } else {
      // 没有手动设置，标记待处理
      needAnalyze.push(song);
    }
  }

  // 第二轮：处理需要自动分析的（用户漏掉的）
  if (needAnalyze.length > 0) {
    log(`========== 自动分析 ${needAnalyze.length} 首未设置的歌曲 ==========`);

    for (const song of needAnalyze) {
      const defaultDuration = song._defaultDuration || 20;
      const { startTime, duration } = await autoAnalyzeClip(
        song.bvid,
        defaultDuration,
      );
      song._startTime = startTime;
      song._duration = duration;
      song._isAuto = true;
      log(`自动分析: ${song.bvid} -> ${startTime.toFixed(1)}s`);
    }
  }

  // 第三轮：检查文件是否存在，不存在才下载
  log("========== 下载缺失的视频 ==========");

  let downloadedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < songs.length; i += DOWNLOAD_CONCURRENCY) {
    const batch = songs.slice(i, i + DOWNLOAD_CONCURRENCY);

    await Promise.all(
      batch.map(async (song) => {
        // 构建文件名（和 downloadClip 内部一致）
        const fileName = `${song.bvid}_${song._startTime.toFixed(2)}_${song._duration}.mp4`;
        const filePath = path.join(DIR_DOWNLOADS, fileName);

        // 检查是否已存在
        if (fs.existsSync(filePath)) {
          try {
            const actualDuration = await getDuration(filePath);
            if (actualDuration >= song._duration - 1) {
              song._videoPath = filePath;
              song._thumbPath = await downloadImage(song.image_url);
              skippedCount++;
              log(`跳过已有: ${song.bvid}`);
              return;
            }
          } catch (e) {
            // 文件损坏，继续下载
            log(`文件损坏: ${song.bvid}, 重新下载`);
          }
        }

        // 需要下载
        log(
          `下载: ${song.bvid} (${song._startTime.toFixed(1)}s - ${(song._startTime + song._duration).toFixed(1)}s)`,
        );

        const [vid, thumb] = await Promise.all([
          downloadClip(song.bvid, song._startTime, song._duration),
          downloadImage(song.image_url),
        ]);

        song._videoPath = vid;
        song._thumbPath = thumb;

        if (vid) downloadedCount++;
      }),
    );

    if (progressCallback) {
      progressCallback(
        Math.min(i + DOWNLOAD_CONCURRENCY, songs.length),
        songs.length,
      );
    }
  }

  // 统计
  const manualCount = songs.filter((s) => s._isManual).length;
  const autoCount = songs.filter((s) => s._isAuto).length;
  const successCount = songs.filter((s) => s._videoPath).length;

  log(`========== 素材准备完成 ==========`);
  log(
    `手动设置: ${manualCount} | 自动分析: ${autoCount} | 跳过: ${skippedCount} | 下载: ${downloadedCount} | 成功: ${successCount}/${songs.length}`,
  );
}

// 并行渲染榜单（已内置淡入淡出）
async function renderRankBatch(songs, type, segments) {
  const results = new Array(songs.length);
  let currentIndex = 0;
  const typeName = type === "new" ? "新曲榜" : "主榜";

  async function worker(workerId) {
    while (true) {
      const index = currentIndex++;
      if (index >= songs.length) break;

      const song = songs[index];
      const rankPadded = song.rank.toString().padStart(2, "0");
      const targetPath = path.join(segments, `rank_${type}_${rankPadded}.mp4`);

      if (fs.existsSync(targetPath)) {
        log(`[W${workerId}] 跳过: ${typeName} ${song.rank}`);
        results[index] = targetPath;
        continue;
      }

      const vid = song._videoPath;
      const thumb = song._thumbPath;

      if (!vid) {
        log(`[W${workerId}] 无视频: ${typeName} ${song.rank}`);
        continue;
      }

      log(`[W${workerId}] 渲染: ${typeName} ${song.rank} (${song._duration}s)`);

      // renderRankSegment 内部已处理淡入淡出
      results[index] = await renderRankSegment(
        song,
        vid,
        thumb,
        type,
        segments,
        song._duration,
      );

      log(`[W${workerId}] 完成: ${typeName} ${song.rank}`);
    }
  }

  log(`========== 并行渲染 ${typeName} (${RENDER_POOL_SIZE}路) ==========`);
  await Promise.all(
    Array.from({ length: RENDER_POOL_SIZE }, (_, i) => worker(i + 1)),
  );

  return results.filter(Boolean);
}

// 并行渲染副榜（带淡入淡出）
async function renderSubRankBatch(chunks, segments, duration) {
  const results = [];

  log(`========== 并行渲染 副榜 (${SUB_RANK_POOL_SIZE}路) ==========`);

  for (let i = 0; i < chunks.length; i += SUB_RANK_POOL_SIZE) {
    const batch = chunks.slice(i, i + SUB_RANK_POOL_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (chunk, idx) => {
        const pageNum = i + idx + 1;
        const targetPath = path.join(segments, `13_SubRank_Page${pageNum}.mp4`);

        if (fs.existsSync(targetPath)) {
          log(`副榜 Page${pageNum} 跳过`);
          return targetPath;
        }

        const processed = await Promise.all(
          chunk.map(async (item) => ({
            ...item,
            image_url: await downloadImage(item.image_url),
          })),
        );

        log(`副榜 Page${pageNum} 渲染中...`);
        // renderComposition 内部已处理淡入淡出
        return await renderComposition(
          "SubRank",
          { list: processed },
          `13_SubRank_Page${pageNum}.mp4`,
          segments,
          duration,
        );
      }),
    );
    results.push(...batchResults);
  }

  return results.filter(Boolean);
}

async function runSynthesisTask(date) {
  const { base, segments, final } = getPaths(date);
  const dataFile = path.join(DIR_DATA, `${date}.json`);
  const infoFile = path.join(DIR_DATA, `${date}信息.json`);

  log("读取数据");
  const data = await fs.readJson(dataFile);
  const infoData = (await fs.pathExists(infoFile))
    ? await fs.readJson(infoFile)
    : {};

  const totalSteps = 70;
  updateProgress("准备", 0, totalSteps);

  const listP1 = [];
  const listP2 = [];
  const listP3_pre = [];
  const listP3_sub = [];

  let progressCounter = 0;

  // 封面选择
  let introCover = "";
  if (infoData.cover && infoData.cover.image_url) {
    introCover = await downloadImage(infoData.cover.image_url);
    log(`封面: 使用指定 ${infoData.cover.bvid}`);
  } else {
    const mainRankList = data.total_rank_top20 || [];
    const firstAppearSong = mainRankList.find((s) => s.count === 1);
    if (firstAppearSong) {
      introCover = await downloadImage(firstAppearSong.image_url);
      log(`封面: 主榜首上榜 #${firstAppearSong.rank}`);
    } else if (mainRankList.length > 0) {
      introCover = await downloadImage(mainRankList[0].image_url);
      log("封面: 主榜第一");
    }
  }

  // 生成视频封面
  const coverFrame = DUR_INTRO * FPS - 31;
  const coverFileName = `${date}.png`;
  const coverPath = path.join(base, coverFileName);
  if (fs.existsSync(coverPath)) {
    fs.unlinkSync(coverPath);
    log("删除旧封面，重新生成");
  }
  await renderStill(
    "Intro",
    { issue: `#${data.index}`, date: data.date, coverImg: introCover },
    coverFileName,
    base,
    coverFrame,
  );
  updateProgress("封面", ++progressCounter, totalSteps);

  // ========== 准备素材阶段 ==========
  const newRankList = (data.new_rank_top10 || []).slice(0, 10);
  const mainRankList = (data.total_rank_top20 || []).slice(0, 20);

  newRankList.forEach((s) => (s._defaultDuration = 20));
  mainRankList.forEach((s) => (s._defaultDuration = 20));

  const allSongs = [...newRankList, ...mainRankList];

  await prepareAllAssets(allSongs, (current, total) => {
    updateProgress(`素材 ${current}/${total}`, progressCounter, totalSteps);
  });

  progressCounter += 5;
  updateProgress("素材完成", progressCounter, totalSteps);

  // ========== P1 渲染（所有都带淡入淡出）==========

  // P1: Intro (3秒)
  listP1.push(
    await renderComposition(
      "Intro",
      { issue: `#${data.index}`, date: data.date, coverImg: introCover },
      "01_Intro.mp4",
      segments,
      DUR_INTRO,
    ),
  );
  updateProgress("片头", ++progressCounter, totalSteps);

  // P1: InfoCard (5秒)
  const opData = data.op || {};
  const opCover = await downloadImage(opData.image_url);
  listP1.push(
    await renderComposition(
      "InfoCard",
      {
        opLabel: "OP / 上期冠军",
        opTitle: opData.title || "未知",
        opArtist: opData.author || "Unknown",
        opCover,
        timeLabel: "统计时间",
        timeRange: data.period,
        note: infoData.script?.opening || `第${data.index}期`,
      },
      "02_InfoCard.mp4",
      segments,
      DUR_INFOCARD,
    ),
  );
  updateProgress("信息卡", ++progressCounter, totalSteps);

  // P1: 规则页面 (35秒)
  listP1.push(
    await renderComposition(
      "RulesAndAchivements",
      {},
      "03_Rules.mp4",
      segments,
      DUR_RULES,
    ),
  );
  updateProgress("规则页", ++progressCounter, totalSteps);

  // P1: 新曲榜标题 (2秒)
  listP1.push(
    await renderComposition(
      "SectionTitle",
      {
        title: "新曲榜 Top 10",
        from: 10,
        to: 1,
        themeColor: "#23ade5",
        edName: "",
        edAuthor: "",
      },
      "04_SectionTitle_New.mp4",
      segments,
      DUR_SECTION_TITLE,
    ),
  );
  updateProgress("新曲榜标题", ++progressCounter, totalSteps);

  // ========== P2 渲染 ==========

  // P2-A: 新曲榜卡片（内置淡入淡出）
  const reversedNewList = [...newRankList].reverse();
  const newRankResults = await renderRankBatch(
    reversedNewList,
    "new",
    segments,
  );
  listP2.push(...newRankResults);
  progressCounter += reversedNewList.length;
  updateProgress("新曲榜完成", progressCounter, totalSteps);

  // P2-B: 主榜标题 (2秒)
  listP2.push(
    await renderComposition(
      "SectionTitle",
      {
        title: "主榜 Top 20",
        from: 20,
        to: 1,
        themeColor: "#f25d8e",
        edName: "",
        edAuthor: "",
      },
      "05_SectionTitle_Main.mp4",
      segments,
      DUR_SECTION_TITLE,
    ),
  );

  // P2-C: 主榜卡片（内置淡入淡出）
  const reversedMainList = [...mainRankList].reverse();
  const mainRankResults = await renderRankBatch(
    reversedMainList,
    "main",
    segments,
  );
  listP2.push(...mainRankResults);
  progressCounter += reversedMainList.length;
  updateProgress("主榜完成", progressCounter, totalSteps);

  // ========== P3 前段计算 ==========
  const milList = (data.million_record || []).sort(
    (a, b) => b.million_crossed - a.million_crossed,
  );
  const milChunks = chunkArray(milList, 5);

  const achList = data.achievement_record || [];
  const achChunks = chunkArray(achList, 5);

  const p3PreFixedCount = 4;
  const p3PreDynamicCount = milChunks.length + achChunks.length;
  const p3PreDuration =
    (p3PreFixedCount + p3PreDynamicCount) * DUR_SHORT + DUR_SECTION_TITLE;

  const subList = (data.total_rank_sub || [])
    .filter((i) => i.rank >= 21 && i.rank <= 100)
    .sort((a, b) => a.rank - b.rank);
  const subChunks = chunkArray(subList, 4);
  const subChunkCount = subChunks.length;

  // 计算副榜每页时长
  let subDurationPerChunk = 3;
  if (infoData.ed && infoData.ed.bvid) {
    const edAudioPath = await downloadAudio(
      infoData.ed.bvid,
      `${infoData.ed.bvid}.mp3`,
    );
    if (edAudioPath) {
      const edTotalDuration = await getDuration(edAudioPath);
      const subTotalDuration = edTotalDuration - p3PreDuration;
      if (subTotalDuration > 0 && subChunkCount > 0) {
        subDurationPerChunk = Math.max(2, subTotalDuration / subChunkCount);
      }
      log(
        `ED时长 ${edTotalDuration.toFixed(1)}s, P3前段 ${p3PreDuration}s, 副榜每页 ${subDurationPerChunk.toFixed(2)}s`,
      );
    }
  }

  // P3-Pre: 歌手排名
  const singerList = (data.vocal_stats || []).map((s) => ({
    ...s,
    avatar: `http://localhost:${PORT}/downloads/avatar/${encodeURIComponent(s.name)}.png`,
  }));
  listP3_pre.push(
    await renderComposition(
      "SingerRank",
      { list: singerList },
      "06_SingerRank.mp4",
      segments,
      DUR_SHORT,
    ),
  );

  // P3-Pre: 百万达成
  if (milChunks.length > 0) {
    for (let i = 0; i < milChunks.length; i++) {
      const processed = await Promise.all(
        milChunks[i].map(async (item) => ({
          ...item,
          image_url: await downloadImage(item.image_url),
        })),
      );
      listP3_pre.push(
        await renderComposition(
          "MillionRank",
          { list: processed },
          `07_MillionRank_Page${i + 1}.mp4`,
          segments,
          DUR_SHORT,
        ),
      );
    }
  }

  // P3-Pre: 成就达成
  if (achChunks.length > 0) {
    for (let i = 0; i < achChunks.length; i++) {
      const processed = await Promise.all(
        achChunks[i].map(async (item) => ({
          ...item,
          image_url: await downloadImage(item.image_url),
        })),
      );
      listP3_pre.push(
        await renderComposition(
          "AchievementRank",
          { list: processed },
          `08_AchievementRank_Page${i + 1}.mp4`,
          segments,
          DUR_SHORT,
        ),
      );
    }
  }

  // P3-Pre: 历史回顾
  const historyList = data.history_record || [];

  const historyProcessed = await Promise.all(
    historyList.map(async (item) => ({
      ...item,
      image_url: await downloadImage(item.image_url),
    })),
  );
  listP3_pre.push(
    await renderComposition(
      "HistoryRank",
      { list: historyProcessed },
      "09_HistoryRank.mp4",
      segments,
      DUR_SHORT,
    ),
  );

  // P3-Pre: 数据统计
  listP3_pre.push(
    await renderComposition(
      "StatsCard",
      {
        stat: data.stat,
        comment: infoData.script?.ending || data.comment,
      },
      "10_StatsCard.mp4",
      segments,
      DUR_SHORT,
    ),
  );

  // P3-Pre: Staff
  listP3_pre.push(
    await renderComposition(
      "StaffCard",
      {
        staffList: STAFF_LIST.map((s) => ({
          ...s,
          avatar: `http://localhost:${PORT}/downloads/STAFF/${encodeURIComponent(s.name)}.jpg`,
        })),
      },
      "11_StaffCard.mp4",
      segments,
      DUR_SHORT,
    ),
  );

  // P3-Sub: 副榜标题
  listP3_pre.push(
    await renderComposition(
      "SectionTitle",
      {
        title: "副榜 Top 100",
        from: 21,
        to: 100,
        themeColor: "#66ccff",
        edName: infoData.ed?.name || "",
        edAuthor: infoData.ed?.author || "",
      },
      "12_SubRankTitle.mp4",
      segments,
      DUR_SECTION_TITLE,
    ),
  );

  // P3-Sub: 副榜卡片（带淡入淡出）
  const subRankResults = await renderSubRankBatch(
    subChunks,
    segments,
    subDurationPerChunk,
  );
  listP3_sub.push(...subRankResults);
  progressCounter += subChunkCount;
  updateProgress("副榜完成", progressCounter, totalSteps);

  // ========== 清理旧的合并产物 ==========
  const mergeProducts = [
    "p1_raw.mp4",
    "p1_final.mp4",
    "p2_main.mp4",
    "p3_pre.mp4",
    "p3_sub_raw.mp4",
    "p3_final.mp4",
    "p3_final_fallback.mp4",
    "files_p1.txt",
    "files_p2.txt",
    "files_p3_pre.txt",
    "files_p3_sub.txt",
    "files_final_fallback.txt",
  ];

  log("清理旧的合并产物...");
  for (const file of mergeProducts) {
    const filePath = path.join(segments, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      log(`删除: ${file}`);
    }
  }
  // ========== 合并阶段 ==========
  updateProgress("合并", totalSteps - 5, totalSteps);

  log("合并 P1");
  const p1Raw = await concatVideos(listP1, "p1_raw.mp4", segments);
  let p1Final = p1Raw;

  if (opData.bvid) {
    const opAudio = await downloadAudio(opData.bvid, `${opData.bvid}.mp3`);
    if (opAudio && p1Raw) {
      log("混音 OP");
      p1Final = await processP1(p1Raw, opAudio, "p1_final.mp4", segments);
    }
  }

  log("合并 P2");
  const p2Final = await concatVideos(listP2, "p2_main.mp4", segments);

  log("合并 P3");
  const p3Pre = await concatVideos(listP3_pre, "p3_pre.mp4", segments);
  const p3Sub = await concatVideos(listP3_sub, "p3_sub_raw.mp4", segments);
  let p3Final = null;

  if (infoData.ed && infoData.ed.bvid) {
    const edAudio = await downloadAudio(
      infoData.ed.bvid,
      `${infoData.ed.bvid}.mp3`,
    );
    if (edAudio && p3Pre && p3Sub) {
      log("混音 ED");
      p3Final = await processP3(
        p3Pre,
        p3Sub,
        edAudio,
        "p3_final.mp4",
        segments,
      );
    }
  }

  if (!p3Final && p3Pre && p3Sub) {
    p3Final = await concatVideos(
      [p3Pre, p3Sub],
      "p3_final_fallback.mp4",
      segments,
    );
  }

  updateProgress("最终合并", totalSteps - 1, totalSteps);
  log(`输出 ${final}`);

  const finals = [p1Final, p2Final, p3Final].filter((p) => p);

  if (finals.length === 3) {
    await finalMerge(finals[0], finals[1], finals[2], final);
  } else {
    const listPath = path.join(segments, "files_final_fallback.txt");
    const content = finals
      .map((p) => `file '${p.replace(/\\/g, "/")}'`)
      .join("\n");
    fs.writeFileSync(listPath, content);
    const { execPromise } = require("../utils/ffmpeg");
    await execPromise(
      `ffmpeg -f concat -safe 0 -i "${listPath}" -c copy "${final}" -y`,
    );
  }

  setTaskStatus(TASK_STATUS.COMPLETED);
  updateProgress("完成", totalSteps, totalSteps);
  log("完成");
}

module.exports = { runSynthesisTask };
