# 习惯记录器 (Habit Recorder)

一个简洁而强大的习惯追踪应用，帮助您建立和维持良好的生活习惯。

## ✨ 功能特性

### 🎯 多样化的习惯类型
- **数值型习惯**: 追踪具体数量（如每天喝8杯水）
- **计时型习惯**: 记录持续时间（如锻炼30分钟）
- **时间点型习惯**: 记录特定时间（如早上6点起床）
- **签到型习惯**: 简单的完成/未完成追踪

### 📊 数据可视化
- 支持柱状图和折线图两种图表类型
- 灵活的时间范围选择（近7天、本周、近30天、本月、本年）
- 实时数据更新和进度展示

### 💾 本地数据存储
- 所有数据存储在浏览器本地，保护隐私
- 无需注册账号，开箱即用
- 支持数据导入导出（规划中）

### 🎨 现代化界面
- 响应式设计，支持手机和桌面设备
- 使用 Tailwind CSS 打造的优雅界面
- 直观的用户体验

## 🚀 快速开始

### 环境要求
- Node.js 16.0 或更高版本
- npm 或 yarn 包管理器

### 安装步骤

1. 克隆项目到本地
```bash
git clone <repository-url>
cd habbit-recorder
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm run dev
```

4. 在浏览器中打开 `http://localhost:5173`

### 构建生产版本
```bash
npm run build
```

构建完成的文件将在 `dist` 目录中。

## 🛠️ 技术栈

- **前端框架**: React 18
- **类型检查**: TypeScript
- **构建工具**: Vite
- **样式框架**: Tailwind CSS
- **图标库**: Lucide React
- **图表库**: Recharts
- **日期处理**: date-fns
- **状态管理**: React Hooks (无外部状态管理库)

## 📁 项目结构

```
src/
├── components/          # React 组件
│   ├── auth/           # 认证相关组件
│   ├── charts/         # 图表组件
│   ├── dashboard/      # 仪表板组件
│   ├── habits/         # 习惯管理组件
│   ├── layout/         # 布局组件
│   ├── record/         # 记录页面组件
│   └── settings/       # 设置页面组件
├── types/              # TypeScript 类型定义
├── utils/              # 工具函数
│   ├── dateUtils.ts    # 日期处理工具
│   └── storage.ts      # 本地存储工具
├── App.tsx             # 主应用组件
└── main.tsx           # 应用入口点
```

## 🎯 使用方法

1. **创建习惯**: 在"习惯管理"页面点击"添加习惯"，选择习惯类型并设置目标
2. **记录进度**: 在"记录"页面选择日期，为每个习惯输入当天的完成情况
3. **查看分析**: 在"仪表板"页面查看习惯完成趋势和统计数据
4. **管理习惯**: 可以编辑、暂停或删除不需要的习惯

## 🔧 开发命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 运行代码检查
npm run lint

# 预览生产构建
npm run preview
```

## 📋 待办事项

- [ ] 数据导入导出功能
- [ ] 习惯提醒通知
- [ ] 更多图表类型支持
- [ ] 深色模式
- [ ] 移动端应用版本

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 💡 灵感来源

这个项目的灵感来自于帮助人们建立和维持良好习惯的需求。通过简单易用的界面和强大的数据可视化功能，让习惯追踪变得更加有趣和有效。
