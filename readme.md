# Bilibili 排行榜视频生成系统

## 1. 项目概述

本项目是一个基于 Remotion 和 Node.js 的自动化视频生成系统，专用于制作 Bilibili 虚拟歌手排行榜（周刊/月刊/特刊）。系统接收 JSON 格式的榜单数据，自动调度素材下载、视频分片渲染以及基于 FFmpeg 的硬件加速合成。

- **核心功能**：数据解析、自动化剪辑、React 视频渲染、多片段并发合成。
- **核心技术栈**：Node.js (Express), Remotion (React 19), FFmpeg (NVENC), yt-dlp。
- **硬性依赖**：Chrome Headless Shell, NVIDIA 显卡 (支持 CUDA/NVENC)。

## 2. 功能模块说明

系统架构分为控制台、合成引擎与渲染核心三部分：

```text
Web 控制台 (Frontend)
职责：提供可视化操作界面，无需直接操作数据库或命令行。
功能：JSON 数据上传与校验、分片状态管理、合成任务触发、实时日志流。

合成引擎 (Backend/Synthesis)
职责：系统的“大脑”，管理任务状态机 (Idle -> Processing -> Completed)。
功能：
- 资源调度：调用 yt-dlp 并发下载 B 站视频/音频/封面，管理本地缓存 (/downloads)。
- 流程控制：按顺序执行 P1 (片头/规则)、P2 (主榜/新曲榜)、P3 (副榜/结尾) 的渲染与合并。
- 逻辑计算：根据 issueTypes 配置计算榜单逻辑（如周刊 vs 月刊的区别）。

渲染核心 (Remotion/FFmpeg)
职责：视频画面的生成与编码。
功能：
- 组件渲染：将 React 组件渲染为 MP4 视频分片。
- 硬件编码：强制使用 h264_nvenc 进行 GPU 加速渲染。
- 后期处理：使用 FFmpeg concat 滤镜拼接分片，并处理 OP/ED 混音及音频淡入淡出。
```

## 3. 前端功能说明

前端采用原生 HTML/JS 实现，无构建流程，直接由 Express 托管 `public` 目录。

```text
/index.html
- 任务看板：显示当前任务进度、步骤及实时日志。
- 文件管理：上传 JSON 数据文件，查看历史文件状态。
- 分片管理：查看已生成的视频分片，支持单文件下载或删除重绘。

/editor.html
- 切片编辑器：可视化波形时间轴，调整歌曲预览片段的起止点 (默认 20s)。
- 文案配置：设置 OP/ED 信息、开场/结尾文案、封面图选择。
- 实时预览：调用本地播放器预览裁切效果。
```

## 4. 目录结构与分层架构

### 4.1 物理目录结构

```text
/
  /config/             - 静态配置 (issueTypes.js 刊物定义, avatar/ 头像库, index.js 环境配置)
  /public/             - 前端静态资源 (Web UI)
  /routes/             - Express API 路由定义
  /src/                - Remotion 视频组件源码 (详见 4.2)
  /synthesis/          - 核心合成业务逻辑 (任务调度、流程控制)
  /utils/              - 基础设施层 (FFmpeg封装, Render封装, 下载器, 裁切库)
  /data/               - [Runtime] 存放用户上传的 JSON 数据和 clips_db.json
  /downloads/          - [Runtime] 原始素材缓存 (视频/图片/音频)
  /video/              - [Runtime] 渲染产物 (分片及最终合成文件)
  server.js            - 后端服务入口
  state.js             - 内存任务状态管理
```

### 4.2 src 视频合成架构详解

`/src` 目录遵循 **视频合成架构 (Composition-Based Architecture)**，采用数据驱动模式，数据流向为 `Server (JSON)` -> `Remotion Props` -> `React Components`。

```text
/src
  ├── index.ts                # [入口层] Webpack 入口，负责调用 registerRoot
  ├── Root.tsx                # [注册层] 定义所有视频合成(Composition)的契约
  ├── index.css               # [样式层] 全局样式入口 (TailwindCSS)
  ├── Icons.tsx               # [资源层] SVG 图标库
  │
  │── [场景合成层 (Composition Layer)]
  │   # P1: 片头与规则
  ├── Intro.tsx               # 片头 (Logo, 刊号, 封面)
  ├── InfoCard.tsx            # 信息卡 (OP信息, 统计时间, 备注)
  ├── MergedRulesCard.tsx     # 规则聚合页 (使用 Sequence 排列多页规则)
  │   # P2: 核心榜单
  ├── SectionTitle.tsx        # 过场标题 (动态数字跳转动画)
  ├── NewSongCard.tsx         # 新曲榜卡片 (左侧 PV 流 + 右侧数据栏)
  ├── RankCard.tsx            # 主榜卡片 (核心组件，含排名变动/趋势逻辑)
  │   # P3: 统计与结尾
  ├── SingerRank.tsx          # 歌手/声源排名 (Grid 布局)
  ├── MillionRank.tsx         # 百万播放达成
  ├── AchievementRank.tsx     # 荣誉成就达成 (Emerging/Mega Hit)
  ├── HistoryRank.tsx         # 历史回顾
  ├── StatsCard.tsx           # 全站数据大盘
  ├── StaffCard.tsx           # 制作人员名单
  └── SubRank.tsx             # 副榜列表 (多页轮播，纯图文)
```

**逻辑分层说明：**

1.  **注册与配置层 (Registry)**:
    - `Root.tsx`: 核心路由文件。定义了每个视频 ID (如 `RankCard`) 的分辨率 (1920x1080)、帧率 (60fps) 以及默认 Props 结构。后端渲染时通过 ID 索引组件。

2.  **场景合成层 (Compositions)**:
    - 每个 `.tsx` 文件代表视频中的一个完整镜头。
    - **独立性**: 组件间互不依赖状态，完全由 Props 驱动渲染。
    - **分类**:
      - **视频流场景**: `RankCard` 等，包含 `<OffthreadVideo>` 组件用于加载外部 MP4。
      - **序列场景**: `MergedRulesCard`，内部使用 `<Sequence>` 将内容按时间轴切分。
      - **静态场景**: `Intro` 等，主要由图片和 CSS 动画构成。

3.  **UI 组件层 (Internal Components)**:
    - 为保持文件结构扁平，大部分复用 UI (如 `TrendBar`, `FitTitle`, `HonorBadge`) 直接定义在对应的场景文件内部，而非拆分到单独文件。

4.  **样式层 (Styling)**:
    - 使用 CSS-in-JS (行内 `style` 对象) 结合 TailwindCSS。行内样式主要用于处理涉及 JS 变量的动态布局（如进度条宽度、排名颜色）。

## 5. Task 

本系统任务由 HTTP 请求触发。

```text
Synthesis Task      - 全量合成任务。包含数据准备、全量渲染、合并。触发: POST /api/synthesis/start
Merge Task          - 仅合并任务。跳过渲染步骤，直接使用现有分片重新合并。触发: POST /api/synthesis/merge
Download Task       - 批量素材下载。用于预览或预缓存。触发: POST /api/full-video/batch
Segment Repair      - 单分片重绘。删除指定分片并强制重新渲染。触发: POST /api/synthesis/segment
```

## 6. 环境配置

### 配置文件

在项目根目录创建一个 `.env` 文件，内容示例如下：

```
PORT=3002
CHROME_EXECUTABLE=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe;
USE_GPU=NVIDIA
```

配置项说明：
* PORT: 前端的端口号，一般就3002即可，如果被占用了的话可以改成别的。
* CHROME_EXECUTABLE: 你的电脑上Chrome无头浏览器的路径。普通的浏览器也可以，Edge也可以，其他不知道。
* USE_GPU: FFmpeg后期合成使用的显卡。填写NVIDIA、INTEL或不填。

### 系统依赖

1.  **Node.js**: v18.0.0 或更高。
2.  **FFmpeg**: 必须安装并添加到 PATH，且**必须支持 NVENC 编码** (`--enable-nvenc`)。需配合 NVIDIA 显卡驱动。
3.  **yt-dlp**: 必须安装并添加到 PATH，用于下载 B 站资源。
4.  **Chrome Headless Shell**: Remotion 服务端渲染引擎。

## 7. 本地运行步骤

1.  **克隆代码**:

    ```bash
    git clone <repo_url>
    cd <repo_name>
    ```

2.  **安装依赖**:

    ```bash
    npm install
    ```

3.  **环境检查**:
    确保 `ffmpeg -version` 无报错且包含 `nvenc`。

4.  **启动服务**:

    ```bash
    node server.js
    ```

    控制台输出 `Server running on http://localhost:3002` 即表示启动成功。

5.  **开始使用**:
    浏览器访问 `http://localhost:3002`，上传 JSON 数据文件。

## 8. 构建与部署

本项目设计为本地工具，通常直接运行源码。

- **构建命令**: `npm run build` (仅用于生成 Remotion bundle 包，非必须，server.js 默认使用运行时渲染)。
- **生产环境注意事项**:
  - **显存要求**: 并发渲染 (默认 4 路) 极其消耗显存，建议显存 > 6GB。若显存不足，需在 `synthesis/task.js` 中调低 `RENDER_POOL_SIZE`。
  - **磁盘空间**: `/downloads` 和 `/video` 目录会随时间线性增长，需定期手动清理。
  - **字体**: 服务器需安装中文字体 (Microsoft YaHei)，否则视频内中文将显示为乱码。

## 9. 常用命令速查

```bash
# 启动完整后端服务
node server.js

# 启动 Remotion 预览 (用于调试组件 UI)
npm run dev

# 代码风格检查
npm run lint

# Windows 快速启动脚本
启动.bat
```

## 10. 关键业务逻辑说明

### 10.1 核心合成流程 (`synthesis/task.js`)

入口函数 `runSynthesisTask(date)` 的执行流：

1.  **初始化**: 解析 JSON，通过 `config/issueTypes.js` 判定刊物类型 (Weekly/Monthly)，生成配置对象。
2.  **封面生成**: 调用 `renderStill` 生成静态封面图。
3.  **素材准备**: 遍历所有歌曲，查询 `data/clips_db.json` 获取裁切配置。若无配置，默认截取 0-20s。调用 `yt-dlp` 下载缺失的视频片段。
4.  **分片渲染**:
    - **P1**: 串行渲染 Intro, InfoCard, Rules, Title。
    - **P2**: 并行渲染 Ranking Cards (主榜/新曲榜)。并行度由 `RENDER_POOL_SIZE` 控制。
    - **P3**: 串行/并行渲染 SubRank, Ending。
5.  **最终合并**: 使用 FFmpeg `concat` 滤镜将所有分片合并，并对 OP/ED 进行混音 (afade/amix)。

### 10.2 视频裁切逻辑

- **数据源**: `utils/clips.js` 读写 `data/clips_db.json`。
- **优先级**: 手动配置 (Editor) > 自动逻辑 (前 20s)。
- **下载策略**: `utils/download.js` 会先下载完整视频 (P1)，然后使用 FFmpeg 根据时间戳裁剪出小片段并缓存。

## 11. 接口/API 说明

所有接口均在 `routes/api.js` 中定义。

- **GET /api/files**: 列出 `/data` 目录下所有可用的数据文件及其配置状态。
- **GET /api/songs/:date**: 获取指定日期的所有歌曲详情（包含本地视频缓存状态、裁切配置）。
- **POST /api/clips/:bvid**: 保存裁切配置。
  - Body: `{ "startTime": 10.5, "endTime": 30.5 }`
- **POST /api/synthesis/start**: 启动全量合成任务。
  - Body: `{ "date": "2025-12-20" }`
- **POST /api/synthesis/segment**: 删除指定分片（触发重绘逻辑）。
  - Body: `{ "date": "...", "segmentName": "..." }`

