// utils/helpers.js
const path = require("path");
const fs = require("fs-extra");
const { DIR_VIDEO_ROOT } = require("../config");

function getPaths(date) {
  const base = path.join(DIR_VIDEO_ROOT, date);
  const segments = path.join(base, "segments");
  fs.ensureDirSync(segments);
  return {
    base,
    segments,
    final: path.join(base, `${date}.mp4`),
  };
}

function chunkArray(arr, size) {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

function getCopyrightLabel(copyright) {
  if ([1, 3, 100].includes(copyright)) return "本家";
  if ([2, 101].includes(copyright)) return "搬运";
  return "搬运";
}

module.exports = {
  getPaths,
  chunkArray,
  getCopyrightLabel,
};
