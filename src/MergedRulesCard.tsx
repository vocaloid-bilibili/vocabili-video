// src/MergedRulesCard.tsx
import {
  AbsoluteFill,
  useVideoConfig,
  useCurrentFrame,
  spring,
  interpolate,
  Sequence,
  Easing,
} from "remotion";
import React from "react";
import {
  PlayIcon,
  StarIcon,
  CoinIcon,
  LikeIcon,
  DanmakuIcon,
  ReplyIcon,
  ShareIcon,
} from "./Icons";

// ------------------------------------------------------------------
// 1. 全局配置与样式 (合并了三个文件的样式)
// ------------------------------------------------------------------
const STYLES = {
  colors: {
    bg: "#fffbf0",
    border: "#000000",
    headerBg: "#222",
    headerText: "#fff",
    // 规则页颜色
    blue: "#bbdefb",
    orange: "#ffe0b2",
    pink: "#f8bbd0",
    // 成就页颜色
    EmergingHitColor: "#6A0DAD",
    MegaHitColor: "#CCA300",
    SubGateColor: "#23AFA4",
    GateColor: "#127436",
    textMain: "#000000",
    accentRed: "#d50000",
    accentBlue: "#2979ff",
  },
  border: "3px solid #000",
  shadow: "8px 8px 0px rgba(0,0,0,1)",
  fontMain:
    '"Microsoft YaHei", "Heiti SC", "Arial Rounded MT Bold", sans-serif',
  fontHeader: '"Arial Black", "Impact", sans-serif',
  fontNum: '"Arial Black", "Impact", sans-serif',
};

// 背景点阵
const DotPattern = () => (
  <AbsoluteFill
    style={{
      backgroundImage: "radial-gradient(#d7ccc8 3px, transparent 3px)",
      backgroundSize: "24px 24px",
      opacity: 0.6,
      zIndex: 0,
    }}
  />
);

// ------------------------------------------------------------------
// 2. 数据源：收录规则数据
// ------------------------------------------------------------------
const RULES_DATA = [
  {
    title: "收录范围",
    sections: [
      {
        head: "集计对象",
        items: [
          "收录投稿在bilibili平台、使用虚拟歌手引擎调教创作的外语歌曲",
          "收录投稿在音乐区的VOCALOID·UTAU分区的所有歌曲、其他分区的原创歌曲和虚拟歌手翻唱歌曲",
          "以及在同人·手书分区的本家原创歌曲",
        ],
      },
      {
        head: "语言认定",
        items: [
          "收录外国语（包括古代外国语）、人造语言歌曲",
          "收录跨语种声库演唱的外语歌曲",
          "不收录以汉语族或中国少数民族语言为主的歌曲",
          "对于多语言混合歌曲，虚拟歌手外语部分占比需至少三分之一且在歌曲中成段出现",
        ],
      },
      { head: "时长要求", items: ["大于20秒"] },
    ],
  },
  {
    title: "引擎与声库",
    sections: [
      {
        head: "电子合成引擎认定",
        items: [
          "收录允许用户自定义调教音高等参数的歌声合成引擎（VOCALOID, UTAU, Synthesizer V等）",
          "不收录依赖变声器的工具或缺乏精细控制的合成引擎",
          "不收录完全依赖预训练模型自动生成的AI技术",
        ],
      },
      {
        head: "虚拟歌手声库认定",
        items: [
          "收录商业声库和公开配布的自制声库",
          "新商业声库需公开首个试听曲，新自制声库需正式公开配布",
          "不收录混合音源演唱的歌曲",
          "人声合唱歌曲中，虚拟歌手占比需至少1/3且成段出现",
        ],
      },
    ],
  },
  {
    title: "认定标准",
    sections: [
      {
        head: "本家认定标准",
        items: [
          "参与制作视频的任一人员投稿即认定为本家",
          "不收录仅对原曲进行重编曲或混音而不重新调教的作品",
        ],
      },
      {
        head: "稿件收录标准",
        items: [
          "同一曲目优先收录本家投稿，若有本家则不收录搬运",
          "无本家时收录得分最高的搬运",
          "不收录无歌词、无伴奏、MMD、手书、MASHUP、对比视频等",
          "收录本家发布的不同音频版本（完整版、重填词、翻唱等）",
        ],
      },
    ],
  },
];

// ------------------------------------------------------------------
// 3. 子页面组件定义
//    注意：这里去掉了所有的进场/退场动画，只保留静态布局
// ------------------------------------------------------------------

// --- [A] 规则页内容组件 ---
const RulePageContent = ({
  data,
  pageIndex,
  total,
}: {
  data: (typeof RULES_DATA)[0];
  pageIndex: number;
  total: number;
}) => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "30px 40px",
        boxSizing: "border-box",
      }}
    >
      {/* 页眉：小标题 + 页码 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          borderBottom: "4px solid #000",
          paddingBottom: 10,
        }}
      >
        <div
          style={{
            fontSize: 42,
            fontWeight: "900",
            fontFamily: STYLES.fontMain,
            color: STYLES.colors.textMain,
          }}
        >
          {data.title}
        </div>
        <div
          style={{
            fontSize: 32,
            fontWeight: "bold",
            color: "#666",
            fontFamily: STYLES.fontHeader,
          }}
        >
          {pageIndex + 1} / {total}
        </div>
      </div>

      {/* 列表内容 */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {data.sections.map((section, idx) => (
          <div key={idx} style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 34,
                fontWeight: "900",
                color: "#fff",
                backgroundColor: "#000",
                padding: "4px 12px",
                alignSelf: "flex-start",
                marginBottom: 8,
                borderRadius: 4,
              }}
            >
              {section.head}
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: 28,
                fontSize: 30,
                fontFamily: STYLES.fontMain,
                lineHeight: 1.5,
                color: "#333",
                fontWeight: "600",
              }}
            >
              {section.items.map((item, i) => (
                <li key={i} style={{ marginBottom: 4 }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- [B] 公式页内容组件 ---
const FormulaPage1 = () => (
  <div
    style={{
      width: "100%",
      maxWidth: 1500,
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      gap: 15,
      padding: "30px 40px",
    }}
  >
    <p style={{ fontSize: 28, margin: "10px 0", fontFamily: STYLES.fontMain }}>
      统计范围内所有收录投稿的数据，按以下方式计算得点，按得点从高至低排名。
    </p>

    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 15,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontSize: 48,
          fontWeight: 900,
          lineHeight: 1,
          fontFamily: STYLES.fontMain,
        }}
      >
        <div>总</div>
        <div>得</div>
        <div>点</div>
      </div>
      <span style={{ fontSize: 48, fontWeight: 900 }}>=</span>
      <span
        style={{
          fontSize: 320,
          color: "#888",
          opacity: 1,
          lineHeight: 1,
          transform: "translateY(-45px)",
          fontWeight: 100,
          fontFamily: STYLES.fontMain,
        }}
      >
        {"{"}
      </span>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 15,
          margin: "0 15px",
        }}
      >
        {[
          {
            icon: (
              <PlayIcon style={{ width: 120, height: 120, opacity: 0.75 }} />
            ),
            label: "播放量",
            suffix: "播放分补正",
          },
          {
            icon: (
              <StarIcon style={{ width: 120, height: 120, opacity: 0.75 }} />
            ),
            label: "收藏量",
            suffix: "收藏分补正",
          },
          {
            icon: (
              <CoinIcon style={{ width: 120, height: 120, opacity: 0.75 }} />
            ),
            label: "硬币量",
            suffix: "硬币分补正",
            extra: (
              <div>
                <span style={{ margin: "0 8px", color: "#888" }}>×</span>
                <span
                  style={{ color: STYLES.colors.accentRed, fontWeight: 900 }}
                >
                  fixA
                </span>
              </div>
            ),
          },
          {
            icon: (
              <LikeIcon style={{ width: 120, height: 120, opacity: 0.75 }} />
            ),
            label: "点赞量",
            suffix: "点赞分补正",
          },
          {
            icon: (
              <ReplyIcon style={{ width: 120, height: 120, opacity: 0.75 }} />
            ),
            label: "评论量",
            suffix: "评论分补正",
            extra: (
              <div>
                <span style={{ margin: "0 8px", color: "#888" }}>×</span>
                <span
                  style={{ color: STYLES.colors.accentRed, fontWeight: 900 }}
                >
                  fixD
                </span>
              </div>
            ),
          },
          {
            icon: (
              <DanmakuIcon style={{ width: 120, height: 120, opacity: 0.75 }} />
            ),
            label: "弹幕量",
            suffix: "弹幕分补正",
          },
          {
            icon: (
              <ShareIcon style={{ width: 120, height: 120, opacity: 0.75 }} />
            ),
            label: "分享量",
            suffix: "分享分补正",
          },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              fontSize: 24,
              fontWeight: 700,
              textAlign: "center",
              fontFamily: STYLES.fontMain,
            }}
          >
            {item.icon}
            <div style={{ fontWeight: 900 }}>{item.label}</div>
            <span style={{ margin: "0 8px", color: "#888" }}>×</span>
            <div>{item.suffix}</div>
            {item.extra}
          </div>
        ))}
      </div>
      <span
        style={{
          fontSize: 320,
          color: "#888",
          opacity: 1,
          lineHeight: 1,
          transform: "translateY(-45px)",
          fontWeight: 100,
          fontFamily: STYLES.fontMain,
        }}
      >
        {"}"}
      </span>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontSize: 32,
          fontWeight: 900,
          marginLeft: -20,
          lineHeight: 1.4,
          fontFamily: STYLES.fontNum,
        }}
      >
        <div>
          <span style={{ margin: "0 8px", color: "#888" }}>×</span>
          <span style={{ color: STYLES.colors.accentRed }}>fixB</span>
        </div>
        <div>
          <span style={{ margin: "0 8px", color: "#888" }}>×</span>
          <span style={{ color: STYLES.colors.accentRed }}>fixC</span>
        </div>
      </div>
    </div>

    <div
      style={{
        width: "100%",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "20px 50px",
        borderTop: "3px solid #F2F2F7",
        paddingTop: 25,
        marginTop: 30,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 36,
            fontWeight: 900,
          }}
        >
          <div
            style={{
              color: STYLES.colors.accentRed,
              width: 110,
              textAlign: "right",
              paddingRight: 15,
            }}
          >
            fixA
          </div>
          <span>=</span>
          <div
            style={{
              display: "inline-flex",
              flexDirection: "column",
              textAlign: "center",
              margin: "0 10px",
              lineHeight: 1.1,
              fontSize: "80%",
            }}
          >
            <div
              style={{
                borderBottom: "3px solid #1d1d1f",
                padding: "0 5px 5px",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontWeight: 900 }}>播放</span>
              <span style={{ margin: "0 8px", color: "#888" }}>＋</span>
              <span
                style={{
                  color: STYLES.colors.accentBlue,
                  fontWeight: 900,
                  fontFamily: "Consolas",
                }}
              >
                20
              </span>
              <span style={{ margin: "0 8px", color: "#888" }}>×</span>
              <span style={{ fontWeight: 900 }}>收藏</span>
              <span style={{ margin: "0 8px", color: "#888" }}>＋</span>
              <span
                style={{
                  color: STYLES.colors.accentBlue,
                  fontWeight: 900,
                  fontFamily: "Consolas",
                }}
              >
                40
              </span>
              <span style={{ margin: "0 8px", color: "#888" }}>×</span>
              <span style={{ fontWeight: 900 }}>硬币</span>
              <span style={{ margin: "0 8px", color: "#888" }}>＋</span>
              <span
                style={{
                  color: STYLES.colors.accentBlue,
                  fontWeight: 900,
                  fontFamily: "Consolas",
                }}
              >
                10
              </span>
              <span style={{ margin: "0 8px", color: "#888" }}>×</span>
              <span style={{ fontWeight: 900 }}>点赞</span>
            </div>
            <div style={{ paddingTop: 5, whiteSpace: "nowrap" }}>
              <span
                style={{
                  color: STYLES.colors.accentBlue,
                  fontWeight: 900,
                  fontFamily: "Consolas",
                }}
              >
                200
              </span>
              <span style={{ margin: "0 8px", color: "#888" }}>×</span>
              <span style={{ fontWeight: 900 }}>硬币</span>
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 36,
            fontWeight: 900,
          }}
        >
          <div
            style={{
              color: STYLES.colors.accentRed,
              width: 110,
              textAlign: "right",
              paddingRight: 15,
            }}
          >
            fixB
          </div>
          <span>=</span>
          <div
            style={{
              display: "inline-flex",
              flexDirection: "column",
              textAlign: "center",
              margin: "0 10px",
              lineHeight: 1.1,
              fontSize: "80%",
            }}
          >
            <div
              style={{
                borderBottom: "3px solid #1d1d1f",
                padding: "0 5px 5px",
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  color: STYLES.colors.accentBlue,
                  fontWeight: 900,
                  fontFamily: "Consolas",
                }}
              >
                60
              </span>
              <span style={{ margin: "0 8px", color: "#888" }}>×</span>
              <span style={{ color: STYLES.colors.accentRed, fontWeight: 900 }}>
                硬币
              </span>
              <span style={{ margin: "0 8px", color: "#888" }}>＋</span>
              <span
                style={{
                  color: STYLES.colors.accentBlue,
                  fontWeight: 900,
                  fontFamily: "Consolas",
                }}
              >
                30
              </span>
              <span style={{ margin: "0 8px", color: "#888" }}>×</span>
              <span style={{ fontWeight: 900 }}>点赞</span>
            </div>
            <div style={{ paddingTop: 5, whiteSpace: "nowrap" }}>
              <span style={{ fontWeight: 900 }}>播放</span>
              <span style={{ margin: "0 8px", color: "#888" }}>＋</span>
              <span
                style={{
                  color: STYLES.colors.accentBlue,
                  fontWeight: 900,
                  fontFamily: "Consolas",
                }}
              >
                20
              </span>
              <span style={{ margin: "0 8px", color: "#888" }}>×</span>
              <span style={{ fontWeight: 900 }}>收藏</span>
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 36,
            fontWeight: 900,
          }}
        >
          <div
            style={{
              color: STYLES.colors.accentRed,
              width: 110,
              textAlign: "right",
              paddingRight: 15,
            }}
          >
            fixC
          </div>
          <span>=</span>
          <div
            style={{
              display: "inline-flex",
              flexDirection: "column",
              textAlign: "center",
              margin: "0 10px",
              lineHeight: 1.1,
              fontSize: "80%",
            }}
          >
            <div
              style={{
                borderBottom: "3px solid #1d1d1f",
                padding: "0 5px 5px",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontWeight: 900 }}>收藏</span>
              <span style={{ margin: "0 8px", color: "#888" }}>＋</span>
              <span style={{ fontWeight: 900 }}>点赞</span>
              <span style={{ margin: "0 8px", color: "#888" }}>＋</span>
              <span
                style={{
                  color: STYLES.colors.accentBlue,
                  fontWeight: 900,
                  fontFamily: "Consolas",
                }}
              >
                20
              </span>
              <span style={{ margin: "0 8px", color: "#888" }}>×</span>
              <span style={{ color: STYLES.colors.accentRed, fontWeight: 900 }}>
                硬币
              </span>
            </div>
            <div style={{ paddingTop: 5, whiteSpace: "nowrap" }}>
              <span
                style={{
                  color: STYLES.colors.accentBlue,
                  fontWeight: 900,
                  fontFamily: "Consolas",
                }}
              >
                2
              </span>
              <span style={{ margin: "0 8px", color: "#888" }}>×</span>
              <span style={{ fontWeight: 900 }}>收藏</span>
              <span style={{ margin: "0 8px", color: "#888" }}>＋</span>
              <span
                style={{
                  color: STYLES.colors.accentBlue,
                  fontWeight: 900,
                  fontFamily: "Consolas",
                }}
              >
                2
              </span>
              <span style={{ margin: "0 8px", color: "#888" }}>×</span>
              <span style={{ fontWeight: 900 }}>点赞</span>
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 36,
            fontWeight: 900,
          }}
        >
          <div
            style={{
              color: STYLES.colors.accentRed,
              width: 110,
              textAlign: "right",
              paddingRight: 15,
            }}
          >
            fixD
          </div>
          <span>=</span>
          <span style={{ margin: "0 8px", color: "#888" }}>(</span>
          <div
            style={{
              display: "inline-flex",
              flexDirection: "column",
              textAlign: "center",
              margin: "0 10px",
              lineHeight: 1.1,
              fontSize: "80%",
            }}
          >
            <div
              style={{
                borderBottom: "3px solid #1d1d1f",
                padding: "0 5px 5px",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontWeight: 900 }}>收藏</span>
              <span style={{ margin: "0 8px", color: "#888" }}>＋</span>
              <span style={{ fontWeight: 900 }}>点赞</span>
            </div>
            <div style={{ paddingTop: 5, whiteSpace: "nowrap" }}>
              <span style={{ fontWeight: 900 }}>收藏</span>
              <span style={{ margin: "0 8px", color: "#888" }}>＋</span>
              <span style={{ fontWeight: 900 }}>点赞</span>
              <span style={{ margin: "0 8px", color: "#888" }}>＋</span>
              <span
                style={{
                  color: STYLES.colors.accentBlue,
                  fontWeight: 900,
                  fontFamily: "Consolas",
                }}
              >
                0.1
              </span>
              <span style={{ margin: "0 8px", color: "#888" }}>×</span>
              <span style={{ fontWeight: 900 }}>评论</span>
            </div>
          </div>
          <span style={{ margin: "0 8px", color: "#888" }}>)</span>
          <sup
            style={{
              fontSize: "0.75em",
              color: STYLES.colors.accentBlue,
              position: "relative",
              top: "-0.7em",
              marginLeft: 4,
            }}
          >
            20
          </sup>
        </div>
      </div>
    </div>

    <div
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "flex-end",
        gap: 100,
        fontSize: 22,
        fontWeight: 500,
        color: "#888",
        paddingTop: 10,
        fontFamily: STYLES.fontMain,
      }}
    >
      <span>
        *
        <span style={{ color: STYLES.colors.accentRed, fontWeight: 900 }}>
          fixA
        </span>
        的最小值为
        <span
          style={{
            color: STYLES.colors.accentBlue,
            fontWeight: 900,
            fontFamily: "Consolas",
          }}
        >
          1.00
        </span>
        ，
        <span style={{ color: STYLES.colors.accentRed, fontWeight: 900 }}>
          fixB
        </span>
        、
        <span style={{ color: STYLES.colors.accentRed, fontWeight: 900 }}>
          fixC
        </span>
        、
        <span style={{ color: STYLES.colors.accentRed, fontWeight: 900 }}>
          fixD
        </span>
        的最大值为
        <span
          style={{
            color: STYLES.colors.accentBlue,
            fontWeight: 900,
            fontFamily: "Consolas",
          }}
        >
          1.00
        </span>
      </span>
      <span>
        *
        <span style={{ color: STYLES.colors.accentRed, fontWeight: 900 }}>
          硬币
        </span>
        <span style={{ margin: "0 8px", color: "#888" }}>=</span>
        <span style={{ fontWeight: 900 }}>硬币</span>
        <span style={{ margin: "0 8px", color: "#888" }}>×</span>
        <span style={{ color: STYLES.colors.accentRed, fontWeight: 900 }}>
          fixA
        </span>
      </span>
      <span>
        *本家投稿视频的
        <span style={{ color: STYLES.colors.accentRed, fontWeight: 900 }}>
          fixA
        </span>
        <span style={{ margin: "0 8px", color: "#888" }}>=</span>
        <span
          style={{
            color: STYLES.colors.accentBlue,
            fontWeight: 900,
            fontFamily: "Consolas",
          }}
        >
          1
        </span>
      </span>
    </div>
  </div>
);

const FormulaPage2 = () => (
  <div
    style={{
      width: "100%",
      maxWidth: 1500,
      margin: "0 auto",
      display: "grid",
      gridTemplateColumns: "260px 80px 400px 40px 100px 280px",
      gridTemplateRows: "repeat(7, 1fr) auto",
      alignItems: "center",
      gap: "10px 0",
      height: "100%",
      padding: "30px 40px",
    }}
  >
    {[
      {
        name: "播放分补正",
        top: [
          <span
            key="1"
            style={{ color: STYLES.colors.accentRed, fontWeight: 900 }}
          >
            硬币
          </span>,
          <span key="2" style={{ margin: "0 8px", color: "#888" }}>
            ＋
          </span>,
          <span key="3" style={{ fontWeight: 900 }}>
            收藏
          </span>,
        ],
        btm: [
          <span key="1" style={{ fontWeight: 900 }}>
            播放
          </span>,
        ],
        val: "10",
        max: "1.00",
      },
      {
        name: "收藏分补正",
        top: [
          <span key="1" style={{ fontWeight: 900 }}>
            收藏
          </span>,
          <span key="2" style={{ margin: "0 8px", color: "#888" }}>
            ＋
          </span>,
          <span
            key="3"
            style={{
              color: STYLES.colors.accentBlue,
              fontWeight: 900,
              fontFamily: "Consolas",
            }}
          >
            2
          </span>,
          <span key="4" style={{ margin: "0 8px", color: "#888" }}>
            ×
          </span>,
          <span
            key="5"
            style={{ color: STYLES.colors.accentRed, fontWeight: 900 }}
          >
            硬币
          </span>,
        ],
        btm: [
          <span
            key="1"
            style={{
              color: STYLES.colors.accentBlue,
              fontWeight: 900,
              fontFamily: "Consolas",
            }}
          >
            10
          </span>,
          <span key="2" style={{ margin: "0 8px", color: "#888" }}>
            ×
          </span>,
          <span key="3" style={{ fontWeight: 900 }}>
            收藏
          </span>,
          <span key="4" style={{ margin: "0 8px", color: "#888" }}>
            ＋
          </span>,
          <span key="5" style={{ fontWeight: 900 }}>
            播放
          </span>,
        ],
        val: "200",
        max: "20.00",
      },
      {
        name: "硬币分补正",
        top: [
          <span
            key="1"
            style={{
              color: STYLES.colors.accentBlue,
              fontWeight: 900,
              fontFamily: "Consolas",
            }}
          >
            40
          </span>,
          <span key="2" style={{ margin: "0 8px", color: "#888" }}>
            ×
          </span>,
          <span
            key="3"
            style={{ color: STYLES.colors.accentRed, fontWeight: 900 }}
          >
            硬币
          </span>,
        ],
        btm: [
          <span
            key="1"
            style={{
              color: STYLES.colors.accentBlue,
              fontWeight: 900,
              fontFamily: "Consolas",
            }}
          >
            20
          </span>,
          <span key="2" style={{ margin: "0 8px", color: "#888" }}>
            ×
          </span>,
          <span
            key="3"
            style={{ color: STYLES.colors.accentRed, fontWeight: 900 }}
          >
            硬币
          </span>,
          <span key="4" style={{ margin: "0 8px", color: "#888" }}>
            ＋
          </span>,
          <span key="5" style={{ fontWeight: 900 }}>
            播放
          </span>,
        ],
        val: "40",
        max: "40.00",
      },
      {
        name: "点赞分补正",
        top: [
          <span
            key="1"
            style={{ color: STYLES.colors.accentRed, fontWeight: 900 }}
          >
            硬币
          </span>,
          <span key="2" style={{ margin: "0 8px", color: "#888" }}>
            ＋
          </span>,
          <span key="3" style={{ fontWeight: 900 }}>
            收藏
          </span>,
        ],
        btm: [
          <span
            key="1"
            style={{
              color: STYLES.colors.accentBlue,
              fontWeight: 900,
              fontFamily: "Consolas",
            }}
          >
            20
          </span>,
          <span key="2" style={{ margin: "0 8px", color: "#888" }}>
            ×
          </span>,
          <span key="3" style={{ fontWeight: 900 }}>
            点赞
          </span>,
          <span key="4" style={{ margin: "0 8px", color: "#888" }}>
            ＋
          </span>,
          <span key="5" style={{ fontWeight: 900 }}>
            播放
          </span>,
        ],
        val: "100",
        max: "5.00",
      },
      {
        name: "弹幕分补正",
        top: [
          <span
            key="1"
            style={{
              color: STYLES.colors.accentBlue,
              fontWeight: 900,
              fontFamily: "Consolas",
            }}
          >
            20
          </span>,
          <span key="2" style={{ margin: "0 8px", color: "#888" }}>
            ×
          </span>,
          <span key="3" style={{ fontWeight: 900 }}>
            评论
          </span>,
          <span key="4" style={{ margin: "0 8px", color: "#888" }}>
            ＋
          </span>,
          <span key="5" style={{ fontWeight: 900 }}>
            收藏
          </span>,
          <span key="6" style={{ margin: "0 8px", color: "#888" }}>
            ＋
          </span>,
          <span key="7" style={{ fontWeight: 900 }}>
            点赞
          </span>,
        ],
        btm: [
          <span key="1" style={{ fontWeight: 900 }}>
            弹幕
          </span>,
          <span key="2" style={{ margin: "0 8px", color: "#888" }}>
            ＋
          </span>,
          <span key="3" style={{ fontWeight: 900 }}>
            评论
          </span>,
        ],
        val: "",
        max: "100.00",
      },
      {
        name: "评论分补正",
        top: [
          <span
            key="1"
            style={{
              color: STYLES.colors.accentBlue,
              fontWeight: 900,
              fontFamily: "Consolas",
            }}
          >
            40
          </span>,
          <span key="2" style={{ margin: "0 8px", color: "#888" }}>
            ×
          </span>,
          <span key="3" style={{ fontWeight: 900 }}>
            评论
          </span>,
          <span key="4" style={{ margin: "0 8px", color: "#888" }}>
            ＋
          </span>,
          <span key="5" style={{ fontWeight: 900 }}>
            点赞
          </span>,
          <span key="6" style={{ margin: "0 8px", color: "#888" }}>
            ＋
          </span>,
          <span key="7" style={{ fontWeight: 900 }}>
            收藏
          </span>,
        ],
        btm: [
          <span
            key="1"
            style={{
              color: STYLES.colors.accentBlue,
              fontWeight: 900,
              fontFamily: "Consolas",
            }}
          >
            200
          </span>,
          <span key="2" style={{ margin: "0 8px", color: "#888" }}>
            ×
          </span>,
          <span key="3" style={{ fontWeight: 900 }}>
            评论
          </span>,
          <span key="4" style={{ margin: "0 8px", color: "#888" }}>
            ＋
          </span>,
          <span key="5" style={{ fontWeight: 900 }}>
            播放
          </span>,
        ],
        val: "20",
        max: "40.00",
      },
      {
        name: "分享分补正",
        top: [
          <span
            key="1"
            style={{
              color: STYLES.colors.accentBlue,
              fontWeight: 900,
              fontFamily: "Consolas",
            }}
          >
            2
          </span>,
          <span key="2" style={{ margin: "0 8px", color: "#888" }}>
            ×
          </span>,
          <span
            key="3"
            style={{ color: STYLES.colors.accentRed, fontWeight: 900 }}
          >
            硬币
          </span>,
          <span key="4" style={{ margin: "0 8px", color: "#888" }}>
            ＋
          </span>,
          <span key="5" style={{ fontWeight: 900 }}>
            收藏
          </span>,
        ],
        btm: [
          <span
            key="1"
            style={{
              color: STYLES.colors.accentBlue,
              fontWeight: 900,
              fontFamily: "Consolas",
            }}
          >
            5
          </span>,
          <span key="2" style={{ margin: "0 8px", color: "#888" }}>
            ×
          </span>,
          <span key="3" style={{ fontWeight: 900 }}>
            分享
          </span>,
          <span key="4" style={{ margin: "0 8px", color: "#888" }}>
            ＋
          </span>,
          <span key="5" style={{ fontWeight: 900 }}>
            点赞
          </span>,
        ],
        val: "10",
        max: "10.00",
      },
    ].map((row, i) => (
      <React.Fragment key={i}>
        <div
          style={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            fontSize: 36,
            fontWeight: 900,
            justifyContent: "flex-end",
            fontFamily: STYLES.fontMain,
          }}
        >
          {row.name}
        </div>
        <div
          style={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            fontSize: 36,
            fontWeight: 900,
            justifyContent: "center",
          }}
        >
          =
        </div>
        <div
          style={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            fontSize: 36,
            fontWeight: 900,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              flexDirection: "column",
              textAlign: "center",
              margin: "0 10px",
              lineHeight: 1.1,
              fontSize: "80%",
            }}
          >
            <div
              style={{
                borderBottom: "3px solid #1d1d1f",
                padding: "0 5px 5px",
                whiteSpace: "nowrap",
              }}
            >
              {row.top}
            </div>
            <div style={{ paddingTop: 5, whiteSpace: "nowrap" }}>{row.btm}</div>
          </div>
        </div>
        <div
          style={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            fontSize: 36,
            fontWeight: 900,
            justifyContent: "center",
          }}
        >
          {row.val && <span style={{ margin: "0 8px", color: "#888" }}>×</span>}
        </div>
        <div
          style={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            fontSize: 36,
            fontWeight: 900,
          }}
        >
          {row.val && (
            <span
              style={{
                color: STYLES.colors.accentBlue,
                fontWeight: 900,
                fontFamily: "Consolas",
              }}
            >
              {row.val}
            </span>
          )}
        </div>
        <div
          style={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            fontSize: 36,
            fontWeight: 900,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 220,
              fontSize: 26,
              color: "#4A4A4A",
              background: "#F5F5F5",
              border: "2px solid #E0E0E0",
              padding: "6px 12px",
              borderRadius: 8,
              fontFamily: "Consolas",
              fontWeight: 900,
            }}
          >
            最大值 {row.max}
          </div>
        </div>
      </React.Fragment>
    ))}
    <div
      style={{
        gridColumn: "1 / -1",
        width: "100%",
        display: "flex",
        justifyContent: "flex-end",
        gap: 100,
        fontSize: 22,
        fontWeight: 500,
        color: "#888",
        paddingTop: 10,
        fontFamily: STYLES.fontMain,
      }}
    >
      <span>
        *
        <span style={{ color: STYLES.colors.accentRed, fontWeight: 900 }}>
          硬币
        </span>
        <span style={{ margin: "0 8px", color: "#888" }}>=</span>
        <span style={{ fontWeight: 900 }}>硬币</span>
        <span style={{ margin: "0 8px", color: "#888" }}>×</span>
        <span style={{ color: STYLES.colors.accentRed, fontWeight: 900 }}>
          fixA
        </span>
      </span>
      <span>*各补正值按进一法取至小数点后两位</span>
    </div>
  </div>
);

// --- [B] 公式页内容组件 ---
const FormulaPageContent = ({ type }: { type: 1 | 2 }) => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%" }}>
        {type === 1 ? <FormulaPage1 /> : <FormulaPage2 />}
      </div>
    </div>
  );
};

// --- [C] 成就与榜单组件辅助 ---
const AchievementItem = ({
  title,
  desc,
  color,
}: {
  title: string;
  desc: string;
  color: string;
}) => (
  <div style={{ marginBottom: 32 }}>
    <div
      style={{
        fontSize: 55,
        fontWeight: "900",
        color: color,
        fontFamily: STYLES.fontMain,
        marginBottom: 8,
        textShadow: "2px 2px 0px rgba(0,0,0,0.1)",
      }}
    >
      {title}
    </div>
    <div
      style={{
        fontSize: 34,
        color: "#333",
        fontWeight: "bold",
        fontFamily: STYLES.fontMain,
        lineHeight: 1.3,
      }}
    >
      {desc}
    </div>
  </div>
);

const RankRangeBox = ({
  title,
  sub,
  range,
}: {
  title: string;
  sub: string;
  range: string;
}) => (
  <div
    style={{
      flex: 1,
      backgroundColor: "#fff",
      border: STYLES.border,
      borderRadius: 16,
      boxShadow: "6px 6px 0 rgba(0,0,0,0.15)",
      padding: "20px 30px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <div
      style={{
        fontSize: 48,
        fontWeight: "900",
        marginBottom: 8,
        fontFamily: STYLES.fontMain,
      }}
    >
      {title}
    </div>
    <div
      style={{
        fontSize: 30,
        color: "#666",
        marginBottom: 10,
        fontFamily: STYLES.fontMain,
      }}
    >
      {sub}
    </div>
    <div
      style={{
        fontSize: 100,
        fontWeight: "900",
        fontFamily: STYLES.fontNum,
        lineHeight: 1,
        color: "#222",
      }}
    >
      {range}
      <span style={{ fontSize: 40, marginLeft: 8 }}>位</span>
    </div>
  </div>
);

// --- [C-1] 成就列表页 ---
const AchievementListPage = () => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        padding: "20px 40px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div>
        <AchievementItem
          title="Emerging Hit!"
          color={STYLES.colors.EmergingHitColor}
          desc="最近连续三期排名前五，即可永久获得Emerging Hit!。"
        />
        <AchievementItem
          title="Mega Hit!!!"
          color={STYLES.colors.MegaHitColor}
          desc="最近连续五期排名前三，即可永久获得Mega Hit!!!。"
        />
        <AchievementItem
          title="门番候补"
          color={STYLES.colors.SubGateColor}
          desc="最近15期内有10期在榜，即可永久获得门番候补。"
        />
        <AchievementItem
          title="门番"
          color={STYLES.colors.GateColor}
          desc="最近30期内有20期在榜，即可永久获得门番。"
        />
      </div>
    </div>
  );
};

// --- [C-2] 榜单规则页 ---
const RankRulePage = () => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        padding: "40px 40px",
        display: "flex",
        flexDirection: "column",
        gap: 40,
        justifyContent: "center",
      }}
    >
      {/* 上半部分 */}
      <div style={{ display: "flex", gap: 50, width: "100%" }}>
        <RankRangeBox title="主榜单" sub="总得点排名作品" range="1-20" />
        <RankRangeBox title="副榜单" sub="简易列表作品" range="21-100" />
      </div>
      {/* 下半部分 */}
      <div
        style={{
          backgroundColor: "#fff",
          border: STYLES.border,
          borderRadius: 16,
          boxShadow: "6px 6px 0 rgba(0,0,0,0.15)",
          padding: 40,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div
          style={{
            fontSize: 48,
            fontWeight: "900",
            fontFamily: STYLES.fontMain,
          }}
        >
          新曲榜
        </div>
        <div
          style={{
            fontSize: 34,
            lineHeight: 1.5,
            color: "#333",
            fontWeight: "500",
            fontFamily: STYLES.fontMain,
          }}
        >
          单独排名未入主榜的
          <span
            style={{
              fontWeight: "bold",
              color: STYLES.colors.EmergingHitColor,
            }}
          >
            {" "}
            两周以内投稿{" "}
          </span>
          且没有进入过主榜的新曲。
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// 4. 页面编排配置
// ------------------------------------------------------------------

const PAGES_CONFIG = [
  // --- 收录规则 3页 ---
  {
    headerTitle: "收录规则",
    component: <RulePageContent data={RULES_DATA[0]} pageIndex={0} total={3} />,
    durationSec: 5,
  },
  {
    headerTitle: "收录规则",
    component: <RulePageContent data={RULES_DATA[1]} pageIndex={1} total={3} />,
    durationSec: 5,
  },
  {
    headerTitle: "收录规则",
    component: <RulePageContent data={RULES_DATA[2]} pageIndex={2} total={3} />,
    durationSec: 5,
  },
  // --- 公式定义 2页 ---
  {
    headerTitle: "计算公式",
    component: <FormulaPageContent type={1} />,
    durationSec: 5,
  },
  {
    headerTitle: "计算公式",
    component: <FormulaPageContent type={2} />,
    durationSec: 5,
  },
  // --- 成就定义 1页 ---
  {
    headerTitle: "成就标准",
    component: <AchievementListPage />,
    durationSec: 5,
  },
  // --- 榜单构成 1页 ---
  {
    headerTitle: "榜单构成",
    component: <RankRulePage />,
    durationSec: 5,
  },
];

// ------------------------------------------------------------------
// 5. 主合成组件
// ------------------------------------------------------------------
export const MergedRulesCard = () => {
  const { fps, height } = useVideoConfig();
  const frame = useCurrentFrame();

  // 计算总时长 (帧)
  const totalDuration =
    PAGES_CONFIG.reduce((acc, page) => acc + page.durationSec, 0) * fps;

  // ------------------- 全局进场与退场动画 (卡片位移) -------------------
  const transitionDuration = 30; // 0.5秒

  // 进场：从下往上 (最初30帧)
  const entranceY = spring({
    frame,
    fps,
    from: height,
    to: 0,
    config: { damping: 14, mass: 0.8 },
  });

  // 退场：从上往下 (最后30帧)
  const exitStart = totalDuration - transitionDuration;
  const exitProgress = interpolate(frame, [exitStart, totalDuration], [0, 1], {
    extrapolateLeft: "clamp",
  });
  const exitY = interpolate(exitProgress, [0, 1], [0, height], {
    easing: Easing.in(Easing.exp),
  });

  // 综合位移：入场优先，之后如果是退场时间则应用退场位移
  const translateY = frame < exitStart ? entranceY : exitY;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: STYLES.colors.bg,
      }}
    >
      <DotPattern />

      {/* 居中大卡片容器 */}
      <div
        style={{
          width: 1700,
          height: 940,
          backgroundColor: "#fff",
          border: STYLES.border,
          borderRadius: 24,
          boxShadow: STYLES.shadow,
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) translateY(${translateY}px)`,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          zIndex: 1,
        }}
      >
        {/* 内容轮播区域 */}
        <div style={{ flex: 1, position: "relative" }}>
          {
            PAGES_CONFIG.reduce<{
              elements: React.ReactNode[];
              currentFrameOffset: number;
            }>(
              (acc, page, index) => {
                const pageDurationFrames = page.durationSec * fps;
                const startFrame = acc.currentFrameOffset;

                acc.elements.push(
                  <Sequence
                    key={index}
                    from={startFrame}
                    durationInFrames={pageDurationFrames}
                  >
                    <PageWrapper
                      page={page}
                      fps={fps}
                      duration={pageDurationFrames}
                    />
                  </Sequence>,
                );

                acc.currentFrameOffset += pageDurationFrames;
                return acc;
              },
              { elements: [], currentFrameOffset: 0 },
            ).elements
          }
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------
// 6. 页面包装器 (处理 Header 变化和 渐隐渐显)
// ------------------------------------------------------------------
const PageWrapper = ({
  page,
  fps,
  duration,
}: {
  page: (typeof PAGES_CONFIG)[0];
  fps: number;
  duration: number;
}) => {
  const frame = useCurrentFrame();
  const fadeFrames = 15; // 渐变时长 (约0.25秒)

  const opacity = interpolate(
    frame,
    [0, fadeFrames, duration - fadeFrames, duration],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#fff",
        opacity,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 动态顶部 Header */}
      <div
        style={{
          height: 100,
          backgroundColor: STYLES.colors.headerBg,
          display: "flex",
          alignItems: "center",
          padding: "0 40px",
          borderBottom: STYLES.border,
          flexShrink: 0,
        }}
      >
        <h1
          style={{
            color: STYLES.colors.headerText,
            fontSize: 48,
            margin: 0,
            fontFamily: STYLES.fontMain,
            letterSpacing: 2,
          }}
        >
          {page.headerTitle}
        </h1>
      </div>

      {/* 页面具体内容 */}
      <div style={{ flex: 1, position: "relative" }}>{page.component}</div>
    </AbsoluteFill>
  );
};
