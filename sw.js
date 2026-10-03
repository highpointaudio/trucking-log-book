const CACHE='trucklog-v7';
const ASSETS=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  let isPage=false;
  try{
    const url=new URL(e.request.url);
    isPage=e.request.mode==='navigate'||url.pathname.endsWith('index.html')||
      url.pathname.endsWith('/trucking-log-book/')||url.pathname.endsWith('/trucking-log-book');
  }catch(err){ isPage=e.request.mode==='navigate'; }
  if(isPage){
    // Network first: a reload always shows the newest app when online; cached copy when offline.
    e.respondWith(
      fetch(e.request).then(res=>{
        const copy=res.clone();
        caches.open(CACHE).then(c=>c.put(e.request,copy));
        return res;
      }).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html')).then(r=>r||caches.match('./')))
    );
  }else{
    e.respondWith(
      caches.match(e.request).then(hit=>hit||fetch(e.request).then(res=>{
        const copy=res.clone();
        caches.open(CACHE).then(c=>c.put(e.request,copy));
        return res;
      }).catch(()=>caches.match('./index.html')))
    );
  }
});
