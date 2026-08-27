# leve

> **leve** is a 100% local, offline, and privacy-focused desktop application to batch resize and compress images on macOS and Windows.

No images or data ever leave your machine. Built with **Electron**, **React**, **Vite**, **Tailwind CSS**, and **Sharp (libvips)**.

---

## Key Features

- **100% Offline & Private**: Zero cloud, zero network requests, zero telemetry.
- **Proportional Resizing**: Set your desired target width in pixels; height scales automatically while preserving the original aspect ratio.
- **Custom & Built-in Presets**:
  - Preloaded with common web/HD resolutions (800px, 1280px, 1920px, 2560px, 3840px).
  - Create and save your own named presets directly from the interface.
- **Human-Friendly Compression Presets**:
  - **Balanced (Recommended)**: Best quality-to-size ratio.
  - **Maximum Quality**: Light compression for high-detail photography.
  - **Smallest File Size**: Aggressive optimization for web, email, and chat uploads.
  - **Lossless**: Zero compression artifacts (for PNGs and WebP).
- **Privacy Metadata Control**:
  - Optional toggle to strip EXIF, camera model, and GPS location data for enhanced privacy and smaller file size.
- **Flexible Output Destinations**:
  - *Subfolder*: Automatically creates a dedicated folder (e.g. `resized/`) inside each source image directory.
  - *Suffix*: Saves right next to the original file (e.g. `photo-resized.jpg`).
  - *Custom Folder*: Chooses a specific output directory via native system dialog.
- **Supported Formats**: JPG/JPEG, PNG, WebP, AVIF, TIFF, GIF, SVG.

---

## How to Run in Development

```bash
npm install
npm run dev
```

---

## How to Build & Package

### For macOS (.dmg / .app)
```bash
npm run package:mac
```

### For Windows (.exe installer / portable)
```bash
npm run package:win
```

The compiled binaries will be output to the `release/` folder.
