# Just Vertical Tabs Resize

Drag the inner edge of your vertical tab bar to resize it and keep the width between sessions.

[简体中文](README.zh-CN.md)

## Requirements

- Obsidian desktop 1.13.0 or newer.
- [Just Vertical Tabs](https://github.com/Narwhai/just-vertical-tabs) installed and enabled. Compatibility has been checked with version 1.3.0.

This is an independently maintained companion to Just Vertical Tabs. The tab bar is supplied by Just Vertical Tabs, and this companion adds its resize handle. It relies on that plugin's DOM classes and `--jvt-tab-width` CSS variable. Future changes to those may require an update here.

## Features

- Drag the edge facing the editor to resize the tab bar from 100 to 600 CSS pixels.
- Start at 240px and save the chosen width in this plugin's `data.json`.
- Double-click the edge to reset to 240px.
- Support left and right placement and multiple tab groups in the main window. All groups share one width.
- Hide the handle while the tab bar is collapsed.
- Focus the handle with Tab, use Left or Right to move it by 10px, or press Home to reset.
- Run **Just Vertical Tabs Resize: Reset tab bar width to 240px** from the command palette.

The plugin operates in the main desktop window. Separate pop-out windows are outside the supported scope.

## Install

This project is distributed through GitHub Releases. Community-directory listing has not been submitted.

### Manual installation

1. Install and enable **Just Vertical Tabs** in Obsidian's community plugins.
2. Download `jvt-resizable-tabs-1.0.0.zip` from the [latest release](https://github.com/caichen2333/obsidian-just-vertical-tabs-resize/releases/latest).
3. Extract the `jvt-resizable-tabs` folder into your vault's `.obsidian/plugins/` directory. It should contain `main.js`, `manifest.json`, and `styles.css` directly inside that folder.
4. Open **Settings → Community plugins**, click the reload plugins button or restart Obsidian, and enable **Just Vertical Tabs Resize**.

For future versions, use the ZIP attached to that release. You can also download the three individual release assets and place them in `.obsidian/plugins/jvt-resizable-tabs/`.

### BRAT installation

With [BRAT](https://github.com/TfTHacker/obsidian42-brat) installed, add the following GitHub repository through its **Add beta plugin** action:

```text
caichen2333/obsidian-just-vertical-tabs-resize
```

### Updating and removing

Disable this companion before replacing its three release files. Keep `data.json` to retain your width, then enable the companion again.

Updating Just Vertical Tabs leaves this companion's files and settings in their own directory. If an update changes the resize integration, report the two plugin versions and your Obsidian version in an issue.

To remove the resize behavior, disable or uninstall **Just Vertical Tabs Resize** in community plugin settings. The tab bar then uses the width supplied by Just Vertical Tabs, your theme, or any enabled CSS snippet.

## Privacy

The plugin reads and writes its saved width and adjusts the main window's tab-bar elements. It makes no network requests and does not read note contents. Release archives contain only the three runtime plugin files.

## Development

Use Node.js 22 or newer.

```sh
npm ci
npm run dev
```

The source is `src/main.ts`. `npm run dev` watches it and writes `main.js` at the repository root. Copy `main.js`, `manifest.json`, and `styles.css` into a development vault's `.obsidian/plugins/jvt-resizable-tabs/`, then reload the plugin. The file `data.json` is local user configuration and is excluded from version control.

```sh
npm run check
npm run package
```

`check` runs Obsidian's recommended ESLint rules, TypeScript checking, production bundling, and DOM-based regression tests. `package` also creates the three release files, an installable ZIP, and SHA-256 checksums under `dist/`.

Tests cover left and right dragging, pointer cancellation and capture loss, width limits, persisted settings, collapsed tabs, split-group changes, keyboard controls, and unload cleanup. Native pointer dragging and persistence were also checked in Obsidian desktop 1.15.1 with Just Vertical Tabs 1.3.0 on macOS. Windows and Linux have not been tested manually.

## Releases

Run `npm version patch`, `minor`, or `major` to update `package.json`, `manifest.json`, and `versions.json` together and create a version tag such as `1.0.1`. Tags must match the manifest version exactly, without a `v` prefix.

```sh
git push origin main
git push origin 1.0.1
```

The release workflow runs the same checks and attaches `main.js`, `manifest.json`, `styles.css`, the installable ZIP, and `SHA256SUMS` to a GitHub release. Repository publication and releases are ready for manual or BRAT installation. Community-directory submission is a separate step through the [Obsidian Community directory](https://docs.obsidian.md/Plugins/Releasing/Submit%20your%20plugin).

## License and credits

MIT License. Copyright 2026 caichen2333.

Thanks to Roman Soriano / Narwhai for [Just Vertical Tabs](https://github.com/Narwhai/just-vertical-tabs). That plugin remains a separate dependency with its own license.
