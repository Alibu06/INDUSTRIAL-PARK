"use strict";
const {app,BrowserWindow,ipcMain,session}=require("electron");
const path=require("node:path");
const fs=require("node:fs/promises");
const savePath=()=>path.join(app.getPath("userData"),"industrial-park-v1.json");
async function createWindow(){
 const win=new BrowserWindow({width:1540,height:960,minWidth:920,minHeight:640,show:false,
 backgroundColor:"#e4eeeb",title:"INDUSTRIAL PARK",autoHideMenuBar:true,
 webPreferences:{preload:path.join(__dirname,"preload.cjs"),contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true}});
 win.setMenuBarVisibility(false);
 win.webContents.setWindowOpenHandler(()=>({action:"deny"}));
 win.webContents.on("will-navigate",(event,url)=>{if(!url.startsWith("file://"))event.preventDefault();});
 await win.loadFile(path.join(__dirname,"..","index.html"));
 win.once("ready-to-show",()=>win.show());
}
app.whenReady().then(()=>{
 session.defaultSession.webRequest.onBeforeRequest((details,callback)=>{
 const url=details.url;callback({cancel:!url.startsWith("file://")&&!url.startsWith("devtools://")});
 });
 ipcMain.handle("industrial-save",async(_event,raw)=>{
 if(typeof raw!=="string"||raw.length>15000000)throw Error("Ungültiger Spielstand");
 const data=JSON.parse(raw);if(data.version!==1||!Array.isArray(data.buildings))throw Error("Ungültiges Format");
 await fs.mkdir(app.getPath("userData"),{recursive:true});
 const dst=savePath(),tmp=dst+".tmp";await fs.writeFile(tmp,raw,"utf-8");await fs.rename(tmp,dst);return true;
 });
 ipcMain.handle("industrial-load",async()=>{
 try{return await fs.readFile(savePath(),"utf-8");}catch(e){if(e.code==="ENOENT")return null;throw e;}
 });
 createWindow();
 app.on("activate",()=>{if(BrowserWindow.getAllWindows().length===0)createWindow();});
});
app.on("window-all-closed",()=>{if(process.platform!=="darwin")app.quit();});
