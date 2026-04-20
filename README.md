# 高德打车时间间隔检查工具

一个简单的网页工具，帮助你判断两个外出订单之间的间隔时间是否足够完成第二个行程的打车，并在地图上显示完整路线。

## 功能

- 输入两个行程的地址信息
- 自动填充第二个行程的起点为第一个行程的终点
- 使用高德地图API计算预计打车时间和距离
- 在地图上显示两个行程，用不同颜色区分（行程1橙色，行程2蓝色）
- 判断可用间隔时间是否足够，并给出结论（绿色=足够，红色=不够）

## 开发启动

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:5173 即可使用
```

## 配置API Key

复制 `js/config.js.example` 为 `js/config.js`，填入你的两个高德API Key：

```javascript
// JS API Key (Web端) - 用于地图显示和路线绘制
const GAODE_JS_API_KEY = 'your_js_api_key';
// Web服务API Key (Web服务) - 用于地理编码和路径规划
const GAODE_WEB_API_KEY = 'your_web_service_key';
```

> **注意**：一个高德Key只能绑定一个服务平台，需要两个Key。

## 使用方法

1. 输入行程1的出发地和目的地
2. 输入行程2的目的地（出发地会自动填充为行程1的目的地）
3. 输入两个行程之间可用的间隔时间（分钟）
4. 点击"计算"按钮查看结果

## 技术说明

- Vite + 纯HTML/CSS/JavaScript，无需框架
- 使用高德地图 JavaScript API 显示地图
- 使用高德 Web服务API 进行地理编码和路径规划（避免权限冲突）
- 响应式设计，支持手机和电脑

## 高德API配置

在[高德开放平台](https://lbs.amap.com/)创建两个Key：

1. **Key 1**：勾选 `Web端(JS API)` → 用于地图显示
2. **Key 2**：勾选 `Web服务` → 用于地理编码和路径规划

## 安全提示

由于是纯前端应用，API Key会暴露在浏览器中。建议在高德开发者后台设置 `referrer` 域名限制，防止被盗用。

## 许可证

MIT License © 2026
