# picgo-plugin-convert-to-webp

一个 PicGo 插件，用于将上传的图片自动转换为 WebP 格式。

## 功能特性

- 🚀 **自动转换**：上传图片时自动转换为 WebP 格式
- 🔄 **智能判断**：如果上传的已是 WebP 格式，则跳过转换
- 💾 **本地备份**：在本地保留转换后的 WebP 文件备份
- 📦 **轻量高效**：基于 Sharp 库，转换速度快，质量高

## 安装方法

### 方法一：通过 PicGo 插件市场安装

1. 打开 PicGo 应用
2. 进入「插件设置」页面
3. 在搜索框中输入 `convert-to-webp`
4. 点击「安装」按钮

### 方法二：手动安装

1. 将本项目克隆或下载本地
2. 在根目录下，执行 `yarn install` 安装依赖
3. 然后执行 `yarn build` 构建插件
4. 打开picgo的插件面板，选择安装把本地插件，然后选择当前项目目录，会自动识别到dist目录下的文件（不能直接选择dist目录）

## 使用说明

1. 确保插件已在 PicGo 中启用
2. 正常上传图片，插件会自动将非 WebP 格式的图片转换为 WebP 格式
3. 转换后的 WebP 文件会保存在原图片所在目录

## 开发流程

### 0. 环境版本

```bash
C:\Users\xxx>node --version
v22.19.0
C:\Users\xxx>npm --version
10.9.3
C:\Users\xxx>
```

### 1. 项目初始化

```bash
# 安装picgo全局插件
sudo npm install picgo -g

# 使用 picgo  命令创建一个插件项目
picgo init plugin convert-to-webp

# 安装 PicGo 开发依赖
# yarn add picgo@^1.5.0-alpha.13 --dev

# 安装 Sharp 库用于图片转换
yarn add sharp@^0.32.5

# 安装 TypeScript 相关依赖
yarn add typescript @types/node @types/sharp --dev
```

### 2. 项目配置

- 创建 `tsconfig.json` 配置 TypeScript 编译选项
- 创建 `.eslintrc` 配置代码规范
- 配置 `package.json` 中的脚本命令

### 3. 插件实现

#### 3.1 核心功能

插件的核心功能是在图片上传前将其转换为 WebP 格式，主要实现了以下逻辑：

```typescript
// 1. 获取上传的图片路径
let [imgPath] = ctx.input;
let imgExt = path.extname(imgPath);

// 2. 如果是 WebP 格式则跳过转换
if (imgExt === '.webp') {
  return ctx;
}

// 3. 将图片转换为 WebP 格式
let imgBuffer = await sharp(imgPath)
  .webp()
  .toBuffer();

// 4. 保存转换后的 WebP 文件
const webpPath = path.join(path.dirname(imgPath), path.basename(imgPath, imgExt) + '.webp');
await fs.writeFile(webpPath, imgBuffer);

// 5. 更新上传路径为转换后的 WebP 文件
ctx.input = [webpPath];
```

#### 3.2 事件注册

插件通过注册 PicGo 的 `beforeTransformPlugins` 事件来实现图片转换：

```typescript
ctx.helper.beforeTransformPlugins.register('picgo-plugin-convert-to-webp', {
  handle
});
```

### 4. 构建与发布

```bash
# 开发模式（监听文件变化自动构建）
yarn dev

# 构建生产版本
yarn build

# 发布插件到 npm
yarn publish
```

## 项目结构

```
picgo-plugin-convert-to-webp/
├── src/
│   └── index.ts          # 插件主入口
├── dist/                 # 构建输出目录
├── .eslintrc             # ESLint 配置
├── .gitignore            # Git 忽略配置
├── .npmignore            # npm 忽略配置
├── .travis.yml           # Travis CI 配置
├── License               # 许可证文件
├── README.md             # 项目说明文档
├── package.json          # npm 项目配置
├── tsconfig.json         # TypeScript 配置
└── yarn.lock             # Yarn 依赖锁定文件
```

## 技术栈

- **TypeScript**：开发语言
- **Sharp**：图片处理库
- **PicGo**：插件运行环境
- **ESLint**：代码规范检查

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [License](License) 文件了解详情。

## 作者

- **oec2003** - [GitHub](https://github.com/oec2003)

## 致谢

感谢 PicGo 团队提供了如此优秀的图片上传工具！
