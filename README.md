# itsyouke.com

itsyouke.com 是一个个人静态网站，用于承载通过 EdgeOne Maker 上传的 vibe coding 网页。

## 路径目标

- `itsyouke.com/`：主页和导航页。
- `itsyouke.com/sjzpoker/`：石家庄扑克收集进度站点。
- `itsyouke.com/site1/`、`itsyouke.com/site2/`、`itsyouke.com/site3/`：后续静态站点可以继续按一级目录扩展。

## 目录约定

- `index.html`：网站首页和作品入口。
- `styles.css`：首页样式。
- `app.js`：读取作品清单并渲染入口。
- `projects.json`：作品清单。
- `sjzpoker/`：已整合的扑克收集进度静态站。
- `site1/`、`site2/`、`site3/`：预留给后续 EdgeOne Maker 页面。
- `404.html`：静态托管的兜底错误页。
- `robots.txt`、`sitemap.xml`：给搜索引擎使用的基础文件。
- 其他一级目录：存放通过 EdgeOne Maker 上传或导出的页面。

## 新增一个页面

1. 在根目录下创建一个新目录，例如 `site1/`。
2. 将 EdgeOne Maker 导出的页面文件放入该目录，入口文件保持为 `index.html`。
3. 在 `projects.json` 中添加一条记录：

```json
{
  "title": "页面标题",
  "description": "一句话描述这个页面。",
  "href": "site1/",
  "date": "2026-07-05"
}
```

这个项目不依赖构建工具，静态托管服务可以直接部署整个目录。

更完整的 EdgeOne Maker 上传流程见 `EDGEONE.md`。

## 部署根目录

把 `E:\codex\ItsYouke` 作为静态站根目录上传或绑定到 EdgeOne。部署后路径应保持为：

- `/`
- `/sjzpoker/`
- `/site1/`
- `/site2/`
- `/site3/`
