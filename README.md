# TwoToTango

A tiny menu-bar / system-tray app for macOS and Windows. At a set interval your own video (a character on a
white background, or anything) pops up in the corner of your screen on a taped paper note, with two choices:
**I drank** or **or later** (snooze 15 min by default).

- White background removed live (or show the video as-is)
- Any video format: uploads are converted to a small 1:1 H.264 clip (bundled ffmpeg)
- Pick the corner, drag to place, size, interval, snooze, active hours, sound
- Check for updates from the menu (reads GitHub Releases)
- No account, no network except the optional update check; settings stay on your machine

## Run

```bash
npm install
npm start
```

## Your own presets

Put 1:1 `.mp4` files in `assets/presets/`. File names become the preset names in the menu
(`Video > Presets`). Convert any clip with:

```bash
npx ffmpeg-static   # prints the bundled ffmpeg path
ffmpeg -i in.mov -vf "crop='min(iw,ih)':'min(iw,ih)',scale=720:720,format=yuv420p" -c:v libx264 -crf 17 out.mp4
```

## Build installers

```bash
npm run build:mac   # on a Mac  -> dist/*.dmg
npm run build:win   # on Windows -> dist/*.exe
```

The macOS build is ad-hoc signed, not notarized: right-click the app and choose **Open** the first time.

## Updates

Set `repository` in `package.json` to your GitHub repo, publish a Release with a tag like `v1.1.0`, and
**Check for updates…** in the menu will tell users when a newer version exists.

## Regenerating art

`gen-icons.js` (tray + app icon from `assets/*.svg`), `gen-paper.js` and `gen-title.js` (cut-outs). Run with
`npx electron <script>`.

## License

MIT, see [LICENSE](LICENSE). Bundled artwork and any media you add keep their own authors' rights.
