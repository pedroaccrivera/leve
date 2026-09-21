#!/bin/bash
# Fix-leve — 1-click quarantine fix for leve on macOS (Gatekeeper).
# Usage: double-click this file inside the leve installer window.
APP="/Applications/leve.app"

if [ ! -d "$APP" ]; then
  osascript -e 'display alert "leve not found" message "Drag leve to the Applications folder first, then run this Fix again." as critical'
  exit 1
fi

if xattr -d com.apple.quarantine "$APP" 2>/dev/null; then
  osascript -e 'display alert "leve is ready ✓" message "Open leve normally. Enjoy!"'
else
  osascript -e 'display alert "Could not fix automatically" message "Open Terminal and paste: xattr -d com.apple.quarantine /Applications/leve.app" as critical'
  exit 1
fi
