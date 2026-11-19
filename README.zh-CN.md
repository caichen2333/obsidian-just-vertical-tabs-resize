# Just Vertical Tabs Resize

为 Just Vertical Tabs 增加边缘拖动调宽功能，并保存每次调整后的宽度。

[English](README.md)

## 使用条件

- Obsidian 桌面版 1.13.0 及以上。
- 已安装并启用 [Just Vertical Tabs](https://github.com/Narwhai/just-vertical-tabs)。已核对兼容的版本为 1.3.0。

本项目是独立维护的配套插件，使用 Just Vertical Tabs 的页面结构和 `--jvt-tab-width` CSS 变量。未来上游调整这些结构时，本插件可能需要适配。

## 操作

- 默认展开宽度为 **240px**，拖动靠近正文的一侧边缘即可调整，范围为 **100–600px**。
- 松开鼠标后自动保存，下次打开沿用已保存的宽度。
- 双击边缘恢复 **240px**。
- 支持标签栏位于左侧或右侧，以及主窗口内的多个标签组。所有标签组共用一个宽度。
- 标签栏折叠时隐藏调宽边缘。
- 用 Tab 聚焦边缘后，按左右方向键每次移动 10px，按 Home 恢复默认宽度。
- 命令面板中提供 **Just Vertical Tabs Resize: Reset tab bar width to 240px**。

功能作用于桌面主窗口，独立弹出窗口未纳入支持范围。

## 安装

项目已提交并发布至 [Obsidian 社区目录](https://community.obsidian.md/plugins/jvt-resizable-tabs)。目录页面显示当前自动检查状态，满足审核要求后开放目录安装。GitHub Releases 同时提供安装包。

### 社区目录安装

1. 安装并启用 **Just Vertical Tabs**。
2. 打开 **设置 → 第三方插件 → 浏览**，搜索 **Just Vertical Tabs Resize**。
3. 点击 **安装 → 启用**。也可以在目录页面的安装按钮可用时，点击 **Add to Obsidian**。

### 手动安装

1. 在 Obsidian 第三方插件中安装并启用 **Just Vertical Tabs**。
2. 从 [最新 Release](https://github.com/caichen2333/obsidian-just-vertical-tabs-resize/releases/latest) 下载对应版本的 `jvt-resizable-tabs-<版本号>.zip`。
3. 解压后，把 `jvt-resizable-tabs` 文件夹放入笔记库的 `.obsidian/plugins/`。该文件夹内直接包含 `main.js`、`manifest.json` 和 `styles.css`。
4. 打开 **设置 → 第三方插件**，点击重新加载插件按钮，或重启 Obsidian，然后启用 **Just Vertical Tabs Resize**。

也可以下载 Release 中单独提供的三个文件，放到 `.obsidian/plugins/jvt-resizable-tabs/`。

### 通过 BRAT 安装

安装 [BRAT](https://github.com/TfTHacker/obsidian42-brat) 后，使用 **Add beta plugin**，填写以下 GitHub 仓库。

```text
caichen2333/obsidian-just-vertical-tabs-resize
```

## 更新与卸载

更新本配套插件时，先将其停用，再覆盖三个发布文件，保留保存宽度的 `data.json`，然后重新启用。

Just Vertical Tabs 更新时，配套插件的文件和设置保存在独立目录中。如果上游更新导致拖动失效，请在 Issue 中提供 Obsidian 和两个插件的版本。

需要移除拖动功能时，在第三方插件中停用或卸载 **Just Vertical Tabs Resize**。标签栏恢复使用 Just Vertical Tabs、主题或已启用 CSS 片段给定的宽度。

## 隐私与许可

本插件读取并保存自己的宽度配置，调整主窗口中的标签栏元素，不发起网络请求，也不读取笔记正文。安装包只包含运行所需的三个插件文件。

项目采用 MIT 开源许可证。感谢 Roman Soriano / Narwhai 开发的 Just Vertical Tabs，该依赖独立分发并保留其自身许可。

开发、检查和自动发布方法见英文 README。已在 macOS 的 Obsidian 1.15.1 和 Just Vertical Tabs 1.3.0 中验证实际拖动、宽度保存和恢复。Windows 与 Linux 尚未进行人工验证。
