const CACHE_NAME = 'survivor-game-v0.1.1';
const urlsToCache = [
  '/survivor-game/',
  '/survivor-game/index.html',
  '/survivor-game/manifest.json',
  '/survivor-game/src/main.js',
  '/survivor-game/src/core/GameApp.js',
  '/survivor-game/src/core/Game.js',
  '/survivor-game/src/core/EntityManager.js',
  '/survivor-game/src/core/ObjectPool.js',
  '/survivor-game/src/core/components.js',
  '/survivor-game/src/entities/Player.js',
  '/survivor-game/src/entities/Enemy.js',
  '/survivor-game/src/entities/Bullet.js',
  '/survivor-game/src/entities/ExperienceOrb.js',
  '/survivor-game/src/entities/AreaHitbox.js',
  '/survivor-game/src/systems/WeaponSystem.js',
  '/survivor-game/src/systems/LifetimeSystem.js',
  '/survivor-game/src/systems/PlayerInputSystem.js',
  '/survivor-game/src/systems/EnemyAISystem.js',
  '/survivor-game/src/systems/MovementSystem.js',
  '/survivor-game/src/systems/CollisionSystem.js',
  '/survivor-game/src/systems/RenderSystem.js',
  '/survivor-game/src/systems/UpgradeSystem.js',
  '/survivor-game/src/systems/EnemySpawnerSystem.js',
  '/survivor-game/src/utils/collision.js',
  '/survivor-game/src/utils/SpatialHashGrid.js',
  '/survivor-game/src/data/weaponTypes.js',
  '/survivor-game/src/data/enemyTypes.js',
  '/survivor-game/src/data/upgradeTypes.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pixi.js/8.0.0/pixi.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/nipplejs/0.10.1/nipplejs.min.js'
];

// Install event - cache all resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Fetch event - serve from cache if available, otherwise fetch from network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Message event - handle update notifications
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});