import { contextBridge, ipcRenderer } from 'electron';

const apiBaseArg = process.argv.find((arg) => arg.startsWith('--api-base='));
const apiBase = apiBaseArg ? apiBaseArg.slice('--api-base='.length) : '';

if (apiBase) {
  contextBridge.exposeInMainWorld('__API_BASE__', apiBase);
}

contextBridge.exposeInMainWorld('electron', {
  apiBase,
  ipcRenderer: {
    send: (channel, data) => {
      if (['toMain'].includes(channel)) ipcRenderer.send(channel, data);
    },
    on: (channel, func) => {
      if (['fromMain'].includes(channel)) {
        ipcRenderer.on(channel, (_event, ...args) => func(...args));
      }
    },
    invoke: (channel, data) => {
      if (['ping', 'get-version'].includes(channel)) return ipcRenderer.invoke(channel, data);
      return undefined;
    }
  }
});
