// Service worker minimal pour NUNI.
// Ne met rien en cache pour l'instant (évite les soucis de contenu périmé en dev).
// Peut être enrichi plus tard pour un vrai fonctionnement hors-ligne.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
});

// ---------- Notifications push réelles ----------
// Reçoit le vrai contenu envoyé par le serveur NUNI (titre, texte, lien) et affiche une vraie
// notification système — pas de contenu inventé ici, tout vient du payload envoyé par le
// serveur (voir sendPushToUser dans server.js).
self.addEventListener('push', (event) => {
  let data = { title: 'NUNI', body: 'Vous avez une nouvelle notification.', url: '/' };
  try { if (event.data) data = Object.assign(data, event.data.json()); } catch (e) { /* payload non-JSON, on garde les valeurs par défaut */ }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: 'assets/icons/icon-192.png',
      badge: 'assets/icons/icon-96.png',
      data: { url: data.url || '/' },
    })
  );
});

// Tap sur la notification : ramène sur un onglet NUNI déjà ouvert s'il y en a un, sinon en
// ouvre un nouveau — jamais une simple fermeture silencieuse sans action.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ne jamais intercepter les requêtes vers un autre domaine (Cloudinary, l'API backend...).
  // Avant : fetch(event.request) repassait TOUTE requête (même cross-origin) par ce service
  // worker, y compris les uploads volumineux en multipart/form-data vers Cloudinary — repasser
  // un tel corps de requête à travers le SW peut casser le flux et provoquait les erreurs
  // "Failed to fetch" / net::ERR_FAILED observées sur les envois de sons/clips.
  if (url.origin !== self.location.origin) {
    return; // laisse le navigateur gérer nativement, sans passer par ce SW
  }

  // Fichiers critiques (JS/CSS/HTML) : toujours revérifiés sur le réseau, jamais servis
  // depuis le cache HTTP normal du navigateur — évite d'avoir à vider le cache manuellement
  // après chaque déploiement pour voir la dernière version d'app.js.
  const isCriticalAsset = /\.(js|css|html)$/.test(url.pathname) || url.pathname === '/' || url.pathname.endsWith('/');
  if (isCriticalAsset) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).catch(() => fetch(event.request))
    );
    return;
  }

  // Pass-through pour tout le reste (images, polices...) : laisse le réseau gérer.
  event.respondWith(fetch(event.request));
});
