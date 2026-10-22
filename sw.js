import {OFFLINE_CACHE_NAME,OFFLINE_ASSETS,offlineAssetKey} from "./src/offline-assets.js";
const PREFIX="amp-julia-offline-";
const scope=self.registration.scope;
const entry=new URL("index.html",scope).href;
self.addEventListener("install",event=>{
  // addAll fails atomically: a partially downloaded release cannot become active.
  event.waitUntil((async()=>{
    const cache=await caches.open(OFFLINE_CACHE_NAME);
    await cache.addAll(OFFLINE_ASSETS.map(asset=>new URL(asset,scope).href));
  })());
});
self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    for(const name of await caches.keys()){
      if(name.startsWith(PREFIX)&&name!==OFFLINE_CACHE_NAME)await caches.delete(name);
    }
    await self.clients.claim();
  })());
});
self.addEventListener("message",event=>{
  // Only the app's owning page requests activation after explicitly selecting Update.
  if(event.data?.type==="ACTIVATE_UPDATE"&&event.source?.url){
    try{
      const page=new URL(event.source.url),base=new URL(scope);
      if(page.origin===base.origin&&page.pathname.startsWith(base.pathname))
        event.waitUntil(self.skipWaiting());
    }catch{}
  }
});
self.addEventListener("fetch",event=>{
  const req=event.request;
  if(req.method!=="GET")return;
  const key=offlineAssetKey(req.url,scope,req.mode==="navigate");
  if(!key)return; // All unknown URLs, POST /run and third-party services are never intercepted.
  if(req.mode==="navigate"){
    if(key!==entry)return;
    event.respondWith((async()=>{
      const cache=await caches.open(OFFLINE_CACHE_NAME);
      return (await cache.match(entry))||fetch(req);
    })());
    return;
  }
  event.respondWith((async()=>{
    const cache=await caches.open(OFFLINE_CACHE_NAME);
    return (await cache.match(key))||fetch(req);
  })());
});
