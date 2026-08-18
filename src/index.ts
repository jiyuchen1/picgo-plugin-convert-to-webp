import path from 'path';
import sharp from 'sharp';
import { promises as fs } from 'fs';
import { PicGo, PicGoUtils, IPluginConfig } from 'picgo'

const PLUGIN_NAME = 'picgo-plugin-convert-to-webp';

// 判断输入是否为网络图片地址
const isHttpUrl = (s: string): boolean => /^https?:\/\//i.test(s);

// 从 URL 中提取安全的文件名（不含扩展名），解析失败时兜底 image
const urlBaseName = (url: string): string => {
  let base = 'image';
  try {
    const p = new URL(url).pathname;
    const ext = path.extname(p);
    const raw = path.basename(p, ext);
    if (raw) {
      base = decodeURIComponent(raw);
    }
  } catch {
    // 解析失败，使用兜底名
  }
  // 去除 Windows 文件名非法字符
  return base.replace(/[\\/:*?"<>|]/g, '_');
};

export = (ctx: PicGo) => {
  const handle = async (ctx: PicGo): Promise<PicGo> => {
    // ctx.input 是一个数组，因为都是单个文件上传，所以取数组中第一个数据就行
    // imgPath 可能是本地文件路径，也可能是网络图片地址
    let [imgPath] = ctx.input;

    // URL 场景：用 PicGo 官方 getURLFile 下载 → 判定格式 → 转换/直通 → 备份到配置目录
    if (isHttpUrl(imgPath)) {
      const res = await PicGoUtils.getURLFile(imgPath, ctx);
      if (!res.success || !res.buffer) {
        throw new Error('图片下载失败: ' + (res.reason || imgPath));
      }
      const buf = Buffer.from(res.buffer);
      // 用 sharp 读取真实格式（比 URL 扩展名可靠，顺带校验内容确是图片）
      const format = (await sharp(buf).metadata()).format;
      const isWebp = format === 'webp';

      // 备份目录：取配置项，缺省为 PicGo 数据目录下的 convert-to-webp
      const cfg = ctx.getConfig<{ backupDir?: string }>(PLUGIN_NAME);
      const backupDir = (cfg && cfg.backupDir) || path.join(ctx.baseDir, 'convert-to-webp');
      await fs.mkdir(backupDir, { recursive: true });

      const webpPath = path.join(backupDir, urlBaseName(imgPath) + '.webp');
      // 已是 webp 直接落盘直通，否则 sharp 重编码
      const webpBuffer = isWebp ? buf : await sharp(buf).webp().toBuffer();
      await fs.writeFile(webpPath, webpBuffer);

      ctx.input = [webpPath];
      return ctx;
    }

    // 以下保持原有本地文件逻辑完全不变
    // imgPath 得到的就是文件的本地路径
    let imgExt = path.extname(imgPath);
    //如果上传的就是 webp 格式的文件直接返回
    if (imgExt === '.webp') {
      return ctx;
    }
    //将文件转为 webp 格式的流
    let imgBuffer = await sharp(imgPath)
      .webp()
      .toBuffer();

    //得到 webp 文件的本地路径
    const webpPath = path.join(path.dirname(imgPath), path.basename(imgPath, imgExt) + '.webp');
    //将 webp 文件写入本地，我是想要在本地保留 webp 文件的备份
    // 如果不需要，也可以在 afterUploadPlugins 事件中将本地文件删除
    await fs.writeFile(webpPath, imgBuffer);

    //将新的 webp 地址包装为数组返回给  ctx 的 input 对象
    ctx.input = [webpPath]

    return ctx;
  };

  const register = () => {
    //注意：此处需要使用 beforeTransformPlugins 事件
    ctx.helper.beforeTransformPlugins.register(PLUGIN_NAME, {
      handle
    });
  }

  // 注册配置项：URL 图片转换后的 WebP 备份目录（在 PicGo 插件设置中显示）
  const config = (): IPluginConfig[] => [
    {
      name: 'backupDir',
      type: 'input',
      default: path.join(ctx.baseDir, 'convert-to-webp'),
      required: false,
      message: 'URL 图片转换后的 WebP 备份目录（本地图片仍保存在原目录）',
      alias: '备份目录'
    }
  ];

  return {
    register,
    config
  }
}
