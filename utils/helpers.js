// utils/helpers.js
const path = require("path");
const fs = require("fs-extra");
const { DIR_VIDEO_ROOT } = require("../config");
const { detectIssueType } = require("../config/issueTypes");

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

// 获取期刊类型
function getIssueType(date) {
  return detectIssueType(date);
}

// 格式化日期显示
function formatDateDisplay(date, type) {
  if (type === "weekly") {
    return date; // 2026-01-17
  } else if (type === "monthly") {
    const [year, month] = date.split("-");
    return `${year}年${parseInt(month)}月`;
  }
  return date;
}

module.exports = {
  getPaths,
  chunkArray,
  getCopyrightLabel,
  getIssueType,
  formatDateDisplay,
};
