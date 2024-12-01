# Artbit Drawing App

一个跨平台的在线绘图应用，支持触摸屏和鼠标操作。

## 功能特点

- 自由绘画：支持画笔工具，可调节颜色和粗细
- 图形工具：支持绘制矩形和圆形
- 橡皮擦：可擦除已绘制的内容
- 撤销/重做：支持操作历史记录
- 保存功能：可将作品保存为PNG图片
- 跨平台支持：适配桌面和移动设备
- 触摸优化：支持压力感应（在支持的设备上）

## 技术栈

- HTML5 Canvas
- 原生 JavaScript
- CSS3
- PWA 支持

## 在线体验

访问 [https://[你的GitHub用户名].github.io/artbit-demo](https://[你的GitHub用户名].github.io/artbit-demo) 即可在线使用。

## 本地运行

1. 克隆仓库：
```bash
git clone https://github.com/[你的GitHub用户名]/artbit-demo.git
```

2. 使用任意 Web 服务器运行项目，例如：
```bash
# 使用 Python 的简单 HTTP 服务器
python -m http.server 8000
```

3. 在浏览器中访问 `http://localhost:8000`

## 开发说明

- `index.html`: 主页面结构
- `css/style.css`: 样式表
- `js/app.js`: 核心功能实现
- `manifest.json`: PWA 配置文件

## License

MIT License
