#!/bin/bash
# Fix-leve — 1-clique para liberar o leve no macOS (Gatekeeper/quarentena).
# Uso: duplo clique neste arquivo dentro do DMG do leve.
APP="/Applications/leve.app"

if [ ! -d "$APP" ]; then
  osascript -e 'display alert "leve não encontrado" message "Arraste o leve para a pasta Applications primeiro e rode este Fix de novo." as critical'
  exit 1
fi

if xattr -d com.apple.quarantine "$APP" 2>/dev/null; then
  osascript -e 'display alert "leve liberado ✓" message "Abra o leve normalmente. Bom uso!"'
else
  osascript -e 'display alert "Não consegui liberar" message "Abra o Terminal e cole: xattr -d com.apple.quarantine /Applications/leve.app" as critical'
  exit 1
fi
