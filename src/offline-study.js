// Static-study offline lifecycle; independent of learner draft/progress storage.
// No caching or intercepting execution, uploads, JDoodle, or the local Julia companion.
export function initOfflineStudy({doc=document,win=window}={}){
  const status=doc.getElementById("offline-status");
  const indicator=doc.getElementById("offline-indicator");
  const updateButton=doc.getElementById("offline-update");
  const installButton=doc.getElementById("offline-install");
  let ready=false,registration=null,requestedUpdate=false,deferredInstall=null;
  const online=()=>win.navigator.onLine;
  function paint(){
    indicator.hidden=online();
    if(!ready){
      status.textContent=online()?"Offline lessons not yet ready.":"Offline lessons unavailable on this device.";
      return;
    }
    status.textContent=online()?
      "Lessons and browser-based practice available offline on this device.":
      "Offline: cached lessons and practice available. External Julia services may be unavailable.";
  }
  if(!("serviceWorker" in win.navigator)||!win.isSecureContext){
    status.textContent="Offline installation requires a supported HTTPS or localhost browser.";
    indicator.hidden=online();
    return;
  }
  function waiting(){
    updateButton.hidden=!registration?.waiting;
  }
  function watch(worker){
    if(!worker)return;
    worker.addEventListener("statechange",()=>{
      if(worker.state==="redundant"&&!registration?.active){
        ready=false;status.textContent="Offline copy could not be installed. Check connection and storage.";
      }
      if(worker.state==="installed")waiting();
    });
  }
  win.addEventListener("online",paint);
  win.addEventListener("offline",paint);
  win.addEventListener("beforeinstallprompt",event=>{
    event.preventDefault();
    deferredInstall=event;
    installButton.hidden=false;
  });
  win.addEventListener("appinstalled",()=>{deferredInstall=null;installButton.hidden=true;});
  installButton.addEventListener("click",async()=>{
    if(!deferredInstall)return;
    const prompt=deferredInstall;
    deferredInstall=null;installButton.hidden=true;
    try{await prompt.prompt();}catch{status.textContent="App installation prompt unavailable.";}
  });
  updateButton.addEventListener("click",()=>{
    if(!registration?.waiting)return;
    requestedUpdate=true;
    registration.waiting.postMessage({type:"ACTIVATE_UPDATE"});
  });
  win.navigator.serviceWorker.addEventListener("controllerchange",()=>{
    if(requestedUpdate){requestedUpdate=false;win.location.reload();return;}
    if(ready)paint();
  });
  const start=async()=>{
    try{
      registration=await win.navigator.serviceWorker.register(
        new URL("../sw.js",import.meta.url),{scope:"./",type:"module"});
      waiting();
      watch(registration.installing);
      registration.addEventListener("updatefound",()=>{watch(registration.installing);waiting();});
      // ready resolves only for an activated, fully precached shell.
      await win.navigator.serviceWorker.ready;
      ready=true;paint();waiting();
    }catch(error){
      status.textContent="Offline installation unavailable. Check HTTPS, device storage and browser settings.";
    }
  };
  status.textContent="Preparing offline lessons…";
  void start();
}
