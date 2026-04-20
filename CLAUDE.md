# 项目说明：高德打车时间间隔检查工具

## 项目用途

这是一个网页工具，用于在一天有两个外出订单的情况下，判断两个订单之间的间隔时间是否足够完成第二个行程的打车，并在高德地图上显示完整路线。

## 技术架构

- **构建工具**：Vite，使用 `npm run dev` 启动开发服务器
- **技术栈**：纯 HTML + CSS + JavaScript，无框架
- **高德API**：使用两个不同的API Key分别对应两个服务：
  - `GAODE_JS_API_KEY` - **Web端(JS API)**：负责地图显示、路线绘制、标记点
  - `GAODE_WEB_API_KEY` - **Web服务**：负责地理编码（地址转坐标）、驾车路径规划计算

## 文件结构

```
├── index.html          # 主页面，表单和地图容器
├── css/
│   └── style.css       # 样式，响应式设计
├── js/
│   ├── app.js          # 核心应用逻辑
│   ├── config.js       # API Key配置（不在Git中，已.gitignore）
│   └── config.js.example # 配置示例
├── CLAUDE.md           # 本文件，项目说明
├── .gitignore          # Git忽略
├── package.json        # npm配置
└── README.md           # 使用说明
```

## 已实现功能

1. ✅ 两个行程输入表单
2. ✅ 自动填充：行程1目的地 → 行程2出发地（每次输入都同步）
3. ✅ 地理编码：将地址转换为坐标
4. ✅ 路径规划：计算驾车预计时间和距离
5. ✅ 地图显示：两个行程都显示在地图上
   - 行程1：橙色路线
   - 行程2：蓝色路线
   - 四个点都有标记
6. ✅ 结果判断：比较预计时间和可用间隔，绿色表示时间足够，红色表示不够
7. ✅ 处理高德免费QPS限制：串行请求+1.1秒间隔，避免超限
8. ✅ 响应式布局，支持移动端

## API Key配置位置

`js/config.js` 文件格式：

```javascript
// 高德地图API Key配置
// JS API Key (Web端) - 用于地图显示和路线规划
const GAODE_JS_API_KEY = 'xxx';
// Web服务API Key (Web服务) - 用于地理编码
const GAODE_WEB_API_KEY = 'xxx';
```

## 注意事项

- 高德免费额度：Web服务地理编码QPS限制为 **1次/秒**，代码已处理延迟
- 一个高德Key只能绑定一个服务平台，因此需要两个Key
- `js/config.js` 已加入 `.gitignore`，不会提交到Git，保护API Key安全

## 启动命令

```bash
npm install
npm run dev
```

## 最近修改记录

- 2026-04-20：初始功能开发完成，支持两个行程显示、时间判断、地图绘制
