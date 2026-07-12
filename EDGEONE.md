# EdgeOne Maker 上传约定

这个目录的根站点是 `itsyouke.com/`，每个通过 EdgeOne Maker 生成的网页都应放在一个独立的一级目录下。

## 推荐路径

- `E:\codex\ItsYouke\sjzpoker\` -> `https://itsyouke.com/sjzpoker/`
- `E:\codex\ItsYouke\site1\` -> `https://itsyouke.com/site1/`
- `E:\codex\ItsYouke\palbreed\` -> `https://itsyouke.com/palbreed/`
- `E:\codex\ItsYouke\site3\` -> `https://itsyouke.com/site3/`

## 上传一个新页面

1. 先确定访问路径，例如 `https://itsyouke.com/site4/`。
2. 在 `E:\codex\ItsYouke` 下创建同名目录，例如 `site4`。
3. 将 EdgeOne Maker 导出的所有静态文件放入该目录。
4. 确认该目录里有入口文件 `index.html`。
5. 如果页面引用 CSS、JS、图片，优先使用相对路径，例如 `./style.css`、`./assets/logo.png`。
6. 在 `projects.json` 中添加入口。
7. 在 `sitemap.xml` 中添加对应 URL。

## projects.json 示例

```json
{
  "title": "页面标题",
  "description": "一句话说明这个页面。",
  "href": "site4/",
  "date": "2026-07-05"
}
```

`href` 使用相对路径，不要写成 `https://itsyouke.com/site4/`。这样本地预览、正式域名和以后迁移目录时都更稳。

## 不要覆盖这些根目录文件

- `index.html`
- `styles.css`
- `app.js`
- `projects.json`
- `404.html`
- `robots.txt`
- `sitemap.xml`
- `README.md`
- `EDGEONE.md`

EdgeOne Maker 生成的新页面文件应该放进自己的子目录，不要直接散放在根目录。

## 本地检查

在上传前确认：

- 根站 `itsyouke.com/` 仍然是导航页。
- 新页面可以通过 `itsyouke.com/目录名/` 打开。
- 新页面内部的 CSS、JS、图片都能加载。
- 首页作品入口能跳转到新页面。
