// เรือนไทย 4 ภาค — service worker
// เพิ่มเลขเวอร์ชันทุกครั้งที่แก้ไฟล์ในแอป เพื่อให้เครื่องดึงไฟล์ใหม่
const VERSION = 'rt-v13';
const CACHE = VERSION;
const BASE = self.registration ? self.registration.scope : new URL('./', self.location).href;
const CORE = [
  '',
  'index.html',
  'manifest.webmanifest',
  'vendor/three/three.min.js',
  'vendor/three/OrbitControls.js',
  'vendor/fonts/sarabun-thai-400-normal.woff2',
  'vendor/fonts/sarabun-latin-400-normal.woff2',
  'vendor/fonts/sarabun-thai-600-normal.woff2',
  'vendor/fonts/sarabun-latin-600-normal.woff2',
  'vendor/fonts/mitr-thai-400-normal.woff2',
  'vendor/fonts/mitr-latin-400-normal.woff2',
  'vendor/fonts/mitr-thai-500-normal.woff2',
  'vendor/fonts/mitr-latin-500-normal.woff2',
  'vendor/fonts/mitr-thai-600-normal.woff2',
  'vendor/fonts/mitr-latin-600-normal.woff2',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE.map(p => new URL(p, BASE).href))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Google Fonts (ภาษาจีน) — ใช้ของที่เคยโหลดได้ก่อน แล้วอัปเดตเบื้องหลัง
  if (url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com') {
    e.respondWith(
      caches.open(CACHE).then(async c => {
        const hit = await c.match(req);
        const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => hit);
        return hit || net;
      })
    );
    return;
  }

  if (url.origin !== self.location.origin || !url.href.startsWith(BASE)) return;

  // หน้าหลัก: ตอบจาก cache ก่อน ถ้าไม่มีค่อยไปดึง
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      if (hit) return hit;
      return fetch(req).then(r => {
        if (r.ok) caches.open(CACHE).then(c => c.put(req, r.clone()));
        return r;
      }).catch(() => caches.match(new URL('index.html', BASE).href));
    })
  );
});
