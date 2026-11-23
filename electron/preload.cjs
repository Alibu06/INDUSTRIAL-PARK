"use strict";
const {contextBridge,ipcRenderer}=require("electron");
contextBridge.exposeInMainWorld("IPBridge",Object.freeze({
 save:(data)=>ipcRenderer.invoke("industrial-save",data),
 load:()=>ipcRenderer.invoke("industrial-load")
}));
