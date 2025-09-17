import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('rainvibe', {
  version: '0.1.0',
});

