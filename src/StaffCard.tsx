// src/StaffCard.tsx
import {
  AbsoluteFill,
  useVideoConfig,
  useCurrentFrame,
  spring,
  Img,
} from "remotion";

// ------------------------------------------------------------------
// 样式配置
// ------------------------------------------------------------------
const STYLES = {
  colors: {
    bg: "#fffbf0",
    cardBg: "#ffffff",
    border: "#000000",
    headerBg: "#222222",
    headerText: "#ffffff",
    nameText: "#222222",
    uidText: "#888888",
    qqBlue: "#23ADE5",
    webRed: "#FF5555",
    dot: "#d7ccc8",
  },
  border: "3px solid #000",
  shadow: "8px 8px 0px rgba(0,0,0,1)",
  fontMain: '"Microsoft YaHei", "Heiti SC", sans-serif',
  fontMono: 'Consolas, "Arial Black", monospace',
};

// 背景装饰点
const DotPattern = () => (
  <AbsoluteFill
    style={{
      backgroundImage: `radial-gradient(${STYLES.colors.dot} 3px, transparent 3px)`,
      backgroundSize: "24px 24px",
      opacity: 0.6,
      zIndex: 0,
    }}
  />
);

interface StaffMember {
  name: string;
  uid: string;
  avatar: string;
}

export const StaffCard = ({ staffList }: { staffList: StaffMember[] }) => {
  const { fps, durationInFrames, height } = useVideoConfig();
  const frame = useCurrentFrame();

  // ------------------- 动画逻辑 -------------------

  // 1. 卡片入场 (从下往上)
  const cardEnter = spring({
    frame,
    fps,
    from: height,
    to: 0,
    config: { damping: 14, mass: 0.8, stiffness: 100 },
  });

  // 2. 卡片出场 (往下掉)
  const exitStartFrame = durationInFrames - 30;
  const cardExit = spring({
    frame: frame - exitStartFrame,
    fps,
    from: 0,
    to: height,
    config: { damping: 14, mass: 0.8, stiffness: 100 },
  });

  const cardY = cardEnter + cardExit;

  // 3. 成员列表 stagger 动画
  // 将列表分为 3 列，每列 4 行
  const columns = [[], [], []] as StaffMember[][];
  staffList.forEach((member, index) => {
    const colIndex = Math.floor(index / 4); // 0,0,0,0, 1,1,1,1, 2,2,2... (注意: CSS grid-auto-flow: column 是按列填充)
    if (columns[colIndex]) {
      columns[colIndex].push(member);
    }
  });

  return (
    <AbsoluteFill style={{ backgroundColor: STYLES.colors.bg }}>
      <DotPattern />

      {/* 主容器 */}
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `translateY(${cardY}px)`,
        }}
      >
        <div
          style={{
            width: 1700,
            height: 940,
            backgroundColor: STYLES.colors.cardBg,
            border: STYLES.border,
            borderRadius: 24,
            boxShadow: STYLES.shadow,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          {/* Header */}
          <div
            style={{
              height: 80,
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
                fontSize: 40,
                margin: 0,
                letterSpacing: 2,
                fontWeight: 900,
                fontFamily: STYLES.fontMono,
              }}
            >
              STAFF
            </h1>
          </div>

          {/* Content - Grid Layout */}
          <div
            style={{
              flex: 1,
              padding: "15px 30px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gridTemplateRows: "repeat(4, 1fr)",
              gridAutoFlow: "column",
              gap: "8px 50px",
              margin: "30px 140px 50px 100px",
            }}
          >
            {staffList.map((member, index) => {
              // Stagger delay based on index
              const delay = 15 + index * 3;
              const itemOpacity = spring({
                frame: frame - delay,
                fps,
                from: 0,
                to: 1,
                config: { mass: 0.5 },
              });
              const itemX = spring({
                frame: frame - delay,
                fps,
                from: -20,
                to: 0,
                config: { mass: 0.5 },
              });

              return (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    borderBottom: "2px dashed #ddd",
                    padding: "8px 0",
                    opacity: itemOpacity,
                    transform: `translateX(${itemX}px)`,
                  }}
                >
                  <div
                    style={{
                      width: 110,
                      height: 110,
                      border: STYLES.border,
                      borderRadius: 14,
                      marginRight: 24,
                      backgroundColor: "#eee",
                      overflow: "hidden",
                      flexShrink: 0,
                      boxShadow: "4px 4px 0 rgba(0,0,0,0.15)",
                    }}
                  >
                    <Img
                      src={member.avatar}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      gap: 4,
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 42,
                        fontWeight: 900,
                        color: STYLES.colors.nameText,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        fontFamily: STYLES.fontMain,
                      }}
                    >
                      {member.name}
                    </span>
                    <span
                      style={{
                        fontFamily: STYLES.fontMono,
                        fontSize: 24,
                        color: STYLES.colors.uidText,
                        fontWeight: 700,
                      }}
                    >
                      UID: {member.uid}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Special Grid Item: Contact Info (Takes the last slot in Column 3) */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "flex-end",
                padding: "8px 0",
                gap: 20,
              }}
            >
              {/* QQ Group */}
              <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 900,
                      color: STYLES.colors.uidText,
                      letterSpacing: 1,
                      marginBottom: 2,
                      fontFamily: STYLES.fontMain,
                    }}
                  >
                    术力口数据库QQ群
                  </div>
                  <div
                    style={{
                      fontFamily: STYLES.fontMono,
                      fontSize: 36,
                      fontWeight: 900,
                      color: "#222",
                      lineHeight: 1,
                    }}
                  >
                    974585468
                  </div>
                </div>
                <div
                  style={{
                    width: 50,
                    height: 50,
                    backgroundColor: STYLES.colors.qqBlue,
                    borderRadius: 12,
                    border: "3px solid #000",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "#fff",
                    boxShadow: "3px 3px 0 rgba(0,0,0,0.3)",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 900,
                      fontFamily: STYLES.fontMono,
                      fontSize: 20,
                    }}
                  >
                    QQ
                  </span>
                </div>
              </div>

              {/* Website */}
              <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 900,
                      color: STYLES.colors.uidText,
                      letterSpacing: 1,
                      marginBottom: 2,
                      fontFamily: STYLES.fontMain,
                    }}
                  >
                    术力口数据库网站
                  </div>
                  <div
                    style={{
                      fontFamily: STYLES.fontMono,
                      fontSize: 36,
                      fontWeight: 900,
                      color: "#222",
                      lineHeight: 1,
                    }}
                  >
                    vocabili.top
                  </div>
                </div>
                <div
                  style={{
                    width: 50,
                    height: 50,
                    backgroundColor: STYLES.colors.webRed,
                    borderRadius: 12,
                    border: "3px solid #000",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "#fff",
                    boxShadow: "3px 3px 0 rgba(0,0,0,0.3)",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 900,
                      fontFamily: STYLES.fontMono,
                      fontSize: 24,
                    }}
                  >
                    W
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
