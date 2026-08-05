const CACHE_PREFIX =
  'studentpr-mobile-cache-';

const CACHE_NAME =
  `${CACHE_PREFIX}v1`;

const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/school-logo.png',
  './icons/favicon-32.png',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener(
  'install',
  event => {
    event.waitUntil(
      caches
        .open(CACHE_NAME)
        .then(cache => {
          return Promise.allSettled(
            APP_SHELL.map(url => {
              return cache.add(url);
            })
          );
        })
        .then(() => {
          return self.skipWaiting();
        })
    );
  }
);

self.addEventListener(
  'activate',
  event => {
    event.waitUntil(
      caches
        .keys()
        .then(cacheNames => {
          return Promise.all(
            cacheNames.map(cacheName => {
              const isOldStudentPrMobileCache =
                cacheName.startsWith(
                  CACHE_PREFIX
                ) &&
                cacheName !== CACHE_NAME;

              if(isOldStudentPrMobileCache){
                return caches.delete(
                  cacheName
                );
              }

              return Promise.resolve(
                false
              );
            })
          );
        })
        .then(() => {
          return self.clients.claim();
        })
    );
  }
);

self.addEventListener(
  'fetch',
  event => {
    const request =
      event.request;

    if(request.method !== 'GET'){
      return;
    }

    const requestUrl =
      new URL(request.url);

    if(
      requestUrl.hostname.includes(
        'supabase.co'
      )
    ){
      return;
    }

    if(request.mode === 'navigate'){
      event.respondWith(
        fetch(request)
          .then(response => {
            const clone =
              response.clone();

            caches
              .open(CACHE_NAME)
              .then(cache => {
                cache.put(
                  './index.html',
                  clone
                );
              });

            return response;
          })
          .catch(() => {
            return caches.match(
              './index.html'
            );
          })
      );

      return;
    }

    event.respondWith(
      caches
        .match(request)
        .then(cachedResponse => {
          if(cachedResponse){
            return cachedResponse;
          }

          return fetch(request)
            .then(response => {
              if(
                !response ||
                response.status !== 200
              ){
                return response;
              }

              const clone =
                response.clone();

              caches
                .open(CACHE_NAME)
                .then(cache => {
                  cache.put(
                    request,
                    clone
                  );
                });

              return response;
            });
        })
    );
  }
);
