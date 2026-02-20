// index.js
const path = require("path");
const PORT = 3002;
const PYTHON_API = "http://127.0.0.1:8000/analyze";
const CHROME_EXECUTABLE = `"C:\\chrome-headless-shell\\chrome-headless-shell.exe"`;

const DIR_ROOT = path.resolve(__dirname, "..");
const DIR_DATA = path.resolve(DIR_ROOT, "data");
const DIR_DOWNLOADS = path.resolve(DIR_ROOT, "downloads");
const DIR_IMAGES = path.resolve(DIR_DOWNLOADS, "images");
const DIR_VIDEO_ROOT = path.resolve(DIR_ROOT, "video");
const DIR_AUDIO_CACHE = path.resolve(DIR_DOWNLOADS, "audio_cache");
const DIR_AVATAR = path.resolve(DIR_DOWNLOADS, "avatar");
const DIR_STAFF = path.resolve(DIR_DOWNLOADS, "STAFF");
const DIR_FULL_VIDEO = path.resolve(DIR_DOWNLOADS, "full_videos");
const DIR_CLIP_DB = path.resolve(DIR_DATA, "clips_db.json");

const STAFF_LIST = [
  { name: "星幻丶碎梦", uid: "151045420" },
  { name: "哈里布莱", uid: "382104768" },
  { name: "来杯Kou茶", uid: "433286612" },
  { name: "ETeyondLitle", uid: "3546619070909322" },
  { name: "Sayonzei", uid: "9216592" },
  { name: "周某不是轴某", uid: "488423021" },
  { name: "琳峰", uid: "3537120658459221" },
  { name: "黑猫", uid: "640588036" },
  { name: "是非成败转头空", uid: "1737183223" },
  { name: "蓝溪水", uid: "675685757" },
  { name: "白板だよ", uid: "621087695" },
];

module.exports = {
  PORT,
  PYTHON_API,
  CHROME_EXECUTABLE,
  DIR_ROOT,
  DIR_DATA,
  DIR_DOWNLOADS,
  DIR_IMAGES,
  DIR_VIDEO_ROOT,
  DIR_AUDIO_CACHE,
  DIR_AVATAR,
  DIR_STAFF,
  DIR_FULL_VIDEO,
  DIR_CLIP_DB,
  STAFF_LIST,
};
