const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Файловые операции
  selectFile: () => ipcRenderer.invoke('select-file'),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
  deleteFilesInDirectory: (params) => ipcRenderer.invoke('delete-files-in-directory', params),
  
  // Операции с хранилищем
  getOperations: () => ipcRenderer.invoke('get-operations'),
  saveOperations: (operations) => ipcRenderer.invoke('save-operations', operations),
  getLogs: (operationId) => ipcRenderer.invoke('get-logs', operationId),
  saveLogs: (params) => ipcRenderer.invoke('save-logs', params)
}); 