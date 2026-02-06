// utils/clips.js
const fs = require("fs-extra");
const { DIR_CLIP_DB } = require("../config");

let clipsCache = null;

function loadClipsDB() {
  if (clipsCache) return clipsCache;
  if (fs.existsSync(DIR_CLIP_DB)) {
    clipsCache = fs.readJsonSync(DIR_CLIP_DB);
  } else {
    clipsCache = {};
  }
  return clipsCache;
}

function saveClipsDB() {
  if (clipsCache) {
    fs.writeJsonSync(DIR_CLIP_DB, clipsCache, { spaces: 2 });
  }
}

function getClipSetting(bvid) {
  const db = loadClipsDB();
  return db[bvid] || null;
}

function setClipSetting(bvid, startTime, endTime = null) {
  const db = loadClipsDB();

  let duration;
  if (endTime !== null) {
    duration = endTime - startTime;
    // 限制 15-35 秒
    if (duration < 15) {
      endTime = startTime + 15;
      duration = 15;
    } else if (duration > 35) {
      endTime = startTime + 35;
      duration = 35;
    }
  } else {
    duration = 20;
    endTime = startTime + 20;
  }

  db[bvid] = {
    startTime: Math.round(startTime * 100) / 100,
    endTime: Math.round(endTime * 100) / 100,
    duration: Math.round(duration * 100) / 100,
    updatedAt: new Date().toISOString(),
  };

  clipsCache = db;
  saveClipsDB();
  return db[bvid];
}

function deleteClipSetting(bvid) {
  const db = loadClipsDB();
  if (db[bvid]) {
    delete db[bvid];
    clipsCache = db;
    saveClipsDB();
    return true;
  }
  return false;
}

function getAllClipSettings() {
  return loadClipsDB();
}

module.exports = {
  getClipSetting,
  setClipSetting,
  deleteClipSetting,
  getAllClipSettings,
};
