README — if macOS blocks leve
================================

leve is not Apple-signed yet, so macOS may say the app "is damaged" on first
launch. The app is 100% local and safe. Pick ONE option:

OPTION 1 — 1-click fix (recommended)
1. In this same installer window, double-click "Fix-leve".
2. If macOS asks, confirm via: right-click "Fix-leve" > Open > Open.
3. Wait for the success message, then open leve normally.

OPTION 2 — via Terminal
1. Drag leve to the Applications folder (if you haven't yet).
2. Open Terminal and paste:
     xattr -d com.apple.quarantine /Applications/leve.app
3. Open leve normally.

Questions: https://github.com/pedroaccrivera/leve
