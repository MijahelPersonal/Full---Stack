const {test}=require('node:test');
const assert=require('node:assert/strict');
const {EventEmitter}=require('node:events');
const {createUpdater}=require('./updater.cjs');
function setup(enabled=true){
 const updater=new EventEmitter(),handlers=new Map();let checks=0,downloads=0,installs=0;
 updater.checkForUpdates=async()=>{checks++;updater.emit('update-available',{version:'0.2.0'});};
 updater.downloadUpdate=async()=>{downloads++;updater.emit('download-progress',{percent:50.2});updater.emit('update-downloaded',{version:'0.2.0'});};
 updater.quitAndInstall=()=>installs++;
 const sent=[];const controller=createUpdater({app:{getVersion:()=> '0.1.0'},ipcMain:{handle:(k,v)=>handlers.set(k,v)},updater,trusted:e=>e.allowed,send:s=>sent.push(s),enabled});
 const invoke=(name,...args)=>handlers.get('gestion:update:'+name)({allowed:true},...args);
 return {updater,controller,handlers,invoke,sent,counts:()=>({checks,downloads,installs})};
}
test('desarrollo no consulta, descarga ni instala',async()=>{const s=setup(false);await s.invoke('check');await s.invoke('download');assert.throws(()=>s.invoke('install'));assert.deepEqual(s.counts(),{checks:0,downloads:0,installs:0});assert.equal(s.controller.getState().status,'disabled');});
test('flujo manual, versión real, porcentaje y reinicio explícito',async()=>{const s=setup();assert.equal(s.updater.autoDownload,false);assert.equal(s.updater.autoInstallOnAppQuit,false);await s.invoke('check');assert.equal(s.controller.getState().status,'available');assert.equal(s.counts().downloads,0);await s.invoke('download');assert.equal(s.controller.getState().status,'ready');assert.equal(s.counts().installs,0);assert(s.sent.some(x=>x.percent===50));s.invoke('install');await new Promise(setImmediate);assert.equal(s.counts().installs,1);assert.equal(s.controller.getState().version,'0.1.0');});
test('rechaza remitentes y argumentos no permitidos',()=>{const s=setup();for(const handler of s.handlers.values()){assert.throws(()=>handler({allowed:false}));assert.throws(()=>handler({allowed:true},'https://otro.example'));}assert.throws(()=>s.invoke('install'));});
test('error recuperable y no filtra detalles internos',async()=>{const s=setup();s.updater.checkForUpdates=async()=>{throw Error('secreto/ruta');};await s.invoke('check');assert.deepEqual(s.controller.getState(),{status:'error',version:'0.1.0'});});
test('evita comprobaciones y descargas simultáneas',async()=>{const s=setup();let release;s.updater.checkForUpdates=()=>new Promise(r=>release=r);const first=s.invoke('check');await s.invoke('check');assert.equal(s.controller.getState().status,'checking');release();await first;});
