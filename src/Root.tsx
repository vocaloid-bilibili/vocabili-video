// src/Root.tsx
import { Composition } from "remotion";
import { RankCard } from "./RankCard";
import { Intro } from "./Intro";
import { InfoCard } from "./InfoCard";
import { SectionTitle } from "./SectionTitle";
import { MergedRulesCard } from "./MergedRulesCard";
import { SingerRank } from "./SingerRank";
import { MillionRank } from "./MillionRank";
import { AchievementRank } from "./AchievementRank";
import { HistoryRank } from "./HistoryRank";
import { NewSongCard } from "./NewSongCard";
import { SubRank } from "./SubRank";
import { StatsCard } from "./StatsCard";
import { StaffCard } from "./StaffCard";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Intro"
        component={Intro}
        durationInFrames={60 * 3}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{ issue: "#68", date: "2025.12.20", coverImg: "" }}
      />
      <Composition
        id="InfoCard"
        component={InfoCard}
        durationInFrames={60 * 5}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          opLabel: "OP / 上期冠军",
          opTitle: "测试",
          opArtist: "测试",
          opCover: "",
          timeLabel: "统计时间",
          timeRange: "2025.12.20 — 2025.12.27",
          note: "测试",
        }}
      />
      <Composition
        id="RulesAndAchivements"
        component={MergedRulesCard}
        durationInFrames={60 * 35}
        fps={60}
        width={1920}
        height={1080}
      />
      <Composition
        id="SectionTitle"
        component={SectionTitle}
        durationInFrames={60 * 2}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          title: "新曲榜",
          from: 10,
          to: 1,
          themeColor: "#23ade5",
          edName: "",
          edAuthor: "",
        }}
      />
      <Composition
        id="NewSongCard"
        component={NewSongCard}
        durationInFrames={60 * 35}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{ rank: 1, title: "测试", score: 100000 }}
      />
      <Composition
        id="RankCard"
        component={RankCard}
        durationInFrames={60 * 35}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{ rank: 1, title: "测试", score: 100000 }}
      />
      <Composition
        id="SingerRank"
        component={SingerRank}
        durationInFrames={60 * 7}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{ list: [] }}
      />
      <Composition
        id="MillionRank"
        component={MillionRank}
        durationInFrames={60 * 7}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{ list: [] }}
      />
      <Composition
        id="AchievementRank"
        component={AchievementRank}
        durationInFrames={60 * 7}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{ list: [] }}
      />
      <Composition
        id="HistoryRank"
        component={HistoryRank}
        durationInFrames={60 * 7}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{ list: [] }}
      />
      <Composition
        id="StatsCard"
        component={StatsCard}
        durationInFrames={60 * 7}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{ stat: {} }}
      />
      <Composition
        id="StaffCard"
        component={StaffCard}
        durationInFrames={60 * 7}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{ staffList: [] }}
      />
      <Composition
        id="SubRank"
        component={SubRank}
        durationInFrames={60 * 20}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{ list: [] }}
      />
    </>
  );
};
