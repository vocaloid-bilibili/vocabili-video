// config/issueTypes.js
// 期刊类型配置

const ISSUE_TYPES = {
  weekly: {
    name: "周刊",
    datePattern: /^\d{4}-\d{2}-\d{2}$/,

    newRankCount: 10, // 新曲榜展示数量 (Top 10)
    mainRankCount: 20, // 主榜展示数量 (Top 20)
    subRankRange: [21, 100], // 副榜名次范围 [起始, 结束]
    subRankPerPage: 4, // 副榜每页显示条数

    trendCount: 7, // 走势数据点数量（7天）
    trendKey: "daily_trends", // 走势数据字段名

    scoreThresholds: [
      { key: "count_over_500k", label: "50万分以上" }, // 50万分以上曲数
      { key: "count_over_100k", label: "10万分以上" }, // 10万分以上曲数
      { key: "count_over_50k", label: "5万分以上" }, // 5万分以上曲数
    ],

    playRateCoef: 10,

    showCount: true, // 显示上榜次数（期数）
    showAchievements: true, // 规则页显示成就标准

    sections: {
      intro: { enabled: true, duration: 3 },
      infoCard: { enabled: true, duration: 5 },
      rules: { enabled: true, duration: 35 },

      newRankTitle: {
        enabled: true,
        duration: 2,
        title: "新曲榜",
        color: "#23ade5",
      },

      newRank: { enabled: true },

      mainRankTitle: {
        enabled: true,
        duration: 2,
        title: "主榜",
        color: "#f25d8e",
      },
      mainRank: { enabled: true },
      singerRank: { enabled: true },
      millionRank: { enabled: true },
      achievementRank: { enabled: true },
      historyRank: { enabled: true },
      statsCard: { enabled: true },
      staffCard: { enabled: true },
      subRankTitle: {
        enabled: true,
        duration: 2,
        title: "副榜",
        color: "#66ccff",
      },
      subRank: { enabled: true },
    },

    audioFade: true, // 启用音频淡入淡出
    fadeDuration: 2, // 淡入淡出时长（秒）

    dataFields: {
      newRank: "new_rank_top10", // 新曲榜数据字段
      mainRank: "total_rank_top20", // 主榜数据字段
      subRank: "total_rank_sub", // 副榜数据字段
    },
  },

  monthly: {
    name: "月刊",
    datePattern: /^\d{4}-\d{2}$/,

    newRankCount: 20,
    mainRankCount: 20,
    subRankRange: [21, 200],
    subRankPerPage: 4,

    trendCount: 5,
    trendKey: "weekly_trends",

    scoreThresholds: [
      { key: "count_over_1m", label: "100万分以上" },
      { key: "count_over_500k", label: "50万分以上" },
      { key: "count_over_100k", label: "10万分以上" },
    ],

    playRateCoef: 15,

    showCount: false, // 月刊不显示上榜次数
    showAchievements: false, // 月刊不显示成就标准

    // 页面配置
    sections: {
      intro: { enabled: true, duration: 3 },
      infoCard: { enabled: true, duration: 5 },
      rules: { enabled: true, duration: 30 }, // 少一页成就，时长缩短
      newRankTitle: {
        enabled: true,
        duration: 2,
        title: "新曲榜",
        color: "#23ade5",
      },
      newRank: { enabled: true },
      mainRankTitle: {
        enabled: true,
        duration: 2,
        title: "主榜",
        color: "#f25d8e",
      },
      mainRank: { enabled: true },
      singerRank: { enabled: true },
      millionRank: { enabled: true },
      achievementRank: { enabled: false }, // 月刊无成就达成
      historyRank: { enabled: true },
      statsCard: { enabled: true },
      staffCard: { enabled: true },
      subRankTitle: {
        enabled: true,
        duration: 2,
        title: "副榜",
        color: "#66ccff",
      },
      subRank: { enabled: true },
    },

    audioFade: true,
    fadeDuration: 2,

    dataFields: {
      newRank: "new_rank_top20",
      mainRank: "total_rank_top20",
      subRank: "total_rank_sub",
    },
  },

  special: {
    name: "特刊",
    datePattern: null, // 无固定格式

    newRankCount: 0, // 默认无新曲榜
    mainRankCount: 20,
    subRankRange: null, // 默认无副榜
    subRankPerPage: 4,

    trendCount: 0, // 默认无走势
    trendKey: null,

    scoreThresholds: null, // 默认无统计
    playRateCoef: 15,
    showCount: false,
    showAchievements: false,
    specialRateNote: true, // 显示特刊补正说明

    // 特刊大部分区段默认关闭
    sections: {
      intro: { enabled: false },
      infoCard: { enabled: false },
      rules: { enabled: false },
      newRankTitle: { enabled: false },
      newRank: { enabled: false },
      mainRankTitle: { enabled: true, duration: 2 },
      mainRank: { enabled: true },
      singerRank: { enabled: false },
      millionRank: { enabled: false },
      achievementRank: { enabled: false },
      historyRank: { enabled: false },
      statsCard: { enabled: false },
      staffCard: { enabled: false },
      subRankTitle: { enabled: false },
      subRank: { enabled: false },
    },

    audioFade: false,
    fadeDuration: 0,

    dataFields: {
      newRank: null,
      mainRank: "total_rank_top20",
      subRank: null,
    },
  },
};

function detectIssueType(dateStr) {
  if (ISSUE_TYPES.weekly.datePattern.test(dateStr)) return "weekly";
  if (ISSUE_TYPES.monthly.datePattern.test(dateStr)) return "monthly";
  return "special";
}

function getDerivedValues(config) {
  const subMax = config.subRankRange ? config.subRankRange[1] : 100;

  const isMonthly = config.name === "月刊";
  const isSpecial = config.name === "特刊";

  return {
    subRankMax: subMax,

    topN: subMax,

    newSongPeriod: isMonthly || isSpecial ? "当月" : "2周内",

    lastPeriodLabel: isMonthly ? "上月" : "上期",

    newRankTitleFull: config.sections?.newRankTitle?.enabled
      ? `${config.sections.newRankTitle.title} Top ${config.newRankCount}`
      : "",
    mainRankTitleFull: config.sections?.mainRankTitle?.enabled
      ? `${config.sections.mainRankTitle.title} Top ${config.mainRankCount}`
      : "",
    subRankTitleFull:
      config.sections?.subRankTitle?.enabled && config.subRankRange
        ? `${config.sections.subRankTitle.title} Top ${subMax}`
        : "",
  };
}

function getIssueConfig(dateStr, infoData = {}) {
  const type = infoData.issueType || detectIssueType(dateStr);

  const baseConfig = JSON.parse(
    JSON.stringify(ISSUE_TYPES[type] || ISSUE_TYPES.special),
  );

  if (infoData.config) {
    deepMerge(baseConfig, infoData.config);
  }

  baseConfig._type = type;
  baseConfig._date = dateStr;

  Object.assign(baseConfig, getDerivedValues(baseConfig));

  return baseConfig;
}

function deepMerge(target, source) {
  for (const key in source) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

module.exports = {
  ISSUE_TYPES,
  detectIssueType,
  getIssueConfig,
  getDerivedValues,
};
