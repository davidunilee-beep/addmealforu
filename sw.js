const CACHE = 'meal-app-2f51389f327b';
const SHELL = ['./','./index.html','./manifest.webmanifest','./icons/app-192.png','./icons/app-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('meal-app-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request=event.request,url=new URL(request.url),root=new URL('./',self.registration.scope);
  if(request.method!=='GET'||url.origin!==root.origin)return;
  const isPage=request.mode==='navigate'&&(url.pathname===root.pathname||url.pathname===root.pathname+'index.html');
  const isAsset=['manifest.webmanifest','icons/app-192.png','icons/app-512.png'].some(path=>url.pathname===root.pathname+path);
  // Auth requests and third-party services are never cached.
  if(!isPage&&!isAsset)return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    try{
      const response=await fetch(request,{cache:'no-store'});
      if(response.ok&&!url.search){
        const key=isPage?new URL('index.html',root).href:request;
        await cache.put(key,response.clone()).catch(()=>{});
      }
      return response;
    }catch(error){
      const cached=await cache.match(isPage?new URL('index.html',root).href:request);
      if(cached)return cached;
      throw error;
    }
  })());
});
