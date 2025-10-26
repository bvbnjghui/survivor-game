const CACHE_NAME = 'survivor-game-v0.1.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/main.js',
  '/src/core/GameApp.js',
  '/src/core/Game.js',
  '/src/core/EntityManager.js',
  '/src/core/ObjectPool.js',
  '/src/core/components.js',
  '/src/entities/Player.js',
  '/src/entities/Enemy.js',
  '/src/entities/Bullet.js',
  '/src/entities/ExperienceOrb.js',
  '/src/entities/AreaHitbox.js',
  '/src/systems/WeaponSystem.js',
  '/src/systems/LifetimeSystem.js',
  '/src/systems/PlayerInputSystem.js',
  '/src/systems/EnemyAISystem.js',
  '/src/systems/MovementSystem.js',
  '/src/systems/CollisionSystem.js',
  '/src/systems/RenderSystem.js',
  '/src/systems/UpgradeSystem.js',
  '/src/systems/EnemySpawnerSystem.js',
  '/src/utils/collision.js',
  '/src/utils/SpatialHashGrid.js',
  '/src/data/weaponTypes.js',
  '/src/data/enemyTypes.js',
  '/src/data/upgradeTypes.js',
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