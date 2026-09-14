const { contextBridge, ipcRenderer, webUtils } = require('electron');

const api = {
  selectFiles: () => ipcRenderer.invoke('dialog:selectFiles'),
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
  selectDestinationFolder: () => ipcRenderer.invoke('dialog:selectDestinationFolder'),
  scanDroppedPaths: (paths) => ipcRenderer.invoke('app:scanDroppedPaths', paths),
  getImageMetadata: (filePath) => ipcRenderer.invoke('image:getMetadata', filePath),
  processImage: (item, config) => ipcRenderer.invoke('image:process', item, config),
  openInFolder: (path) => ipcRenderer.invoke('app:openInFolder', path),
  getImageThumbnail: (filePath) => ipcRenderer.invoke('image:getThumbnail', filePath),
  getPathForFile: (file) => {
    try {
      return webUtils.getPathForFile(file);
    } catch {
      return file ? (file.path || '') : '';
    }
  },
  // Video compression for web
  selectVideoFiles: () => ipcRenderer.invoke('dialog:selectVideoFiles'),
  selectVideoFolder: () => ipcRenderer.invoke('dialog:selectVideoFolder'),
  scanDroppedVideoPaths: (paths) => ipcRenderer.invoke('app:scanDroppedVideoPaths', paths),
  getVideoThumbnail: (filePath) => ipcRenderer.invoke('video:getThumbnail', filePath),
  processVideo: (item, config) => ipcRenderer.invoke('video:process', item, config),
  onVideoProgress: (callback) => {
    const listener = (_event, id, progress) => callback(id, progress);
    ipcRenderer.on('video:progress', listener);
    return () => ipcRenderer.removeListener('video:progress', listener);
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);
