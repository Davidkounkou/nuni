console.log('🎵 NUNI app.js chargé — version K4 (Vrai système de clips : publication, partage, vues uniques)');

/* ============ ÉCRAN DE CHARGEMENT (SPLASH) ============
   Séquence différente si en ligne ou hors ligne (comme demandé). Durée volontairement
   courte et fixe : elle sert à donner une impression de qualité et à masquer la
   préparation réelle de l'app, pas à attendre une vraie réponse serveur précise. */
let splashNoteTimer = null;
function spawnSplashNote(){
  const layer = document.getElementById('splash-notes');
  if(!layer) return;
  const notes = ['♪','♫','♩'];
  const n = document.createElement('span');
  n.className = 'splash-note';
  n.textContent = notes[Math.floor(Math.random()*notes.length)];
  n.style.setProperty('--nx', (Math.random()*70-35) + 'px');
  n.style.setProperty('--nr', (Math.random()*40-20) + 'deg');
  n.style.left = (35 + Math.random()*30) + '%';
  layer.appendChild(n);
  setTimeout(()=> n.remove(), 2700);
}
let sessionRestorePromise = null; // rempli plus bas, dès que restoreSession() démarre — lu par le splash ci-dessous
function runSplashSequence(){
  const el = document.getElementById('splash-screen');
  const status = document.getElementById('splash-status');
  const icon = document.getElementById('splash-status-icon');
  const bar = document.getElementById('splash-bar-fill');
  if(!el || !status || !bar) return;
  const online = navigator.onLine;
  const steps = online
    ? [ { t:'Connexion à NUNI…', p:30, ic:'🔗' }, { t:'Chargement de votre bibliothèque…', p:68, ic:'📚' }, { t:'Synchronisation…', p:96, ic:'🔄' } ]
    : [ { t:'Mode hors ligne', p:45, ic:'📡' }, { t:'Chargement de votre bibliothèque locale…', p:92, ic:'📚' } ];
  let i = 0;
  splashNoteTimer = setInterval(spawnSplashNote, 650);
  const advance = ()=>{
    if(i >= steps.length){
      bar.style.width = '100%';
      // Attend que la vérification de session (reconnexion automatique) soit terminée avant de révéler
      // quoi que ce soit derrière l'écran de chargement — évite le "flash" de l'écran d'accueil avant de
      // retrouver directement son compte. Plafonné à 1,2s supplémentaires max, pour ne jamais bloquer
      // l'utilisateur si le réseau est lent.
      const waitFor = sessionRestorePromise
        ? Promise.race([sessionRestorePromise, new Promise(r=> setTimeout(r, 1200))])
        : Promise.resolve();
      waitFor.then(()=>{
        setTimeout(()=>{
          el.classList.add('fade-out');
          clearInterval(splashNoteTimer);
          setTimeout(()=> el.remove(), 650);
        }, 260);
      });
      return;
    }
    status.style.opacity = 0;
    if(icon) icon.style.opacity = 0;
    setTimeout(()=>{
      status.textContent = steps[i].t;
      if(icon) icon.textContent = steps[i].ic;
      bar.style.width = steps[i].p + '%';
      status.style.opacity = 1;
      if(icon) icon.style.opacity = 1;
      i++;
      setTimeout(advance, 480);
    }, 180);
  };
  advance();
}
runSplashSequence();
window.addEventListener('offline', ()=> toast('Connexion perdue — mode hors ligne, contenu limité à ce qui est déjà chargé.'));
window.addEventListener('online', ()=> toast('Connexion rétablie 🕊️'));
/* ============ HELPERS ============ */
function ico(name){
  if(name==='check') return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M20 6 9 17l-5-5"/></svg>';
  return '';
}
// resolve the ${ico('check')} placeholders inserted as literal text (since this is plain HTML, not templated)
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.plan-card li, .badge-verified').forEach(el=>{
    el.innerHTML = el.innerHTML.replace(/\$\{ico\('check'\)\}/g, ico('check'));
  });
  // split wordmark letters so they can pulse to the rhythm when music plays
  document.querySelectorAll('.wordmark').forEach(el=>{
    const text = el.textContent;
    el.innerHTML = '';
    [...text].forEach((ch,i)=>{
      const span = document.createElement('span');
      span.className = 'beat-letter';
      span.style.setProperty('--i', i);
      span.textContent = ch;
      el.appendChild(span);
    });
  });
});

/* ============ THEME ============ */
let theme = 'dark';
function applyThemeIcon(){
  const isDark = theme === 'dark';
  document.querySelectorAll('#theme-icon-home, #theme-icon-app').forEach(svg=>{
    svg.innerHTML = isDark
      ? '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/>'
      : '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
  });
}
function toggleTheme(){
  theme = theme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  applyThemeIcon();
}
document.getElementById('theme-toggle-home').addEventListener('click', toggleTheme);
document.getElementById('theme-toggle-app').addEventListener('click', toggleTheme);
applyThemeIcon();

/* ============ ROTATING MESSAGES ============ */
const messages = [
  "Chaque écoute change une vie.",
  "Chaque artiste mérite son public.",
  "Votre abonnement construit l'avenir de notre musique.",
  "La culture se protège en la soutenant.",
  "Plus NUNI grandit, plus la valeur de chaque stream augmente."
];
let msgIndex = 0;
setInterval(()=>{
  msgIndex = (msgIndex+1) % messages.length;
  const el = document.getElementById('rotating-msg');
  el.style.opacity = 0;
  setTimeout(()=>{ el.textContent = messages[msgIndex]; el.style.opacity = 1; }, 400);
}, 3200);

/* ============ TOAST ============ */
let toastTimer;
function toast(text){
  const t = document.getElementById('toast');
  document.getElementById('toast-text').textContent = text;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> t.classList.remove('show'), 3200);
}

/* ============ NAVIGATION ============ */
function goTo(screen){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('app-shell').classList.remove('active');
  document.getElementById('player-bar').style.display = 'none';
  document.getElementById('mobile-tabbar').style.display = 'none';
  document.getElementById('demo-nav').classList.add('no-player');
  document.getElementById('mimi-widget').classList.add('no-player');
  if(screen==='home'){ document.getElementById('screen-home').classList.add('active'); }
  if(screen==='plans'){ document.getElementById('screen-plans').classList.add('active'); }
  window.scrollTo({top:0, behavior:'smooth'});
}

let pendingPlanType = null;

/* ============ SYSTÈME DE CODES PROMO (vraie vérification côté serveur) ============ */
const BASE_PRICE_TRIM = 650; // Pass Consommateur trimestriel
let appliedPromo = null;

async function applyPromoCode(){
  const input = document.getElementById('promo-input');
  const code = input.value.trim().toUpperCase();
  const feedback = document.getElementById('promo-feedback');
  feedback.className = '';
  feedback.innerHTML = '';

  if(!code){ feedback.className='error'; feedback.textContent='Entrez un code promotionnel.'; return; }

  feedback.textContent = 'Vérification en cours…';

  let data, ok;
  try{
    const res = await fetch(NUNI_API_BASE + '/api/promo/validate', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ code, plan: 'consumer' })
    });
    data = await res.json();
    ok = res.ok;
  }catch(e){
    feedback.className = 'error';
    feedback.textContent = 'Impossible de vérifier ce code — vérifiez votre connexion internet.';
    return;
  }

  if(!ok){
    feedback.className = 'error';
    feedback.textContent = data.error || 'Code promotionnel invalide ou expiré.';
    document.getElementById('promo-price-trim').textContent = '650 FCFA';
    appliedPromo = null;
    return;
  }

  appliedPromo = { code: data.code, pct: data.discount_pct };
  const discount = Math.round(BASE_PRICE_TRIM * data.discount_pct / 100);
  const newPrice = BASE_PRICE_TRIM - discount;
  document.getElementById('promo-price-trim').innerHTML = `<span class="old-price">650 FCFA</span> <span class="new-price">${newPrice.toLocaleString('fr-FR')} FCFA</span>`;

  feedback.className = 'success';
  feedback.innerHTML = `
    <span class="promo-badge">🎉 -${data.discount_pct}% appliqué</span>
    <div class="promo-breakdown">
      Prix initial : 650 FCFA<br>
      Réduction : -${data.discount_pct}%<br>
      Total : <b>${newPrice.toLocaleString('fr-FR')} FCFA</b> / trimestre
    </div>`;
  toast(`Code ${data.code} appliqué — ${data.discount_pct}% de réduction sur le trimestre.`);
}

/* ============ CONNEXION AU VRAI SERVEUR NUNI (Railway) ============ */
const NUNI_API_BASE = 'https://nuni-backend.onrender.com';
let realAuthToken = null;
let realUserId = null;
let currentUser = null; // infos complètes (prénom, nom...) de la personne connectée

/* ============ SESSION PERSISTANTE ============ */
// "Se souvenir de moi" coché -> localStorage (survit à la fermeture du navigateur)
// décoché -> sessionStorage (effacé à la fermeture de l'onglet)
const NUNI_SESSION_KEY = 'nuni_session';
function saveSession(token, user, remember){
  try{
    const payload = JSON.stringify({ token, userId: user.id });
    if(remember){
      localStorage.setItem(NUNI_SESSION_KEY, payload);
      sessionStorage.removeItem(NUNI_SESSION_KEY);
    } else {
      sessionStorage.setItem(NUNI_SESSION_KEY, payload);
      localStorage.removeItem(NUNI_SESSION_KEY);
    }
  }catch(e){ /* stockage indisponible (navigation privée très restrictive) : tant pis, pas bloquant */ }
}
function clearSession(){
  try{
    localStorage.removeItem(NUNI_SESSION_KEY);
    sessionStorage.removeItem(NUNI_SESSION_KEY);
  }catch(e){}
}
function readStoredSession(){
  try{
    const raw = localStorage.getItem(NUNI_SESSION_KEY) || sessionStorage.getItem(NUNI_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  }catch(e){ return null; }
}
async function restoreSession(){
  const stored = readStoredSession();
  if(!stored || !stored.token) return;
  try{
    const res = await fetch(NUNI_API_BASE + '/api/me', { headers:{ 'Authorization':'Bearer ' + stored.token } });
    if(!res.ok){
      // Compte suspendu/supprimé DEPUIS l'émission du token : on le détecte ici, à la toute
      // première requête de la session, pas seulement à la reconnexion manuelle. On informe
      // clairement plutôt que de renvoyer silencieusement vers l'accueil sans explication.
      const errData = await res.json().catch(()=>({}));
      clearSession();
      if(res.status === 403 && errData.error){ toast('❌ ' + errData.error); }
      return;
    }
    const data = await res.json();
    realAuthToken = stored.token;
    startAccountStatusWatcher();
    syncLikedTracksFromServer();
    loadProgress();
    realUserId = stored.userId;
    currentUser = data.user;
    applyAccountType();
    if(currentUser.subscription_status === 'active'){
      enterApp('catalog');
      toast(`Bon retour, ${currentUser.first_name} 👋`);
    } else if(currentUser.plan && currentUser.plan !== 'discovery'){
      choosePlan(currentUser.plan); // Pass déjà connu : pas besoin de re-remplir l'inscription
      toast(`Bon retour, ${currentUser.first_name} — votre Pass n'est plus actif, réactivez-le.`);
    } else {
      goTo('plans');
    }
  }catch(e){ /* pas de réseau : on laisse l'écran d'accueil, l'utilisateur pourra réessayer */ }
}
// Coupe complètement la lecture en cours — appelée à la déconnexion pour qu'aucun son d'un
// compte ne continue de jouer une fois passé sur un autre compte (chaque session doit repartir
// de zéro, sans musique héritée de la session précédente).
function stopAllPlayback(){
  try{
    clearInterval(progressTimer);
    realAudio.pause();
    realAudio.removeAttribute('src');
    usingRealAudio = false;
    playing = false;
    elapsed = 0;
    document.documentElement.classList.remove('is-playing');
    const icon = document.getElementById('play-icon');
    if(icon) icon.innerHTML = '<path d="M8 5v14l11-7z"/>';
    const fpIcon = document.getElementById('fp-play-icon');
    if(fpIcon) fpIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
    const playerBar = document.getElementById('player-bar');
    if(playerBar) playerBar.style.display = 'none';
    closeFullPlayer();
  }catch(e){ /* pas bloquant si un élément du lecteur n'existe pas encore au moment de l'appel */ }
}
// Vérification périodique en arrière-plan : si l'admin suspend/supprime ce compte pendant
// qu'il est déjà connecté (pas juste au prochain login), on le détecte dans les 2 minutes
// et on déconnecte immédiatement, plutôt que d'attendre l'expiration du token (30 jours).
let accountStatusCheckTimer = null;
function startAccountStatusWatcher(){
  clearInterval(accountStatusCheckTimer);
  accountStatusCheckTimer = setInterval(async ()=>{
    if(!realAuthToken) return;
    try{
      const res = await fetch(NUNI_API_BASE + '/api/me', { headers:{ 'Authorization':'Bearer ' + realAuthToken } });
      if(res.status === 401 || res.status === 403){
        const errData = await res.json().catch(()=>({}));
        clearInterval(accountStatusCheckTimer);
        toast('❌ ' + (errData.error || 'Session invalide.'));
        logoutUser();
        return;
      }
      if(res.ok){
        // Avant : cette vérification périodique ne servait qu'à détecter une suspension —
        // elle récupérait bien les vraies données à jour du compte, mais les jetait sans
        // jamais les appliquer. Résultat : un client déjà connecté au moment où l'admin
        // active son Pass ne voyait jamais son compte passer "actif" tout seul, même après
        // plusieurs minutes — il fallait se déconnecter/reconnecter pour que ça se mette à jour.
        const data = await res.json();
        const wasActive = currentUser && currentUser.subscription_status === 'active';
        const nowActive = data.user && data.user.subscription_status === 'active';
        currentUser = data.user;
        saveSession(realAuthToken, currentUser, true);
        applyAccountType();
        if(!wasActive && nowActive){
          toast('🎉 Votre Pass est maintenant actif — bienvenue sur NUNI en intégralité !');
        }
      }
    }catch(e){ /* pas de réseau : on ne déconnecte pas sur un simple souci de connexion */ }
  }, 120000); // toutes les 2 minutes
}

function logoutUser(){
  clearInterval(accountStatusCheckTimer);
  stopAllPlayback();
  clearSession();
  realAuthToken = null;
  realUserId = null;
  currentUser = null;
  demoOverride = false;
  closeProfileMenu();
  applyAccountType();
  goTo('home');
  toast('Vous avez été déconnecté.');
}
function togglePasswordVisibility(inputId, btn){
  const input = document.getElementById(inputId);
  if(!input) return;
  const nowVisible = input.type === 'password';
  input.type = nowVisible ? 'text' : 'password';
  btn.innerHTML = nowVisible
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.6 21.6 0 0 1 5.06-5.94M9.9 4.24A10.9 10.9 0 0 1 12 4c7 0 11 7 11 7a21.7 21.7 0 0 1-2.61 3.65M14.12 14.12a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>';
}
function openLoginModal(){
  document.getElementById('login-feedback').innerHTML = '';
  const overlay = document.getElementById('login-overlay');
  overlay.classList.add('show');
  overlay.classList.add('is-preparing');
  setTimeout(()=> overlay.classList.remove('is-preparing'), 550);
  // Réveille le serveur Render dès l'ouverture — voir le même commentaire dans openRedeemModal.
  fetch(NUNI_API_BASE + '/api/stats/public').catch(()=>{});
}
function closeLoginModal(){
  document.getElementById('login-overlay').classList.remove('show');
}
async function submitLogin(){
  const feedback = document.getElementById('login-feedback');
  const btn = document.getElementById('login-submit-btn');
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if(!email || !password){
    feedback.style.color = 'var(--rose-braise)';
    feedback.textContent = 'Merci de renseigner votre email et votre mot de passe.';
    return;
  }

  feedback.style.color = 'var(--text-dim)';
  feedback.textContent = 'Connexion en cours…';
  btn.disabled = true;

  try{
    const res = await fetchWithRetry(NUNI_API_BASE + '/api/login',
      { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password }) },
      ()=>{ feedback.textContent = 'Le serveur se réveille, nouvel essai dans quelques secondes…'; }
    );
    const data = await res.json();
    if(!res.ok){
      feedback.style.color = 'var(--rose-braise)';
      feedback.textContent = '❌ ' + data.error;
      btn.disabled = false;
      return;
    }
    realAuthToken = data.token;
    loadProgress();
    startAccountStatusWatcher();
    syncLikedTracksFromServer();
    realUserId = data.user.id;
    currentUser = data.user;
    const rememberBox = document.getElementById('login-remember');
    saveSession(data.token, data.user, !rememberBox || rememberBox.checked);

    feedback.style.color = '#7FC79A';
    feedback.textContent = '✅ Connexion réussie — bon retour ' + currentUser.first_name + ' !';
    btn.disabled = false;
    applyAccountType();
    setTimeout(()=>{
      closeLoginModal();
      if(currentUser.subscription_status === 'active'){
        enterApp('catalog');
      } else if(currentUser.plan && currentUser.plan !== 'discovery'){
        choosePlan(currentUser.plan);
      } else {
        goTo('plans');
      }
    }, 600);
  }catch(e){
    feedback.style.color = 'var(--rose-braise)';
    feedback.textContent = '❌ Impossible de contacter le serveur NUNI.';
    btn.disabled = false;
  }
}

async function choosePlan(type){
  pendingPlanType = type;
  // Compte déjà existant et connecté : pas besoin de repasser par le formulaire d'inscription
  // complet — on redemande juste le Pass, puis on l'envoie directement sur WhatsApp payer,
  // et il n'aura plus qu'à saisir son nouveau code d'accès une fois le paiement confirmé.
  if(currentUser && realAuthToken){
    try{
      await fetch(NUNI_API_BASE + '/api/subscribe/request', {
        method:'POST',
        headers:{'Content-Type':'application/json', 'Authorization':'Bearer ' + realAuthToken},
        body: JSON.stringify({ plan: type })
      });
    }catch(e){ /* pas bloquant : on affiche WhatsApp même si cet appel échoue */ }
    document.getElementById('whatsapp-modal-overlay').classList.add('show');
    return;
  }
  document.getElementById('rr-title').textContent = type === 'artist' ? 'Créer mon compte Artiste' : 'Créer mon compte Consommateur';
  document.getElementById('rr-artist-fields').style.display = type === 'artist' ? 'block' : 'none';
  document.getElementById('rr-feedback').innerHTML = '';
  document.getElementById('real-register-overlay').classList.add('show');
}
function closeRealRegister(){
  document.getElementById('real-register-overlay').classList.remove('show');
}
async function submitRealRegistration(){
  const feedback = document.getElementById('rr-feedback');
  const btn = document.getElementById('rr-submit-btn');
  const body = {
    accountType: pendingPlanType,
    firstName: document.getElementById('rr-first').value.trim(),
    lastName: document.getElementById('rr-last').value.trim(),
    email: document.getElementById('rr-email').value.trim(),
    password: document.getElementById('rr-password').value,
    age: document.getElementById('rr-age').value,
    phone: document.getElementById('rr-phone').value.trim(),
    address: document.getElementById('rr-address').value.trim(),
    city: document.getElementById('rr-city').value.trim(),
    country: document.getElementById('rr-country').value.trim(),
  };
  if(pendingPlanType === 'artist'){
    body.artistName = document.getElementById('rr-artistname').value.trim();
    body.labelOrManager = document.getElementById('rr-label').value.trim();
  }

  feedback.style.color = 'var(--text-dim)';
  feedback.textContent = 'Connexion au serveur NUNI…';
  btn.disabled = true;

  try{
    const res = await fetch(NUNI_API_BASE + '/api/register', {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)
    });
    const data = await res.json();
    if(!res.ok){
      feedback.style.color = 'var(--rose-braise)';
      feedback.textContent = '❌ ' + data.error;
      btn.disabled = false;
      return;
    }
    realAuthToken = data.token;
    loadProgress();
    startAccountStatusWatcher();
    syncLikedTracksFromServer();
    realUserId = data.user.id;
    currentUser = data.user;
    saveSession(data.token, data.user, true); // toujours mémorisé après une inscription fraîche

    // demande de Pass, tout de suite après la création du compte
    const subRes = await fetch(NUNI_API_BASE + '/api/subscribe/request', {
      method:'POST',
      headers:{'Content-Type':'application/json', 'Authorization':'Bearer ' + realAuthToken},
      body: JSON.stringify({plan: pendingPlanType})
    });
    await subRes.json();

    feedback.style.color = '#7FC79A';
    feedback.textContent = `✅ Compte créé (id ${realUserId}) — direction WhatsApp pour le paiement.`;
    btn.disabled = false;

    setTimeout(()=>{
      closeRealRegister();
      document.getElementById('whatsapp-modal-overlay').classList.add('show');
    }, 900);
  }catch(e){
    feedback.style.color = 'var(--rose-braise)';
    feedback.textContent = '❌ Impossible de contacter le serveur NUNI. Vérifiez votre connexion internet.';
    btn.disabled = false;
  }
}

function confirmPlanViaWhatsApp(){
  const type = pendingPlanType;
  const planLabel = type === 'artist' ? 'Pass Artiste' : 'Pass Consommateur';
  const idNote = realUserId ? ` (mon identifiant NUNI : ${realUserId})` : '';
  const msg = encodeURIComponent(`Bonjour NUNI, je souhaite souscrire au ${planLabel}${idNote}. Pouvez-vous m'aider à finaliser mon paiement ?`);
  window.open(`https://wa.me/242068951600?text=${msg}`, '_blank');
  document.getElementById('whatsapp-modal-overlay').classList.remove('show');
  toast('Une fois votre paiement confirmé, vous recevrez un code à saisir ci-dessous.');
  openRedeemModal();
}
function closeWhatsAppModal(){
  document.getElementById('whatsapp-modal-overlay').classList.remove('show');
}

function openRedeemModal(){
  document.getElementById('redeem-feedback').innerHTML = '';
  document.getElementById('redeem-submit-btn').disabled = false; // sinon un ancien essai pouvait laisser le bouton bloqué
  redeemRequestId++; // annule tout essai précédent encore en cours (voir submitRedeem)
  // Réveille le serveur Render (plan gratuit, s'endort après 15 min d'inactivité) dès
  // l'ouverture du modal — le temps que la personne tape son code à 6 caractères, le
  // serveur a de bonnes chances d'être déjà réveillé au moment du vrai clic.
  fetch(NUNI_API_BASE + '/api/stats/public').catch(()=>{});
  if(realAuthToken){
    document.getElementById('redeem-email').closest('.field').style.display = 'none';
    document.getElementById('redeem-password').closest('.field').style.display = 'none';
  } else {
    document.getElementById('redeem-email').closest('.field').style.display = '';
    document.getElementById('redeem-password').closest('.field').style.display = '';
  }
  document.getElementById('redeem-overlay').classList.add('show');
}
function closeRedeemModal(){
  document.getElementById('redeem-overlay').classList.remove('show');
}
let redeemRequestId = 0; // protège contre un essai précédent qui répondrait en retard et écraserait un essai plus récent

// Sur le plan gratuit de Render, le serveur peut mettre 30-50s à se réveiller après une
// période d'inactivité — un premier essai peut échouer pile pendant ce réveil. Plutôt que
// d'afficher tout de suite une erreur, on retente automatiquement une fois après un délai.
async function fetchWithRetry(url, options, onRetrying){
  try{
    return await fetch(url, options);
  }catch(e){
    if(onRetrying) onRetrying();
    await new Promise(r=> setTimeout(r, 4000));
    return await fetch(url, options); // 2e essai — si celui-ci échoue aussi, l'erreur remonte normalement
  }
}

async function submitRedeem(){
  const myRequestId = ++redeemRequestId;
  const feedback = document.getElementById('redeem-feedback');
  const btn = document.getElementById('redeem-submit-btn');
  const code = document.getElementById('redeem-code-input').value.trim().toUpperCase();
  btn.disabled = true;
  feedback.style.color = 'var(--text-dim)';
  feedback.textContent = 'Vérification en cours…';

  try{
    // se connecter d'abord si on n'a pas déjà un token en mémoire
    if(!realAuthToken){
      const email = document.getElementById('redeem-email').value.trim();
      const password = document.getElementById('redeem-password').value;
      const loginRes = await fetchWithRetry(NUNI_API_BASE + '/api/login',
        { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email, password}) },
        ()=>{ if(myRequestId === redeemRequestId) feedback.textContent = 'Le serveur se réveille, nouvel essai dans quelques secondes…'; }
      );
      const loginData = await loginRes.json();
      if(myRequestId !== redeemRequestId) return; // un essai plus récent a pris le relais entre-temps
      if(!loginRes.ok){
        feedback.style.color = 'var(--rose-braise)';
        feedback.textContent = '❌ ' + loginData.error;
        btn.disabled = false;
        return;
      }
      realAuthToken = loginData.token;
      loadProgress();
      startAccountStatusWatcher();
      syncLikedTracksFromServer();
      realUserId = loginData.user.id;
      currentUser = loginData.user;
      const rememberBox = document.getElementById('redeem-remember');
      saveSession(loginData.token, loginData.user, !rememberBox || rememberBox.checked);
    }

    const res = await fetchWithRetry(NUNI_API_BASE + '/api/subscribe/redeem',
      { method:'POST', headers:{'Content-Type':'application/json', 'Authorization':'Bearer ' + realAuthToken}, body: JSON.stringify({code}) },
      ()=>{ if(myRequestId === redeemRequestId) feedback.textContent = 'Le serveur se réveille, nouvel essai dans quelques secondes…'; }
    );
    const data = await res.json();
    if(myRequestId !== redeemRequestId) return; // un essai plus récent a pris le relais entre-temps
    if(!res.ok){
      feedback.style.color = 'var(--rose-braise)';
      feedback.textContent = '❌ ' + data.error;
      btn.disabled = false;
      return;
    }
    feedback.style.color = '#7FC79A';
    feedback.textContent = '✅ ' + data.message;
    toast('Accès débloqué — bienvenue sur NUNI en intégralité 🕊️');
    currentUser = data.user;
    applyAccountType();
    setTimeout(()=>{ closeRedeemModal(); enterApp('catalog'); }, 1200);
  }catch(e){
    if(myRequestId !== redeemRequestId) return; // un essai plus récent a pris le relais entre-temps
    feedback.style.color = 'var(--rose-braise)';
    feedback.textContent = '❌ Impossible de contacter le serveur NUNI.';
    btn.disabled = false;
  }
}

/* ============ PASS DÉCOUVERTE (essai gratuit 24h, heure du Congo) ============ */
let discoveryEndTime = null, discoveryTimer = null;
function getCongoNow(){
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Brazzaville' }));
}
function startDiscovery(){
  discoveryEndTime = getCongoNow().getTime() + 24*60*60*1000;
  document.getElementById('discovery-banner').style.display = 'flex';
  toast('Pass Découverte activé — 24h pour explorer NUNI (heure de Brazzaville).');
  enterApp('catalog');
  updateDiscoveryCountdown();
  discoveryTimer = setInterval(updateDiscoveryCountdown, 1000);
}
function updateDiscoveryCountdown(){
  const remaining = discoveryEndTime - getCongoNow().getTime();
  if(remaining <= 0){ endDiscovery(); return; }
  const h = String(Math.floor(remaining/3600000)).padStart(2,'0');
  const m = String(Math.floor((remaining%3600000)/60000)).padStart(2,'0');
  const s = String(Math.floor((remaining%60000)/1000)).padStart(2,'0');
  const el = document.getElementById('discovery-countdown');
  if(el) el.textContent = `${h}:${m}:${s}`;
}
function endDiscovery(){
  clearInterval(discoveryTimer);
  document.getElementById('discovery-banner').style.display = 'none';
  document.getElementById('ai-modal-overlay').classList.add('show');
}
function closeAiModal(){
  document.getElementById('ai-modal-overlay').classList.remove('show');
}

/* ============ MIMI — assistant musique congolaise ============ */
/* ---- Animation de l'avatar : clignement auto + états (écoute/réflexion/parole/content) ---- */
function mimiBlinkLoop(){
  function blink(){
    document.querySelectorAll('.mimi-avatar-stage').forEach(el=>{
      el.classList.add('blink');
      setTimeout(()=>el.classList.remove('blink'), 160);
    });
    setTimeout(blink, 2600 + Math.random()*3200);
  }
  setTimeout(blink, 1200);
}
function mimiFace(state){
  document.querySelectorAll('.mimi-avatar').forEach(el=>{
    el.classList.remove('is-listening','is-thinking','is-talking','is-happy');
    if(state && state !== 'idle') el.classList.add('is-'+state);
  });
}
mimiBlinkLoop();

function toggleMimi(){
  const widget = document.getElementById('mimi-widget');
  widget.classList.toggle('open');
  if(widget.classList.contains('open')){
    mimiFace('happy');
    setTimeout(()=>mimiFace('idle'), 900);
  }
}
const mimiConversation = [
  { k: ['salut', 'bonjour', 'mbote', 'coucou', 'hello', 'bonsoir'],
    a: "👋 Bonjour ! Comment allez-vous aujourd'hui ? Envie d'écouter quelque chose de précis, ou je vous fais une petite recommandation ?" },
  { k: ['je vais bien', 'ça va bien', 'ca va bien', 'je vais super', 'nickel', 'très bien'],
    a: "Ravie de l'entendre 😊 Voulez-vous découvrir les nouveautés du moment, ou plutôt réécouter vos morceaux favoris ?" },
  { k: ['je suis triste', 'pas bien', 'fatigué', 'fatiguée', 'déprimé', 'déprimée', 'difficile'],
    a: "❤️ Je comprends. Je peux vous proposer une sélection plus douce — quelques belles rumba congolaises ou un gospel apaisant — pour vous remonter un peu le moral. Voulez-vous que je lance ça ?" },
  { k: ['mets du rap', 'du rap', 'rap congolais', 'écouter du rap'],
    a: "Très bon choix 🎤 Direction la Radio Rap Congo — je vous lance ça. Ouvrez le tuner NUNI Radio et sélectionnez la station 88.9 MHz pour enchaîner uniquement du rap congolais." },
  { k: ['mets de la rumba', 'de la rumba', 'écouter de la rumba', 'j\'aime la rumba'],
    a: "Excellent goût 💃 La station 90.3 MHz — NUNI Rumba — est faite pour vous. Ouvrez le tuner NUNI Radio pour en profiter en continu." },
  { k: ['mets du gospel', 'du gospel'],
    a: "🙏 Direction la station 91.7 MHz — NUNI Gospel — dans le tuner NUNI Radio, pour une belle sélection continue." },
  { k: ['merci', 'merci beaucoup', 'super merci'],
    a: "Avec plaisir ❤️ Bonne écoute sur NUNI, et n'hésitez pas à revenir si vous avez une autre question." },
  { k: ['ça va', 'ca va', 'comment vas-tu', 'comment vas tu'],
    a: "Je vais très bien, merci de demander 🕊️ Et vous, quelle est l'ambiance du jour — plutôt calme ou plutôt festive ?" },
  { k: ['recommande', 'recommandation', 'propose moi', 'suggère'],
    a: "Avec plaisir ! Je vous recommande de découvrir <b>Bibi Mwana</b> pour la rumba moderne, ou la playlist Top Congo dans le catalogue si vous voulez un mix des titres les plus populaires du moment." },
];
const mimiKnowledge = [
  { k: ['papa', 'papas', 'légende', 'légendes', 'fondateur', 'fondateurs'],
    a: "Nos papas de la musique congolaise ! 🕊️ On pense d'abord à <b>Joseph Kabasele</b> dit Grand Kallé, le père de la rumba moderne avec l'African Jazz ; <b>Franco Luambo Makiadi</b>, chef du TP OK Jazz, une légende absolue ; et <b>Tabu Ley Rochereau</b>, immense voix et compositeur du Congo. Voulez-vous en savoir plus sur l'un d'eux ?" },
  { k: ['franco', 'ok jazz', 'luambo'],
    a: "<b>Franco Luambo Makiadi</b> (1938–1989) a fondé le TP OK Jazz et est resté une figure centrale de la rumba congolaise pendant plus de 30 ans, avec une guitare reconnaissable entre mille. On le surnomme parfois 'le sorcier de la guitare'." },
  { k: ['tabu ley', 'rochereau'],
    a: "<b>Tabu Ley Rochereau</b> a marqué la rumba congolaise avec l'African Fiesta, puis Afrisa International. Sa voix et ses mélodies ont influencé des générations de musiciens congolais et africains." },
  { k: ['kallé', 'kabasele', 'african jazz', 'grand kallé'],
    a: "<b>Joseph Kabasele</b>, dit Grand Kallé, a fondé l'African Jazz dans les années 1950 à Kinshasa. Son titre « Indépendance Cha Cha » est devenu un hymne panafricain lors des indépendances." },
  { k: ['papa wemba', 'wemba', 'viva la musica'],
    a: "<b>Papa Wemba</b>, star de la rumba et du soukous avec Viva la Musica, a aussi porté la culture congolaise dans le monde entier à travers le mouvement 'Sapeur' (la SAPE)." },
  { k: ['zaiko', 'langa langa'],
    a: "<b>Zaïko Langa Langa</b>, groupe formé en 1969 à Kinshasa, a modernisé la rumba en y intégrant des rythmes plus rapides — une influence majeure sur le soukous moderne." },
  { k: ['mbilia bel'],
    a: "<b>Mbilia Bel</b> est l'une des plus grandes voix féminines de la rumba congolaise, révélée notamment aux côtés de Tabu Ley Rochereau." },
  { k: ['rumba', "qu'est-ce que la rumba", 'rumba congolaise'],
    a: "La <b>rumba congolaise</b> est née dans les années 1940-50 à Kinshasa et Brazzaville, mêlant influences afro-cubaines et rythmes locaux. Elle est reconnue depuis 2021 au patrimoine culturel immatériel de l'UNESCO — une immense fierté congolaise 🇨🇩🇨🇬." },
  { k: ['soukous'],
    a: "Le <b>soukous</b> est né de l'évolution de la rumba congolaise vers un tempo plus rapide et des guitares plus rythmées, popularisé dans les années 70-80 par des groupes comme Zaïko Langa Langa." },
  { k: ['ndombolo'],
    a: "Le <b>ndombolo</b> est un style de danse et de musique apparu dans les années 90, dérivé du soukous, très festif et toujours très présent dans les fêtes congolaises aujourd'hui." },
  { k: ['sape', 'sapeur', 'sapeurs'],
    a: "La <b>SAPE</b> (Société des Ambianceurs et des Personnes Élégantes) est un mouvement vestimentaire né à Brazzaville puis Kinshasa, intimement lié à la musique congolaise — Papa Wemba en était l'une des grandes figures." },
];
function mimiAsk(question){
  const box = document.getElementById('mimi-messages');
  const userMsg = document.createElement('div');
  userMsg.className = 'mimi-msg user';
  userMsg.textContent = question;
  box.appendChild(userMsg);
  mimiFace('thinking');

  const q = question.toLowerCase();
  let answer = "Pour un début, je peux discuter simplement avec vous, vous recommander de la musique selon votre humeur, ou vous parler de nos grandes figures historiques (Grand Kallé, Franco, Tabu Ley, Papa Wemba...) et des styles comme la rumba ou le soukous 🕊️";
  let found = false;
  for(const entry of mimiConversation){
    if(entry.k.some(word => q.includes(word))){ answer = entry.a; found = true; break; }
  }
  if(!found){
    for(const entry of mimiKnowledge){
      if(entry.k.some(word => q.includes(word))){ answer = entry.a; break; }
    }
  }
  setTimeout(()=>{
    const botMsg = document.createElement('div');
    botMsg.className = 'mimi-msg bot';
    botMsg.innerHTML = answer;
    box.appendChild(botMsg);
    box.scrollTop = box.scrollHeight;
    mimiFace('talking');
    const plainLen = answer.replace(/<[^>]+>/g,'').length;
    const talkMs = Math.min(3200, Math.max(700, plainLen*35));
    setTimeout(()=>mimiFace('idle'), talkMs);
  }, 450);
  box.scrollTop = box.scrollHeight;
}
function mimiSend(){
  const input = document.getElementById('mimi-input');
  const q = input.value.trim();
  if(!q) return;
  mimiAsk(q);
  input.value = '';
}
/* ============ MENTIONS LÉGALES ============ */
const legalContent = {
  privacy: {
    title: 'Politique de confidentialité',
    body: `
      <p>NUNI collecte uniquement les informations nécessaires au fonctionnement du service : identité, contact, ville, historique d'écoute et informations de paiement transmises par votre opérateur Mobile Money.</p>
      <h4>Données collectées</h4>
      <ul><li>Informations de compte (nom, pseudo, email, téléphone, ville)</li><li>Historique d'écoute et préférences musicales</li><li>Informations de paiement (traitées par MTN/Airtel, jamais stockées en clair par NUNI)</li></ul>
      <h4>Utilisation</h4>
      <p>Ces données servent à personnaliser votre expérience, calculer la rémunération des artistes, et améliorer la plateforme. Elles ne sont jamais vendues à des tiers.</p>
      <h4>Vos droits</h4>
      <p>Vous pouvez à tout moment demander l'accès, la correction ou la suppression de vos données depuis Paramètres → Confidentialité.</p>
      <p style="color:var(--text-faint); font-size:12px; margin-top:16px;">Document de démonstration — à faire valider par un juriste avant mise en production.</p>`
  },
  terms: {
    title: "Conditions d'utilisation",
    body: `
      <p>En créant un compte NUNI, vous acceptez les présentes conditions.</p>
      <h4>Compte</h4>
      <p>Vous devez avoir 16 ans ou plus. Les informations fournies doivent être exactes. Un compte est personnel et non transférable.</p>
      <h4>Abonnements et paiement</h4>
      <p>Les Pass Consommateur et Artiste sont facturés par trimestre ou par an via MTN Mobile Money ou Airtel Money. Le Pass Découverte est gratuit pendant 24h, sans engagement.</p>
      <h4>Contenu artiste</h4>
      <p>L'artiste garantit détenir les droits sur tout contenu publié. NUNI se réserve le droit de retirer tout contenu signalé ou en infraction avec le droit d'auteur.</p>
      <h4>Résiliation</h4>
      <p>Vous pouvez résilier votre abonnement à tout moment depuis votre profil ; l'accès reste actif jusqu'à la fin de la période payée.</p>
      <p style="color:var(--text-faint); font-size:12px; margin-top:16px;">Document de démonstration — à faire valider par un juriste avant mise en production.</p>`
  },
  legal: {
    title: 'Mentions légales',
    body: `
      <p><b>Éditeur :</b> NUNI SAS (nom à confirmer)<br><b>Siège :</b> Brazzaville, République du Congo<br><b>Contact :</b> contact@nuni.cg (exemple)</p>
      <h4>Hébergement</h4>
      <p>La plateforme est hébergée sur une infrastructure cloud sécurisée (à préciser selon le prestataire choisi).</p>
      <h4>Propriété intellectuelle</h4>
      <p>Le nom NUNI, le logo et l'identité visuelle sont la propriété exclusive de leurs créateurs. Toute reproduction sans autorisation est interdite.</p>
      <h4>Responsabilité</h4>
      <p>NUNI agit comme intermédiaire technique entre artistes et auditeurs. La responsabilité du contenu publié incombe à l'artiste qui le téléverse.</p>
      <p style="color:var(--text-faint); font-size:12px; margin-top:16px;">Document de démonstration — informations à compléter avec vos données légales réelles.</p>`
  },
  cookies: {
    title: 'Cookies',
    body: `
      <p>NUNI utilise des cookies et technologies similaires pour :</p>
      <ul><li>Vous garder connecté entre deux visites</li><li>Mémoriser vos préférences (thème clair/sombre, volume)</li><li>Mesurer l'audience de façon anonymisée</li></ul>
      <h4>Gestion</h4>
      <p>Vous pouvez désactiver les cookies non essentiels depuis les paramètres de votre navigateur. Les cookies strictement nécessaires au fonctionnement (connexion, sécurité) ne peuvent pas être désactivés.</p>
      <p style="color:var(--text-faint); font-size:12px; margin-top:16px;">Document de démonstration — à adapter selon les outils analytiques réellement utilisés.</p>`
  }
};
function openLegal(type){
  const data = legalContent[type];
  if(!data) return;
  document.getElementById('legal-title').textContent = data.title;
  document.getElementById('legal-body').innerHTML = data.body;
  document.getElementById('legal-modal-overlay').classList.add('show');
}
function closeLegal(){
  document.getElementById('legal-modal-overlay').classList.remove('show');
}
function aiChoosePlan(type){
  closeAiModal();
  goTo('plans');
  toast(type==='artist' ? "L'assistant NUNI vous a dirigé vers le Pass Artiste 🎤" : "L'assistant NUNI vous a dirigé vers le Pass Consommateur 🎧");
}

function updateGreeting(){
  const titleEl = document.getElementById('catalog-greeting-title');
  const subEl = document.getElementById('catalog-greeting-sub');
  if(!titleEl) return;
  const congoHour = new Date().toLocaleString('en-US', { timeZone: 'Africa/Brazzaville', hour:'2-digit', hour12:false });
  const h = parseInt(congoHour, 10);
  let title, subs;
  if(h >= 5 && h < 12){
    title = 'Mbote, bonjour ☀️';
    subs = ["Un nouveau jour, une nouvelle playlist rien que pour vous.", "Le Congo se réveille en musique — voici de quoi bien commencer.", "Café, soleil et rumba : voici votre matinée idéale."];
  } else if(h >= 12 && h < 17){
    title = 'Bon après-midi 🎶';
    subs = ["Une pause musicale bien méritée vous attend.", "Ça bouge au Congo cet après-midi — venez écouter.", "De quoi accompagner le reste de votre journée en beauté."];
  } else if(h >= 17 && h < 21){
    title = 'Bonsoir 👋';
    subs = ["Voici ce qui fait vibrer le Congo cette semaine.", "La soirée commence bien avec la bonne musique.", "Installez-vous, on s'occupe de l'ambiance."];
  } else {
    title = 'Bonne nuit, mélomane 🌙';
    subs = ["Une sélection douce pour finir la journée en beauté.", "Encore quelques titres avant de dormir ?", "La nuit congolaise a aussi sa propre musique."];
  }
  titleEl.textContent = title;
  subEl.textContent = subs[Math.floor(Math.random()*subs.length)];
  [titleEl, subEl].forEach(el=>{
    el.classList.remove('greeting-anim'); void el.offsetWidth; el.classList.add('greeting-anim');
  });
}

/* Section "Continuer l'écoute" : basée sur le véritable historique de la session, pas des données de démo.
   Ne s'affiche que s'il y a vraiment quelque chose à reprendre — pas de section vide qui donnerait
   une impression d'écran cassé. */
function renderContinueListening(){
  const wrap = document.getElementById('shelf-continue-wrap');
  const row = document.getElementById('shelf-continue');
  if(!wrap || !row) return;
  // dernier morceau écouté par titre, le plus récent en premier, sans doublons
  const seen = new Set();
  const recent = [];
  for(const h of listeningHistory){
    if(seen.has(h.track.t)) continue;
    seen.add(h.track.t);
    recent.push(h.track);
    if(recent.length >= 8) break;
  }
  if(!recent.length){ wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';
  row.innerHTML = '';
  fillShelf('shelf-continue', recent);
}

let isOpeningArtistPage = false; // garde-fou anti-boucle : openArtistPage appelle enterApp('artist'),
                                   // qui sans ce garde-fou rappellerait openArtistPage indéfiniment.
function enterApp(view){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('app-shell').classList.add('active');
  document.getElementById('player-bar').style.display = 'flex';
  document.getElementById('mobile-tabbar').style.removeProperty('display');
  document.getElementById('demo-nav').classList.remove('no-player');
  document.getElementById('mimi-widget').classList.remove('no-player');
  if(view === 'catalog'){ updateGreeting(); renderContinueListening(); loadProgress(); }
  if(view === 'clips') loadRealClips(); // recharge les vrais clips à chaque ouverture (loadRealClips appelle renderClips())
  if(view === 'library') renderLibrary();
  if(view === 'artist' && currentUser && currentUser.account_type === 'artist' && !isOpeningArtistPage){
    openArtistPage(currentUser.artist_name); // sinon l'onglet ne fait qu'afficher l'ancien contenu, jamais rafraîchi
    return; // openArtistPage rappelle enterApp('artist') lui-même (avec le garde-fou actif) pour finir l'affichage
  }
  if(view === 'dashboard'){
    loadArtistStats();
    loadDashboardChart();
    loadPaymentsHistory();
    const momoInput = document.getElementById('momo-number-input');
    if(momoInput) momoInput.value = (currentUser && currentUser.momo_number) || '';
    const avatarDash = document.getElementById('avatar-preview-dash');
    if(avatarDash && currentUser && currentUser.avatar_url){
      avatarDash.style.backgroundImage = `url(${currentUser.avatar_url})`;
      avatarDash.textContent = '';
    }
    const coverDash = document.getElementById('cover-preview-dash');
    if(coverDash && currentUser && currentUser.banner_url){
      coverDash.style.backgroundImage = `url(${currentUser.banner_url})`;
    }
    loadFeaturedPicker();
  }
  ['catalog','clips','ads','library','artist','dashboard','admin'].forEach(v=>{
    const el = document.getElementById('view-'+v);
    if(el) el.style.display = (v===view) ? 'block' : 'none';
  });
  document.querySelectorAll('.app-nav-link').forEach(l=>{
    l.classList.toggle('is-active', l.dataset.appLink === view);
  });
  document.querySelectorAll('.tab-btn').forEach(b=>{
    b.classList.toggle('is-active', b.dataset.tab === view);
  });
  window.scrollTo({top:0, behavior:'smooth'});
}

function jumpDemo(screen){
  if(screen==='home' || screen==='plans'){ goTo(screen); }
  else { enterApp(screen); }
  document.getElementById('demo-menu').classList.remove('open');
}
document.getElementById('demo-toggle').addEventListener('click', ()=>{
  document.getElementById('demo-menu').classList.toggle('open');
});

/* ============ CATALOG DATA ============ */
const artistProfiles = {
  'Bibi Mwana': { meta:'Rumba · Afro · Kinshasa', bio:"Bibi Mwana réinvente la rumba congolaise avec des arrangements modernes et une voix habitée. Entre Kinshasa et la diaspora, son univers tisse mémoire et avenir — chaque sortie est pensée comme un envol collectif pour la scène locale.", verified:true },
  'Ndombe Junior': { meta:'Afro · Kinshasa', bio:"Ndombe Junior mélange afrobeat et sonorités urbaines congolaises, porté par une énergie scénique reconnue dans toute la sous-région.", verified:true },
  'Kessy Tina': { meta:'Gospel · Pointe-Noire', bio:"Kessy Tina porte un gospel congolais moderne, entre chœurs traditionnels et productions actuelles, avec un message d'espoir au cœur de chaque titre.", verified:false },
  'Mbote System': { meta:'Hip-Hop · Brazzaville', bio:"Collectif hip-hop de Brazzaville, Mbote System raconte le quotidien urbain congolais avec des flows incisifs et des productions denses.", verified:false },
  'Les Anges du Rythme': { meta:'Traditionnel · Kinshasa', bio:"Les Anges du Rythme perpétuent les rythmes traditionnels congolais tout en les rapprochant des oreilles d'aujourd'hui.", verified:true },
  'Tcheza Nation': { meta:'Rap · Brazzaville', bio:"Tcheza Nation s'impose sur la scène rap congolaise avec des textes engagés et une identité sonore urbaine affirmée.", verified:false },
};
let currentArtistPageRealId = null;
function openArtistPage(name){
  const isOwnArtistPage = !!(currentUser && currentUser.account_type === 'artist' && currentUser.artist_name === name);
  const profile = artistProfiles[name] || { meta:'Artiste NUNI', bio:"Découvrez l'univers de "+name+" sur NUNI.", verified:false };
  const reallyVerified = isOwnArtistPage ? !!currentUser.is_verified : profile.verified;
  document.getElementById('artist-page-name').textContent = name;
  document.getElementById('artist-page-meta').textContent = profile.meta;
  document.getElementById('artist-page-bio').textContent = profile.bio;
  document.getElementById('artist-page-badge').style.display = reallyVerified ? 'inline-flex' : 'none';
  const artistPageAvatarEl = document.getElementById('artist-page-avatar');
  artistPageAvatarEl.classList.toggle('is-editable', isOwnArtistPage);
  const artistCoverEl = document.querySelector('.artist-cover');
  if(artistCoverEl){
    artistCoverEl.classList.toggle('is-editable', isOwnArtistPage);
    artistCoverEl.style.cursor = isOwnArtistPage ? 'pointer' : '';
    artistCoverEl.onclick = isOwnArtistPage ? ()=> document.getElementById('cover-upload-input').click() : null;
    if(isOwnArtistPage && currentUser.banner_url){
      artistCoverEl.style.backgroundImage = `url(${currentUser.banner_url})`;
    } else if(!isOwnArtistPage){
      artistCoverEl.style.backgroundImage = '';
    }
  }
  const initials = name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  if(isOwnArtistPage && currentUser.avatar_url){
    artistPageAvatarEl.style.backgroundImage = `url(${currentUser.avatar_url})`;
    artistPageAvatarEl.textContent = '';
  } else {
    artistPageAvatarEl.style.backgroundImage = '';
    artistPageAvatarEl.textContent = initials;
  }
  document.getElementById('artist-page-calendar-title').textContent = 'Calendrier des sorties — ' + name;
  renderCertificationButton(isOwnArtistPage, reallyVerified);

  // Statistiques réelles de l'en-tête artiste (avant : "2,4M" / "186K" / "9 480" codés en dur,
  // identiques pour tout le monde et jamais reliés à aucune vraie donnée).
  const statStreamsEl = document.getElementById('artist-stat-streams');
  const statSupportsEl = document.getElementById('artist-stat-supports');
  const artistTracksForStats = tracks.filter(t=>t.a===name);
  const realStreamsSum = artistTracksForStats.reduce((sum,t)=> sum + (t.isReal ? Number(t.streams)||0 : 0), 0);
  if(statStreamsEl) statStreamsEl.textContent = realStreamsSum > 0 ? realStreamsSum.toLocaleString('fr-FR') : '0';
  // "Soutiens reçus" n'est relié à aucun vrai système de pourboires/soutiens pour l'instant —
  // on l'affiche honnêtement à "—" plutôt qu'un chiffre inventé.
  if(statSupportsEl) statSupportsEl.textContent = '—';

  const artistTracks = tracks.filter(t=>t.a===name);
  const realTrackOfArtist = artistTracks.find(t=>t.artistId);
  currentArtistPageRealId = realTrackOfArtist ? realTrackOfArtist.artistId : (isOwnArtistPage ? currentUser.id : null);
  document.getElementById('artist-page-support-btn').setAttribute('onclick', `openSupportArtistModal(${currentArtistPageRealId || 'null'}, ${JSON.stringify(name)})`);

  // Sons en vedette — sélectionnés par l'artiste lui-même parmi ses morceaux déjà publiés.
  // Section entièrement masquée s'il n'a encore rien choisi (pas de rangée vide inutile).
  const featuredSection = document.getElementById('artist-featured-section');
  const featuredRow = document.getElementById('shelf-artist-featured');
  if(featuredSection && featuredRow){
    if(currentArtistPageRealId){
      fetch(NUNI_API_BASE + '/api/artist/' + currentArtistPageRealId + '/featured-tracks')
        .then(r=>r.json()).then(data=>{
          const list = data.tracks || [];
          featuredRow.innerHTML = '';
          if(!list.length){ featuredSection.style.display = 'none'; return; }
          list.map(r=>({
            t: r.title, a: r.artist_name || name, p:'pal-1', album: r.album || r.title,
            genre: r.genre || 'Afro', streams: String(r.streams||0), likes: r.likes||0,
            cover: r.cover_url || null, audioUrl: r.audio_url || null, isReal:true,
            releaseType: r.release_type || 'Single', realId: r.id, artistId: currentArtistPageRealId,
          })).forEach(tr=> featuredRow.appendChild(trackCard(tr)));
          featuredSection.style.display = '';
        }).catch(()=>{ featuredSection.style.display = 'none'; });
    } else {
      featuredSection.style.display = 'none';
    }
  }

  // Vrai nombre de followers — visible pour n'importe quel visiteur, pas seulement sur sa
  // propre page. Se met aussi à jour tout de suite après un clic sur "Suivre" (voir toggleFollow).
  const statFollowersEl = document.getElementById('artist-stat-followers');
  if(statFollowersEl){
    if(currentArtistPageRealId){
      fetch(NUNI_API_BASE + '/api/artist/' + currentArtistPageRealId + '/public-stats')
        .then(r=>r.json()).then(data=>{
          if(typeof data.follower_count === 'number') statFollowersEl.textContent = data.follower_count.toLocaleString('fr-FR');
          if(data.avatar_url && !(isOwnArtistPage && currentUser.avatar_url)){
            artistPageAvatarEl.style.backgroundImage = `url(${data.avatar_url})`;
            artistPageAvatarEl.textContent = '';
          }
          if(data.banner_url && !(isOwnArtistPage && currentUser.banner_url) && artistCoverEl){
            artistCoverEl.style.backgroundImage = `url(${data.banner_url})`;
          }
        }).catch(()=>{});
    } else {
      statFollowersEl.textContent = '—';
    }
  }

  // Vrai statut de suivi — avant, le bouton affichait toujours "Suivre" par défaut, même si
  // le compte connecté suivait déjà cet artiste, faute de vérification à l'ouverture.
  const followBtn = document.getElementById('follow-btn');
  if(followBtn){
    if(isOwnArtistPage){
      followBtn.style.display = 'none';
    } else {
      followBtn.style.display = '';
      followBtn.textContent = 'Suivre';
      if(currentArtistPageRealId && realAuthToken){
        fetch(NUNI_API_BASE + '/api/follow/' + currentArtistPageRealId + '/status', {
          headers:{ 'Authorization':'Bearer ' + realAuthToken }
        }).then(r=>r.json()).then(data=>{
          followBtn.textContent = data.following ? 'Suivi ✓' : 'Suivre';
        }).catch(()=>{});
      }
    }
  }
  ['shelf-artist','shelf-artist-trending','shelf-artist-albums'].forEach(id=>{
    const row = document.getElementById(id);
    if(row) row.innerHTML = '';
  });
  fillShelf('shelf-artist', artistTracks.length ? artistTracks : tracks.slice(0,4));
  fillShelf('shelf-artist-trending', [...artistTracks].sort((a,b)=>(b.likes||0)-(a.likes||0)));
  fillShelf('shelf-artist-albums', artistTracks);
  if(isOwnArtistPage){
    document.querySelectorAll('#shelf-artist .track-card, #shelf-artist-trending .track-card, #shelf-artist-albums .track-card').forEach(card=>{
      const cover = card.querySelector('.cover');
      if(!cover || cover.querySelector('.track-delete-btn') || !card.dataset.trackId) return;
      const delBtn = document.createElement('button');
      delBtn.className = 'track-delete-btn';
      delBtn.title = 'Supprimer ce morceau';
      delBtn.textContent = '🗑️';
      delBtn.style.cssText = 'position:absolute; top:8px; right:8px; z-index:4; width:28px; height:28px; border-radius:50%; background:rgba(0,0,0,.65); color:#fff; border:none; cursor:pointer; font-size:13px;';
      delBtn.onclick = (e)=>{ e.stopPropagation(); deleteMyTrack(card.dataset.trackId); };
      cover.appendChild(delBtn);
    });
  }

  const releaseRow = document.getElementById('artist-release-row');
  if(releaseRow){
    releaseRow.innerHTML = '';
    const scheduledUrl = (isOwnArtistPage && realAuthToken)
      ? NUNI_API_BASE + '/api/artist/scheduled-releases'
      : (currentArtistPageRealId ? NUNI_API_BASE + '/api/artist/' + currentArtistPageRealId + '/scheduled-releases' : null);
    if(scheduledUrl){
      fetch(scheduledUrl, isOwnArtistPage && realAuthToken ? { headers:{ 'Authorization':'Bearer ' + realAuthToken } } : {})
        .then(r=>r.json()).then(data=>{
          const list = data.releases || [];
          if(!list.length){
            releaseRow.innerHTML = `<p style="font-size:12.5px; color:var(--text-faint);">Aucune sortie programmée pour le moment.</p>`;
            return;
          }
          const mapped = list.map(r=>{
            const d = new Date(r.scheduled_release_at);
            const days = Math.max(0, Math.ceil((d - new Date()) / 86400000));
            return {
              d: String(d.getDate()).padStart(2,'0'),
              m: d.toLocaleDateString('fr-FR', {month:'short'}).replace('.',''),
              t: r.title, a: r.release_type || 'Single',
              c: days === 0 ? "Aujourd'hui" : days === 1 ? 'Demain' : `Dans ${days} jours`,
            };
          });
          fillReleaseRow('artist-release-row', mapped);
        }).catch(()=>{
          releaseRow.innerHTML = `<p style="font-size:12.5px; color:var(--text-faint);">Calendrier momentanément indisponible.</p>`;
        });
    }
  }

  renderArtistClips(name);

  isOpeningArtistPage = true;
  enterApp('artist');
  isOpeningArtistPage = false;
}
const NUNI_CERT_MIN_TRACKS = 50;
const NUNI_CERT_MIN_FOLLOWERS = 5000;
function renderCertificationButton(isOwnArtistPage, reallyVerified){
  const old = document.getElementById('nuni-cert-wrap');
  if(old) old.remove();
  const badge = document.getElementById('artist-page-badge');
  if(!isOwnArtistPage || reallyVerified || !badge) return;
  const status = currentUser.verification_status || 'none';
  const trackCount = currentUser.track_count || 0;
  const followerCount = currentUser.follower_count || 0;
  const eligible = trackCount >= NUNI_CERT_MIN_TRACKS && followerCount >= NUNI_CERT_MIN_FOLLOWERS;

  const wrap = document.createElement('span');
  wrap.id = 'nuni-cert-wrap';
  wrap.style.cssText = 'display:inline-flex; flex-direction:column; gap:4px; margin-left:10px; vertical-align:middle;';

  const btn = document.createElement('button');
  btn.style.cssText = 'padding:5px 14px; border-radius:16px; font-size:12px; font-weight:700; cursor:pointer; border:1px solid rgba(212,175,106,0.4);';

  if(status === 'pending'){
    btn.textContent = '⏳ Certification en attente';
    btn.disabled = true;
    btn.style.background = 'rgba(255,255,255,0.08)';
    btn.style.color = '#999';
    btn.style.cursor = 'default';
  } else if(!eligible){
    btn.textContent = '🔒 Conditions non remplies';
    btn.disabled = true;
    btn.style.background = 'rgba(255,255,255,0.06)';
    btn.style.color = '#888';
    btn.style.cursor = 'not-allowed';
  } else {
    btn.textContent = status === 'rejected' ? '🏅 Redemander la certification' : '🏅 Demander la certification';
    btn.style.background = 'linear-gradient(135deg,#D4AF6A,#8E63C9)';
    btn.style.color = '#141220';
    btn.onclick = requestVerification;
  }
  wrap.appendChild(btn);

  if(status !== 'pending'){
    const conditions = document.createElement('div');
    conditions.style.cssText = 'font-size:11px; color:#888; line-height:1.5;';
    conditions.innerHTML = `
      📋 Conditions : ${trackCount}/${NUNI_CERT_MIN_TRACKS} sons publiés · ${followerCount}/${NUNI_CERT_MIN_FOLLOWERS} abonnés<br>
      🎁 Avantages : badge vérifié, codes promo exclusifs, mise en avant, stats avancées`;
    wrap.appendChild(conditions);
  }

  badge.insertAdjacentElement('afterend', wrap);
}
/* ============ SOUTIEN DIRECT (Mobile Money) ============
   Don volontaire d'un fan vers l'artiste, en dehors de NUNI : NUNI n'y touche jamais,
   ne prend aucune commission, se contente d'afficher le numéro que l'artiste a bien
   voulu renseigner (facultatif). Simple transfert Mobile Money classique entre les deux. */
async function openSupportArtistModal(artistId, artistName){
  const title = document.getElementById('support-artist-title');
  const body = document.getElementById('support-artist-body');
  title.textContent = 'Soutenir ' + (artistName || 'cet artiste');
  body.innerHTML = '<p style="color:var(--text-dim); font-size:13px;">Chargement…</p>';
  document.getElementById('support-artist-overlay').classList.add('show');

  if(!artistId){
    body.innerHTML = `<p style="color:var(--text-faint); font-size:13px;">Cet artiste n'est pas encore relié à un vrai compte NUNI — le soutien direct n'est pas disponible pour ce profil de démonstration.</p>`;
    return;
  }
  try{
    const res = await fetch(NUNI_API_BASE + '/api/artist/' + artistId + '/support-info');
    const data = await res.json();
    if(!res.ok){ body.innerHTML = `<p style="color:var(--rose-braise); font-size:13px;">${data.error||'Erreur.'}</p>`; return; }
    if(!data.momo_number){
      body.innerHTML = `<p style="color:var(--text-faint); font-size:13px; line-height:1.6;">${data.artist_name} n'a pas encore activé le soutien direct Mobile Money sur son profil.</p>`;
      return;
    }
    body.innerHTML = `
      <div class="pi-sub-card" style="text-align:center; margin-bottom:14px;">
        <div style="font-size:11px; color:var(--text-faint); text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">Numéro Mobile Money</div>
        <div style="font-size:22px; font-weight:700; letter-spacing:1px; color:var(--accent);">${data.momo_number}</div>
      </div>
      <p style="font-size:12.5px; color:var(--text-dim); line-height:1.65;">
        Envoyez le montant de votre choix directement à ce numéro depuis votre application MTN Mobile Money ou Airtel Money, comme un envoi d'argent classique.
        <br><b>NUNI ne traite pas ce paiement et n'y prélève aucune commission</b> — c'est un don direct, volontaire, entre vous et ${data.artist_name}.
      </p>`;
  }catch(e){
    body.innerHTML = `<p style="color:var(--rose-braise); font-size:13px;">Impossible de contacter le serveur NUNI.</p>`;
  }
}
function closeSupportArtistModal(){
  document.getElementById('support-artist-overlay').classList.remove('show');
}

async function saveMomoNumber(){
  const input = document.getElementById('momo-number-input');
  const msg = document.getElementById('momo-save-msg');
  if(!realAuthToken){ msg.innerHTML = '<span style="color:var(--rose-braise)">Connectez-vous avec un vrai compte Artiste.</span>'; return; }
  msg.textContent = 'Enregistrement…';
  try{
    const res = await fetch(NUNI_API_BASE + '/api/artist/momo', {
      method:'PUT', headers:{'Content-Type':'application/json', 'Authorization':'Bearer ' + realAuthToken},
      body: JSON.stringify({ momoNumber: input.value.trim() })
    });
    const data = await res.json();
    if(!res.ok){ msg.innerHTML = '<span style="color:var(--rose-braise)">❌ ' + data.error + '</span>'; return; }
    msg.innerHTML = '<span style="color:#7FC79A">✅ ' + data.message + '</span>';
    toast(data.message);
  }catch(e){ msg.innerHTML = '<span style="color:var(--rose-braise)">❌ Impossible de contacter le serveur NUNI.</span>'; }
}

/* ============ HISTORIQUE RÉEL DES PAIEMENTS (dashboard) ============
   Avant : deux lignes "Mai 2026" / "Juin 2026" codées en dur. Maintenant : calculé en direct
   à partir des vraies écoutes enregistrées pour les morceaux de cet artiste. */
async function loadPaymentsHistory(){
  const tbody = document.getElementById('pay-history-tbody');
  if(!tbody) return;
  if(!realAuthToken){ tbody.innerHTML = '<tr><td colspan="3" style="color:var(--text-faint); font-size:12.5px;">Connectez-vous avec un vrai compte Artiste.</td></tr>'; return; }
  try{
    const res = await fetch(NUNI_API_BASE + '/api/artist/payments-history', { headers:{ 'Authorization':'Bearer ' + realAuthToken } });
    if(!res.ok) return;
    const data = await res.json();
    if(!data.history || !data.history.length){
      tbody.innerHTML = '<tr><td colspan="3" style="color:var(--text-faint); font-size:12.5px;">Aucune écoute enregistrée pour le moment.</td></tr>';
      return;
    }
    const monthNames = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];
    tbody.innerHTML = data.history.map(row=>{
      const [y, m] = row.month.split('-');
      const label = monthNames[Number(m)-1] + ' ' + y;
      return `<tr><td>${label}</td><td class="data">${row.streams.toLocaleString('fr-FR')}</td><td class="data">${row.artist_share_fcfa.toLocaleString('fr-FR')} FCFA</td></tr>`;
    }).join('');
  }catch(e){ /* pas grave si le serveur est momentanément indisponible */ }
}

async function requestVerification(){
  if(!realAuthToken){ toast('Connectez-vous avec un vrai compte pour demander la certification.'); return; }
  try{
    const res = await fetch(NUNI_API_BASE + '/api/verification/request', {
      method:'POST', headers:{'Authorization':'Bearer ' + realAuthToken}
    });
    const data = await res.json();
    if(!res.ok){ toast('❌ ' + (data.error || 'Erreur.')); return; }
    currentUser.verification_status = 'pending';
    toast('✅ ' + data.message);
    openArtistPage(currentUser.artist_name);
  }catch(e){ toast('❌ Impossible de contacter le serveur NUNI.'); }
}

/* ============================================================
   CARTES DE CATÉGORIES — identité premium par genre
   ------------------------------------------------------------
   Chaque catégorie a : sa propre palette, son pictogramme SVG
   dédié (cohérent avec le style d'icônes déjà utilisé ailleurs
   dans NUNI plutôt que copier un style d'illustration différent),
   et une animation d'ambiance très discrète et continue.
   Les micro-interactions (onde au clic, rebond, vibration) réutilisent
   les utilitaires génériques déjà construits pour le lecteur (spawnRipple,
   bounceEl, hapticPing) — une seule logique, plusieurs endroits.
============================================================ */
const genres = [
  { n:'Tout', c1:'#6E45A8', c2:'#3A2A5C', anim:'anim-breathe',
    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 15.2c0-3 2.2-5.2 5.4-5.2 1.1 0 2.1.3 2.9 1L15.4 8l1 .7-1.7 2.1c1 .9 1.6 2.1 1.6 3.5 0 2.9-2.6 5.2-6.4 5.2-3.2 0-6-1.7-6-4.3z"/><circle cx="9.3" cy="10.9" r=".55" fill="currentColor"/></svg>' },
  { n:'Nouveautés', c1:'#C9667A', c2:'#3A1530', anim:'anim-twinkle',
    icon:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.3 6.9h7.2l-5.8 4.3 2.2 6.9L12 16.3l-5.9 4.3 2.2-6.9-5.8-4.3h7.2z"/></svg>' },
  { n:'Top Congo', c1:'#D4AF6A', c2:'#5C3A18', anim:'anim-sheen',
    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M3 18.5h18l-1.5-8.3-4 3.2L12 7l-3.5 6.4-4-3.2z"/><path d="M3 18.5h18" stroke-width="2.4"/></svg>' },
  { n:'Rap', c1:'#1D2550', c2:'#0A0A10', anim:'anim-pulse-ring',
    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="9.3" y="2.5" width="5.4" height="10" rx="2.7"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5v3M9 20.5h6"/></svg>' },
  { n:'Rumba', c1:'#C0392B', c2:'#5C1810', anim:'anim-strum',
    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><ellipse cx="9.5" cy="15" rx="5" ry="4.2"/><path d="M12 4 9.5 11" class="ic-neck"/><path class="ic-string" d="M8 4.6 8.3 12"/><path class="ic-string" d="M10.4 3.6 10 11.4"/></svg>' },
  { n:'Gospel', c1:'#141A38', c2:'#4A2E70', anim:'anim-rise',
    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3v17M6.5 9h11"/></svg>' },
  { n:'Afro', c1:'#1E8449', c2:'#0F3D22', anim:'anim-wave',
    icon:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 2.1c1.9.3 2.5 1.7 3.9 2 1.5.3 1.9 1.5 1.5 2.8-.4 1.2.6 1.9 1 3.1.4 1.2-.6 1.9-.3 3.2.3 1.3-.8 1.9-1.6 2.8-.9 1-.6 2.5-1.9 2.8-1.2.5-1.9-.9-3.2-.6-1.2.3-2.2-.9-2.8-1.9-.6-1-1.9-.6-2.5-1.9-.6-1.1.3-1.9-.3-3.1C2.6 10.4 2 9.4 2.6 8.2 3.2 7 4.5 6.6 4.9 5.4 5.3 4.1 7.4 2.1 11 2.1z"/></svg>' },
  { n:'Hip-Hop', c1:'#6E45A8', c2:'#241542', anim:'anim-bounce',
    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="8.5" width="18" height="10.5" rx="2"/><circle cx="8" cy="13.8" r="2.4"/><circle cx="16" cy="13.8" r="2.4"/><path d="M7 8.5 6 4.5h12l-1 4"/></svg>' },
  { n:'Traditionnel', c1:'#1E8449', c2:'#7A1E14', anim:'anim-glow-pulse',
    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 8.2C5 6.2 8.1 4.7 12 4.7S19 6.2 19 8.2v7.6c0 2-3.1 3.5-7 3.5s-7-1.5-7-3.5z"/><path d="M5 8.2c0 2 3.1 3.5 7 3.5s7-1.5 7-3.5"/></svg>' },
];
const genreGrid = document.getElementById('genre-grid');
genres.forEach((g,i)=>{
  const tile = document.createElement('div');
  tile.className = 'genre-tile' + (i===0 ? ' is-active' : '');
  tile.style.setProperty('--gc1', g.c1);
  tile.style.setProperty('--gc2', g.c2);
  tile.innerHTML = `
    <div class="genre-tile-texture"></div>
    <div class="genre-tile-halo"></div>
    <div class="genre-icon ${g.anim}">${g.icon}</div>
    <span class="gname">${g.n}</span>
    <span class="genre-active-line"></span>`;
  tile.addEventListener('click', (e)=>{
    document.querySelectorAll('.genre-tile').forEach(t=>t.classList.remove('is-active'));
    tile.classList.add('is-active');
    bounceEl(tile.querySelector('.genre-icon'));
    hapticPing();
    filterCatalogByGenre(g.n);
  });
  genreGrid.appendChild(tile);
});

function filterCatalogByGenre(genreName){
  const shelvesWrap = document.getElementById('genre-filtered-shelf');
  const defaultShelves = document.getElementById('default-shelves');

  if(genreName === 'Tout'){
    defaultShelves.style.display = 'block';
    shelvesWrap.style.display = 'none';
    return;
  }

  let filtered;
  let heading;
  if(genreName === 'Nouveautés'){
    filtered = tracks.filter(t=> t.isReal).slice(0, 8);
    heading = 'Nouveautés';
  } else if(genreName === 'Top Congo'){
    filtered = tracks.filter(t=> t.isReal).sort((a,b)=> parseStreamsCount(b.streams) - parseStreamsCount(a.streams)).slice(0, 8);
    heading = 'Top Congo';
  } else {
    filtered = tracks.filter(t => t.genre === genreName && t.isReal);
    heading = genreName;
  }

  defaultShelves.style.display = 'none';
  shelvesWrap.style.display = 'block';
  document.getElementById('genre-filtered-heading').textContent = heading;
  const row = document.getElementById('genre-filtered-row');
  row.innerHTML = '';
  if(!filtered.length){
    row.innerHTML = `<p style="color:var(--text-faint); font-size:13px;">Aucun titre dans ce genre pour le moment.</p>`;
    return;
  }
  filtered = dedupeAlbums(filtered);
  filtered.forEach((tr,i)=>{
    const card = trackCard(tr);
    card.style.animationDelay = (i*0.05) + 's';
    card.classList.add('reveal-in');
    row.appendChild(card);
  });
}

/* ============ NUNI ADS (espace annonceurs) ============ */
let pendingAdImage = null;
function previewAdImage(e){
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    pendingAdImage = reader.result;
    document.getElementById('ad-preview-img').style.backgroundImage = `url(${reader.result})`;
  };
  reader.readAsDataURL(file);
}
function adCard(name, link, img, desc, icon){
  const card = document.createElement('div');
  card.className = 'ad-card';
  card.innerHTML = `
    <div class="ad-img" style="${img ? `background-image:url(${img})` : ''}">${!img && icon ? `<span class="ad-icon">${icon}</span>` : ''}</div>
    <span class="ad-tag">Sponsorisé</span>
    <div class="ad-name">${name}</div>
    ${desc ? `<div class="ad-desc">${desc}</div>` : ''}
    <div class="ad-link">${link}</div>`;
  card.onclick = ()=> toast(`Annonce « ${name} » — lien : ${link}`);
  return card;
}
const adDurationPrices = { '5j': { label:'5 jours', price:500 }, '2s': { label:'2 semaines', price:1000 }, '1m': { label:'1 mois', price:2000 } };
function updateAdPrice(){
  const selected = document.querySelector('input[name="ad-duration"]:checked').value;
  document.getElementById('ad-submit-price').textContent = adDurationPrices[selected].price.toLocaleString('fr-FR') + ' FCFA';
}
function submitAdRequest(){
  const name = document.getElementById('ad-name').value.trim();
  const desc = document.getElementById('ad-desc').value.trim();
  const link = document.getElementById('ad-link').value.trim();
  const contact = document.getElementById('ad-contact').value.trim();
  const selected = document.querySelector('input[name="ad-duration"]:checked').value;
  const duration = adDurationPrices[selected];
  const status = document.getElementById('ad-ai-status');

  if(!name || !link || !contact){
    status.className = 'ai-screen-status flag';
    status.textContent = '⚠️ Merci de renseigner au minimum le nom du produit, un lien et un contact.';
    return;
  }

  document.getElementById('ad-preview-name').textContent = name;
  document.getElementById('ad-preview-link').textContent = link;

  status.className = 'ai-screen-status checking';
  status.innerHTML = '🤖 Assistant IA — vérification de votre demande en cours…';

  setTimeout(()=>{
    // simulation d'une vérification IA basique (authenticité / contenu autorisé)
    const suspicious = /(arme|drogue|escroquerie|contrefaçon)/i.test(name + ' ' + desc);
    if(suspicious){
      status.className = 'ai-screen-status flag';
      status.innerHTML = '🚫 Cette demande ne respecte pas les conditions de NUNI Ads et ne sera pas transmise.';
      toast('Demande refusée par la vérification automatique.');
      return;
    }
    status.className = 'ai-screen-status ok';
    status.innerHTML = `✅ Demande conforme — transmise pour validation à <b>nunimisiki@gmail.com</b><br>
      <span style="color:var(--text-faint)">Formule : ${duration.label} · ${duration.price.toLocaleString('fr-FR')} FCFA · Contact : ${contact}</span><br>
      <span style="color:var(--text-faint)">Vous recevrez une réponse par WhatsApp/email avant toute mise en ligne.</span>`;
    toast(`Demande envoyée à nunimisiki@gmail.com pour validation (${duration.label} — ${duration.price} FCFA).`);
  }, 1400);
}
function seedAds(){
  const row = document.getElementById('ads-row');
  if(!row) return;
  [
    {n:'Café Mboka', l:'wa.me/2426xxxxxxx', d:'Café torréfié artisanal — livraison à Brazzaville', g:'linear-gradient(135deg,#7A4E2A,#D4AF6A)', ic:'☕'},
    {n:'Kin Fashion Store', l:'wa.me/2436xxxxxxx', d:'Vêtements &amp; accessoires — nouvelle collection', g:'linear-gradient(135deg,#C0392B,#6E45A8)', ic:'👗'},
    {n:'Studio Ébène', l:'wa.me/2426xxxxxxx', d:'Location de studio d\'enregistrement à Kinshasa', g:'linear-gradient(135deg,#1E8449,#141A38)', ic:'🎙️'},
  ].forEach(a=>{
    const card = adCard(a.n, a.l, null, a.d, a.ic);
    card.querySelector('.ad-img').style.background = a.g;
    row.appendChild(card);
  });
}
seedAds();

const tracks = [
  {t:'Mokili Ya Sika', a:'Bibi Mwana', p:'pal-1', album:'Envol', genre:'Rumba', year:2026, streams:'412 K', release:'12 Jan 2026', verified:true, likes:18400},
  {t:'Lokito', a:'Ndombe Junior', p:'pal-2', album:'Kin Vibes', genre:'Afro', year:2025, streams:'298 K', release:'03 Sep 2025', verified:true, likes:12750},
  {t:'Ngai Na Yo', a:'Kessy Tina', p:'pal-3', album:'Sango', genre:'Gospel', year:2026, streams:'151 K', release:'20 Fév 2026', verified:false, likes:6320},
  {t:'Nzembo ya Kati', a:'Mbote System', p:'pal-4', album:'Système', genre:'Hip-Hop', year:2025, streams:'87 K', release:'14 Nov 2025', verified:false, likes:3180},
  {t:'Liboso', a:'Les Anges du Rythme', p:'pal-5', album:'Liboso', genre:'Traditionnel', year:2024, streams:'205 K', release:'02 Mai 2024', verified:true, likes:9040},
  {t:'Esengo', a:'Bibi Mwana', p:'pal-6', album:'Envol', genre:'Afro', year:2026, streams:'334 K', release:'12 Jan 2026', verified:true, likes:15200},
  {t:'Boyokani', a:'Tcheza Nation', p:'pal-2', album:'Nation', genre:'Rap', year:2025, streams:'176 K', release:'29 Juin 2025', verified:false, likes:7460},
  {t:'Mabele ya Bapaya', a:'Tcheza Nation', p:'pal-4', album:'Nation', genre:'Rap', year:2025, streams:'142 K', release:'29 Juin 2025', verified:false, likes:6210},
  {t:'Combat Quotidien', a:'Mbote System', p:'pal-1', album:'Système', genre:'Rap', year:2025, streams:'98 K', release:'14 Nov 2025', verified:false, likes:4020},
  {t:'Soki Nakomi', a:'Ndombe Junior', p:'pal-1', album:'Kin Vibes', genre:'Afro', year:2025, streams:'264 K', release:'03 Sep 2025', verified:true, likes:11080},
];
let currentTrack = tracks[0]; // déclaré ici, tout de suite après tracks — trackCard() y fait
                                // référence dès les tout premiers appels à fillShelf() plus bas,
                                // qui plantaient sinon (ReferenceError: accès avant initialisation).
let playing = false; // même raison — trackCard() teste aussi "playing", donc doit exister avant fillShelf()
function formatLikes(n){ return n >= 1000 ? (n/1000).toFixed(1).replace('.0','') + 'K' : n; }
const fans = ['MK','PJ','TN','AL','RB','DS','FC'];
function ensureAlbumViewStyles(){
  if(document.getElementById('album-view-styles')) return;
  const style = document.createElement('style');
  style.id = 'album-view-styles';
  style.textContent = `
    #album-view-overlay{position:fixed; inset:0; z-index:9999; background:#0A0A10; overflow-y:auto; opacity:0; transition:opacity .25s ease;}
    #album-view-overlay.show{opacity:1;}
    .av-hero{position:relative; padding:56px 24px 40px; overflow:hidden;}
    .av-hero-bg{position:absolute; inset:0; background-size:cover; background-position:center; filter:blur(38px) saturate(1.3) brightness(0.5); transform:scale(1.15);}
    .av-hero-fade{position:absolute; inset:0; background:linear-gradient(180deg, rgba(10,10,16,0.15) 0%, #0A0A10 92%);}
    .av-hero-content{position:relative; max-width:760px; margin:0 auto; display:flex; gap:24px; align-items:flex-end; flex-wrap:wrap;}
    .av-cover{width:168px; height:168px; border-radius:14px; background-size:cover; background-position:center; flex-shrink:0; box-shadow:0 18px 40px rgba(0,0,0,0.55); border:1px solid rgba(212,175,106,0.25);}
    .av-badge{display:inline-flex; align-items:center; gap:6px; background:rgba(212,175,106,0.16); backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px); color:#E8C77E; border:1px solid rgba(212,175,106,0.45); font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; padding:4px 10px; border-radius:20px; margin-bottom:10px;}
    .av-title{color:#fff; font-size:30px; font-weight:800; line-height:1.15; margin:0 0 8px;}
    .av-meta{color:#B9C2B4; font-size:13.5px;}
    .av-meta b{color:#E8C77E; font-weight:600; cursor:pointer;}
    .av-actions{max-width:760px; margin:22px auto 0; padding:0 24px; display:flex; gap:14px; align-items:center;}
    .av-play-all{background:linear-gradient(135deg,#1E8449,#0E3D2C); color:#F3E6C8; border:1px solid rgba(212,175,106,0.5); font-weight:700; font-size:14px; padding:12px 26px; border-radius:30px; cursor:pointer; display:flex; align-items:center; gap:8px; transition:transform .15s ease, box-shadow .15s ease;}
    .av-icon-btn{width:44px; height:44px; border-radius:50%; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.14); color:#EDEDED; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background .15s ease, color .15s ease, transform .15s ease;}
    .av-icon-btn:hover{background:rgba(212,175,106,0.18); color:#D4AF6A; transform:translateY(-1px);}
    .av-icon-btn.is-active{background:#D4AF6A; color:#0A0A10; border-color:#D4AF6A;}
    .av-play-all:hover{transform:translateY(-1px); box-shadow:0 8px 22px rgba(212,175,106,0.18);}
    .av-close{position:fixed; top:18px; right:22px; width:38px; height:38px; border-radius:50%; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); color:#fff; font-size:17px; cursor:pointer; z-index:10; display:flex; align-items:center; justify-content:center;}
    .av-close:hover{background:rgba(255,255,255,0.12);}
    .av-list{max-width:760px; margin:26px auto 80px; padding:0 24px;}
    .av-row{display:flex; align-items:center; gap:16px; padding:12px 10px; border-radius:10px; cursor:pointer; transition:background .15s ease;}
    .av-row:hover{background:rgba(212,175,106,0.07);}
    .av-row-num{width:24px; text-align:center; color:#7D8A79; font-size:13px; font-family:var(--font-data, monospace);}
    .av-row:hover .av-row-num{color:#D4AF6A;}
    .av-row-title{flex:1; color:#EDEDED; font-size:14.5px; font-weight:500;}
    .av-row-play{width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#0A0A10; background:#D4AF6A; opacity:0; transition:opacity .15s ease;}
    .av-row:hover .av-row-play{opacity:1;}
    .av-list-panel{background:rgba(255,255,255,0.05); backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:6px; overflow:hidden;}
    .av-row{opacity:0; animation:avRowIn .35s ease forwards;}
    @keyframes avRowIn{ from{opacity:0; transform:translateY(6px);} to{opacity:1; transform:translateY(0);} }
    .av-row.is-playing{background:linear-gradient(90deg, rgba(212,175,106,0.16), transparent);}
    .av-row.is-playing .av-row-title{color:#F3E6C8; font-weight:600;}
    .av-row-dot{width:6px; height:6px; border-radius:50%; background:#D4AF6A; box-shadow:0 0 6px #D4AF6A; margin-left:auto; margin-right:4px;}
  `;
  document.head.appendChild(style);
}
function ensureNavStyles(){
  if(document.getElementById('nuni-nav-styles')) return;
  const style = document.createElement('style');
  style.id = 'nuni-nav-styles';
  style.textContent = `
    .app-nav-link{position:relative; transition:color .25s ease;}
    .app-nav-link.is-active{color:var(--accent, #D4AF6A) !important;}
    .app-nav-link.is-active::after{content:''; position:absolute; left:2px; right:2px; bottom:-9px; height:2px; border-radius:2px; background:var(--accent, #D4AF6A); animation:nuniNavIn .25s ease;}
    .tab-btn{transition:color .2s ease, transform .2s ease;}
    .tab-btn.is-active{color:var(--accent, #D4AF6A) !important; transform:translateY(-1px);}
    @keyframes nuniNavIn{ from{ transform:scaleX(0); opacity:0; } to{ transform:scaleX(1); opacity:1; } }
  `;
  document.head.appendChild(style);
}
ensureNavStyles();
document.addEventListener('click', (e)=>{
  const link = e.target.closest('.app-nav-link[data-app-link="artist"], .tab-btn[data-tab="artist"]');
  if(link && currentUser && currentUser.account_type === 'artist' && currentUser.artist_name){
    e.preventDefault();
    e.stopPropagation();
    openArtistPage(currentUser.artist_name);
  }
}, true);

/* ============ RADIO DÉSACTIVÉE (temporairement, code conservé pour réactivation future) ============ */
// Le mode DJ reste actif. Seule la Radio est retirée de la navigation ; tout son code
// (openTuner, tunerStations, startTunerPlayback, etc.) reste inchangé ci-dessous.
function ensureRadioHiddenFromNav(){
  // Force toute ouverture du tuner à atterrir sur l'onglet DJ, jamais Radio
  const originalOpenTuner = window.openTuner;
  window.openTuner = function(){ return originalOpenTuner('dj'); };

  // Cache le bouton/lien "Ouvrir le tuner" (radio) partout où il apparaît, sans toucher au reste
  document.querySelectorAll('button, a').forEach(el=>{
    const txt = (el.textContent || '').trim().toLowerCase();
    if(txt.includes('ouvrir le tuner')) el.style.display = 'none';
  });
  // Cache l'onglet "Radio" à l'intérieur du sélecteur tuner (si jamais il s'ouvre autrement)
  const radioTab = document.getElementById('tuner-tab-radio');
  if(radioTab) radioTab.style.display = 'none';
  // Cache l'indicateur "radio en direct" sur le lecteur
  const radioBadge = document.getElementById('radio-badge');
  if(radioBadge) radioBadge.style.display = 'none';
}
ensureRadioHiddenFromNav();
setTimeout(ensureRadioHiddenFromNav, 500); // sécurité si certains éléments se rendent un peu après
function ensureBadgeStyles(){
  if(document.getElementById('nuni-badge-styles')) return;
  const style = document.createElement('style');
  style.id = 'nuni-badge-styles';
  style.textContent = `
    .nuni-type-badge{position:absolute; top:8px; left:8px; z-index:2; display:inline-flex; align-items:center; gap:4px; padding:3px 10px; border-radius:20px; background:linear-gradient(135deg,#E8C77E,#B98A3D); color:#241708; font-family:Georgia,'Times New Roman',serif; font-weight:700; font-size:10px; text-transform:uppercase; letter-spacing:1.4px; box-shadow:0 3px 10px rgba(212,175,106,0.4); border:1px solid rgba(255,255,255,0.25);}
  `;
  document.head.appendChild(style);
}
ensureBadgeStyles();
function handleTrackCardClick(tr){
  if(tr.releaseType && tr.releaseType !== 'Single'){ openAlbumView(tr); }
  else { playTrack(tr); }
}
function openAlbumView(tr){
  const albumTracks = tracks.filter(t => t.album === tr.album && t.a === tr.a);
  if(albumTracks.length <= 1){ playTrack(tr); return; } // un seul morceau trouvé : on joue direct par sécurité
  ensureAlbumViewStyles();
  let overlay = document.getElementById('album-view-overlay');
  if(overlay) overlay.remove();
  overlay = document.createElement('div');
  overlay.id = 'album-view-overlay';
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  const coverStyle = tr.cover ? `background-image:url(${tr.cover});` : `background:linear-gradient(135deg,#1E8449,#0E3D2C);`;
  const closeOverlay = ()=>{ overlay.classList.remove('show'); document.body.style.overflow = ''; setTimeout(()=> overlay.remove(), 200); };

  overlay.innerHTML = `
    <button class="av-close" title="Fermer">✕</button>
    <div class="av-hero">
      <div class="av-hero-bg" style="${coverStyle}"></div>
      <div class="av-hero-fade"></div>
      <div class="av-hero-content">
        <div class="av-cover" style="${coverStyle}"></div>
        <div>
          <div class="av-badge">🎵 ${tr.releaseType || 'Album'}</div>
          <div class="av-title">${tr.album}</div>
          <div class="av-meta"><b class="av-artist-link">${tr.a}</b> · ${albumTracks.length} titre${albumTracks.length>1?'s':''} · Sorti ${tr.release ? 'le ' + tr.release : "aujourd'hui"}</div>
        </div>
      </div>
    </div>
    <div class="av-actions">
      <button class="av-play-all"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Tout écouter</button>
      <button class="av-icon-btn av-shuffle-btn" title="Écouter en aléatoire"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h3.5a3 3 0 0 1 2.4 1.2L15 15a3 3 0 0 0 2.4 1.2H20M4 18h3.5a3 3 0 0 0 2.4-1.2l1-1.3M16.5 6H20M16.5 18H20"/><path d="M18 3l3 3-3 3M18 15l3 3-3 3"/></svg></button>
      <button class="av-icon-btn av-fav-btn" title="Ajouter aux favoris"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg></button>
      <button class="av-icon-btn av-download-btn" title="Télécharger"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16"/></svg></button>
    </div>
    <div class="av-list"><div class="av-list-panel"></div></div>
  `;

  overlay.querySelector('.av-close').onclick = closeOverlay;
  overlay.querySelector('.av-artist-link').onclick = ()=>{ closeOverlay(); openArtistPage(tr.a); };
  overlay.querySelector('.av-play-all').onclick = ()=>{ playTrack(albumTracks[0]); closeOverlay(); };
  overlay.querySelector('.av-shuffle-btn').onclick = ()=>{
    const randomTrack = albumTracks[Math.floor(Math.random()*albumTracks.length)];
    playTrack(randomTrack);
    closeOverlay();
    toast('Lecture aléatoire de « ' + tr.album + ' »');
  };
  const favBtn = overlay.querySelector('.av-fav-btn');
  const albumAlreadyFav = albumTracks.every(t => favoritesPlaylist.some(f => f.t === t.t));
  favBtn.classList.toggle('is-active', albumAlreadyFav);
  favBtn.onclick = ()=>{
    const nowFav = !favBtn.classList.contains('is-active');
    favBtn.classList.toggle('is-active', nowFav);
    albumTracks.forEach(t=>{
      const already = favoritesPlaylist.find(f=>f.t===t.t);
      if(nowFav && !already) favoritesPlaylist.unshift(t);
      if(!nowFav && already) favoritesPlaylist = favoritesPlaylist.filter(f=>f.t!==t.t);
    });
    toast(nowFav ? 'Album ajouté à vos favoris.' : 'Album retiré de vos favoris.');
  };
  overlay.querySelector('.av-download-btn').onclick = ()=>{
    let count = 0;
    albumTracks.forEach(t=>{
      if(!t.audioUrl) return;
      const a = document.createElement('a');
      a.href = t.audioUrl;
      a.download = t.t.replace(/[^\w\s-]/g,'') + '.mp3';
      document.body.appendChild(a);
      a.click();
      a.remove();
      count++;
    });
    toast(count ? `Téléchargement de ${count} fichier(s) lancé.` : 'Aucun fichier audio disponible pour le téléchargement.');
  };

  const list = overlay.querySelector('.av-list-panel');
  albumTracks.forEach((t, i)=>{
    const row = document.createElement('div');
    const isPlaying = playing && currentTrack && currentTrack.t === t.t;
    row.className = 'av-row' + (isPlaying ? ' is-playing' : '');
    row.style.animationDelay = (i * 0.05) + 's';
    row.innerHTML = `
      <div class="av-row-num">${isPlaying ? '♪' : i+1}</div>
      <div class="av-row-title">${t.t}</div>
      ${isPlaying ? '<span class="av-row-dot"></span>' : ''}
      <div class="av-row-play"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></div>`;
    row.onclick = ()=>{ playTrack(t); closeOverlay(); };
    list.appendChild(row);
  });

  requestAnimationFrame(()=> overlay.classList.add('show'));
}
function trackKeyOf(tr){ return (tr.t||'') + '|' + (tr.a||''); }
function updateNowPlayingCards(){
  const key = currentTrack ? trackKeyOf(currentTrack) : null;
  document.querySelectorAll('.track-card').forEach(card=>{
    card.classList.toggle('is-now-playing', !!(key && playing && card.dataset.trackKey === key));
  });
}
function trackCard(tr){
  const card = document.createElement('div');
  card.className = 'track-card';
  if(tr.realId) card.dataset.trackId = tr.realId;
  card.dataset.trackKey = trackKeyOf(tr);
  const coverInner = tr.cover
    ? `<div class="cover" style="background-image:url(${tr.cover}); background-size:cover; background-position:center;">`
    : `<div class="cover ${tr.p}"><div class="cover-glyph pal-pattern"></div>`;
  const isMultiTrack = tr.releaseType && tr.releaseType !== 'Single';
  card.innerHTML = `
    ${coverInner}
      ${tr.audioUrl ? '<span class="imported-badge" title="Votre import">Vous</span>' : ''}
      ${isMultiTrack ? `<span class="nuni-type-badge" title="${tr.releaseType}">💿 ${tr.releaseType}</span>` : ''}
      <div class="play-fab">
        <svg viewBox="0 0 24 24" class="play-fab-icon"><path d="M8 5v14l11-7z"/></svg>
        <span class="eq play-fab-eq"><i></i><i></i><i></i></span>
      </div>
    </div>
    <div class="ttl">${tr.t}</div>
    <div class="art" style="cursor:pointer;">${tr.a}</div>
    <div class="likes">🎧 <span>${tr.streams||0}</span> · ♥ <span>${formatLikes(tr.likes||0)}</span></div>`;
  card.querySelector('.cover').onclick = ()=> handleTrackCardClick(tr);
  card.querySelector('.ttl').onclick = ()=> handleTrackCardClick(tr);
  card.querySelector('.art').onclick = (e)=>{ e.stopPropagation(); openArtistPage(tr.a); };
  if(currentTrack && playing && trackKeyOf(currentTrack) === trackKeyOf(tr)) card.classList.add('is-now-playing');
  return card;
}
function dedupeAlbums(list){
  const seen = new Set();
  return list.filter(tr=>{
    if(tr.releaseType && tr.releaseType !== 'Single'){
      const key = tr.a + '::' + tr.album;
      if(seen.has(key)) return false;
      seen.add(key);
    }
    return true;
  });
}
function fillShelf(id, list){
  const row = document.getElementById(id);
  dedupeAlbums(list).forEach((tr,i) => {
    const card = trackCard(tr);
    card.style.animationDelay = (i*0.06) + 's';
    card.classList.add('reveal-in');
    row.appendChild(card);
  });
}
function parseStreamsCount(v){
  if(typeof v === 'number') return v;
  const s = String(v||'0').trim().toUpperCase();
  if(s.endsWith('K')) return Math.round(parseFloat(s) * 1000);
  if(s.endsWith('M')) return Math.round(parseFloat(s) * 1000000);
  return parseInt(s.replace(/[^\d]/g,''), 10) || 0;
}
// "Top Congo" — avant : [...tracks].reverse().slice(0,5), qui ne trie par AUCUN critère réel
// (juste l'ordre inverse du tableau), et mélangeait des morceaux de démo aux streams
// inventés (ex: "264 K") avec les vrais morceaux (streams réels, souvent à 0 pour l'instant).
// Ici : uniquement les VRAIS morceaux, triés par leur vrai nombre de streams, décroissant.
function getTopStreamedTracks(n){
  return tracks
    .filter(t=> t.isReal)
    .slice()
    .sort((a,b)=> parseStreamsCount(b.streams) - parseStreamsCount(a.streams))
    .slice(0, n);
}
function renderTopCongo(){
  const row = document.getElementById('shelf-top');
  if(!row) return;
  row.innerHTML = '';
  const top = getTopStreamedTracks(5);
  if(!top.length){
    row.innerHTML = `<p style="font-size:12.5px; color:var(--text-faint);">Pas encore assez d'écoutes réelles pour établir un classement — revenez bientôt !</p>`;
    return;
  }
  top.forEach(tr=> row.appendChild(trackCard(tr)));
}
fillShelf('shelf-new', tracks.slice(0,5));
renderTopCongo();
fillShelf('shelf-playlists', tracks.slice(2,7));
fillShelf('shelf-artist', tracks.filter(t=>t.a==='Bibi Mwana').concat(tracks.slice(0,4)));
fillShelf('shelf-artist-trending', [...tracks.filter(t=>t.a==='Bibi Mwana')].sort((a,b)=> b.likes - a.likes));
fillShelf('shelf-artist-albums', tracks.filter(t=>t.a==='Bibi Mwana'));

/* ============ VRAIS MORCEAUX PUBLIÉS (serveur NUNI) ============ */
function refreshMainShelves(){
  ['shelf-new','shelf-playlists'].forEach(id=>{
    const row = document.getElementById(id);
    if(row) row.innerHTML = '';
  });
  fillShelf('shelf-new', tracks.slice(0,5));
  renderTopCongo();
  fillShelf('shelf-playlists', tracks.slice(2,7));
}
/* ============ RESYNCHRONISATION DES LIKES APRÈS CONNEXION ============
   Avant : les cœurs (Favoris) vivaient uniquement dans un tableau en mémoire du navigateur,
   remis à zéro à chaque rechargement de page ou changement d'appareil. Maintenant : on va
   chercher la vraie liste des morceaux likés en base au moment de la connexion, et on la
   fusionne avec les morceaux déjà chargés — les cœurs reflètent enfin la vérité serveur,
   partout où vous vous connectez. */
async function syncLikedTracksFromServer(){
  if(!realAuthToken) return;
  try{
    const res = await fetch(NUNI_API_BASE + '/api/me/liked-tracks', { headers:{ 'Authorization':'Bearer ' + realAuthToken } });
    if(!res.ok) return;
    const data = await res.json();
    const likedIds = new Set(data.track_ids || []);
    tracks.forEach(tr=>{
      if(tr.isReal && tr.realId && likedIds.has(tr.realId) && !favoritesPlaylist.find(f=>f.t===tr.t)){
        favoritesPlaylist.unshift(tr);
      }
    });
    syncLikeButtons(currentTrack);
  }catch(e){ /* pas grave si le serveur est momentanément indisponible */ }
}

async function loadArtistStats(){
  const elTotal = document.getElementById('dash-streams-total');
  const elTrend = document.getElementById('dash-streams-trend');
  const elGross = document.getElementById('dash-gross');
  const elPlatform = document.getElementById('dash-platform-share');
  const elArtist = document.getElementById('dash-artist-share');
  if(!elTotal) return;
  if(!realAuthToken){ elTotal.textContent = '—'; return; }
  try{
    const res = await fetch(NUNI_API_BASE + '/api/artist/stats', {
      headers:{ 'Authorization':'Bearer ' + realAuthToken }
    });
    if(!res.ok) return;
    const s = await res.json();
    const fmt = n => Number(n).toLocaleString('fr-FR');
    elTotal.textContent = fmt(s.total_streams);
    elTrend.textContent = `${fmt(s.streams_last_30_days)} sur les 30 derniers jours`;
    elGross.textContent = fmt(s.gross_fcfa) + ' FCFA';
    elPlatform.textContent = '−' + fmt(s.platform_share_fcfa) + ' FCFA';
    elArtist.textContent = fmt(s.artist_share_fcfa) + ' FCFA';
  }catch(e){ /* pas grave si le serveur est momentanément indisponible */ }
}
async function loadRealTracks(){
  try{
    const res = await fetch(NUNI_API_BASE + '/api/tracks');
    if(!res.ok) return;
    const data = await res.json();
    if(!data.tracks || !data.tracks.length) return;
    // retire les vrais morceaux déjà chargés avant de réinjecter (évite les doublons)
    for(let i = tracks.length - 1; i >= 0; i--){ if(tracks[i].isReal) tracks.splice(i, 1); }
    const mapped = data.tracks.map(r => ({
      t: r.title, a: r.artist_name || 'Artiste NUNI', p: 'pal-1',
      album: r.album || r.title, genre: r.genre || 'Afro',
      year: new Date(r.created_at).getFullYear(),
      streams: String(r.streams || 0),
      release: (r.release_date ? new Date(r.release_date) : new Date(r.created_at)).toLocaleDateString('fr-FR', {day:'2-digit', month:'short', year:'numeric'}),
      verified: !!r.is_verified, likes: r.likes || 0,
      cover: r.cover_url || null, audioUrl: r.audio_url || null, isReal: true,
      releaseType: r.release_type || 'Single',
      artistId: r.artist_id,
      lyrics: r.lyrics || null,
      composer: r.composer || null, featuring: r.featuring || null, studio: r.studio || null, description: r.description || null,
      realId: r.id,
    }));
    tracks.unshift(...mapped);
    refreshMainShelves();
  }catch(e){ /* pas grave si le serveur est indisponible, le catalogue de démo reste affiché */ }
}
loadRealTracks();

/* ============ RELEASE CALENDAR ============ */
const releases = [
  {d:'04', m:'Juil', t:'Nzela ya Sika', a:'Bibi Mwana', c:'Dans 4 jours'},
  {d:'09', m:'Juil', t:'Kin la Belle', a:'Tcheza Nation', c:'Dans 9 jours'},
  {d:'16', m:'Juil', t:'Sango Pesi', a:'Kessy Tina', c:'Dans 16 jours'},
  {d:'22', m:'Juil', t:'Mboka Na Biso', a:'Mbote System', c:'Dans 22 jours'},
];
function fillReleaseRow(id, list){
  const row = document.getElementById(id);
  if(!row) return;
  list.forEach(r=>{
    const card = document.createElement('div');
    card.className = 'release-card';
    card.innerHTML = `
      <div class="release-date"><div class="d data">${r.d}</div><div class="m">${r.m}</div></div>
      <div class="release-info"><div class="t">${r.t}</div><div class="a">${r.a}</div><div class="c">${r.c}</div></div>`;
    row.appendChild(card);
  });
}
fillReleaseRow('release-row', releases);
// Le calendrier de la page artiste ('artist-release-row') se remplit désormais dynamiquement
// avec les vraies sorties programmées, dans openArtistPage() — plus de données factices ici.

/* ============ PLAYER LOGIC ============ */
let progressTimer, elapsed = 0, duration = 204; // 3:24
let playbackSpeed = 1, qualityIndex = 1;
let usingRealAudio = false;
const realAudio = new Audio();
realAudio.volume = 0.85;
realAudio.preload = 'auto';
realAudio.addEventListener('loadedmetadata', ()=>{
  if(usingRealAudio && isFinite(realAudio.duration)){ duration = realAudio.duration; updateProgress(); }
});
realAudio.addEventListener('timeupdate', ()=>{
  if(usingRealAudio){ elapsed = realAudio.currentTime; updateProgress(); }
  // Fondu enchaîné façon Apple Music, uniquement en mode DJ : dès qu'il reste moins de
  // DJ_CROSSFADE_SECONDS, on lance la transition — bien avant que le morceau ne se termine
  // vraiment, contrairement à l'ancien comportement (coupure nette à 'ended').
  if(djMode && usingRealAudio && !djCrossfadeTriggered && isFinite(duration) && duration > 0){
    const remaining = duration - elapsed;
    if(remaining > 0 && remaining <= DJ_CROSSFADE_SECONDS){
      djCrossfadeTriggered = true;
      startDjCrossfade();
    }
  }
});
realAudio.addEventListener('ended', ()=>{ if(usingRealAudio) nextTrack(); });
realAudio.addEventListener('error', ()=>{
  if(!usingRealAudio) return;
  const codes = {1:'lecture annulée', 2:'erreur réseau', 3:'fichier illisible (décodage impossible)', 4:'format audio non supporté par le navigateur'};
  const reason = codes[realAudio.error && realAudio.error.code] || 'erreur inconnue';
  toast('Lecture impossible — ' + reason + '. Essayez un fichier MP3 ou WAV.');
});
// Débloque le son : la 1ère interaction de l'utilisateur "amorce" l'élément audio
// pour que les navigateurs autorisent ensuite la lecture programmatique (politique autoplay).
let audioUnlocked = false;
function unlockAudioOnce(){
  if(audioUnlocked) return;
  audioUnlocked = true;
  const silentTry = realAudio.play();
  if(silentTry && silentTry.then){ silentTry.then(()=> realAudio.pause()).catch(()=>{}); }
}
document.addEventListener('click', unlockAudioOnce, {once:true});
document.addEventListener('touchstart', unlockAudioOnce, {once:true});
const qualities = ['Standard', 'Haute qualité', 'Sans perte'];
const palGradients = {
  'pal-1':'linear-gradient(135deg,#6E45A8,#141A38)',
  'pal-2':'linear-gradient(135deg,#D4AF6A,#7A4E2A)',
  'pal-3':'linear-gradient(135deg,#C9667A,#3A1530)',
  'pal-4':'linear-gradient(135deg,#1D2550,#0A0A10)',
  'pal-5':'linear-gradient(135deg,#8E63C9,#D4AF6A)',
  'pal-6':'linear-gradient(135deg,#2E7D6B,#0F2D27)',
};

/* ============================================================
   NuniPalette — utilitaire réutilisable d'extraction de couleurs
   ------------------------------------------------------------
   Objectif : à partir d'une image de pochette, produire une palette
   de 5 couleurs harmonieuses (dominante, secondaire, accent, sombre,
   claire) utilisables pour n'importe quel composant NUNI : lecteur
   plein écran aujourd'hui, mini-lecteur / cartes album / pages
   artiste / playlists plus tard.

   - Chaque palette est mise en cache par URL d'image : une pochette
     n'est jamais analysée deux fois.
   - Le calcul se fait sur une image réduite à 40×40 pixels : coût
     CPU négligeable, même sur un appareil modeste.
   - Si l'image ne peut pas être lue (restriction de sécurité CORS,
     pochette absente), une palette de secours cohérente avec
     l'identité NUNI est renvoyée à la place — jamais d'erreur visible.
   - Les niveaux de luminosité de la couleur "sombre" sont bornés
     pour rester lisibles avec du texte clair par-dessus (accessibilité).
============================================================ */
const NuniPalette = (function(){
  const cache = new Map();
  const FALLBACK = {
    dominant:'hsl(262, 45%, 40%)', secondary:'hsl(230, 40%, 18%)',
    accent:'hsl(38, 65%, 62%)', dark:'hsl(250, 35%, 11%)', light:'hsl(38, 40%, 72%)'
  };

  function clamp(v, min, max){ return Math.min(max, Math.max(min, v)); }

  function rgbToHsl(r, g, b){
    r/=255; g/=255; b/=255;
    const max=Math.max(r,g,b), min=Math.min(r,g,b);
    let h, s, l=(max+min)/2;
    if(max===min){ h=0; s=0; }
    else{
      const d = max-min;
      s = l>0.5 ? d/(2-max-min) : d/(max+min);
      switch(max){
        case r: h=(g-b)/d+(g<b?6:0); break;
        case g: h=(b-r)/d+2; break;
        default: h=(r-g)/d+4;
      }
      h/=6;
    }
    return [h*360, s, l];
  }
  function hslCss(h, s, l){ return `hsl(${Math.round(h)}, ${Math.round(clamp(s,0,1)*100)}%, ${Math.round(clamp(l,0,1)*100)}%)`; }

  // Analyse les pixels d'une image (réduite à 40x40) et regroupe les couleurs proches en "buckets"
  function quantize(img){
    const size = 40;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d', { willReadFrequently:true });
    ctx.drawImage(img, 0, 0, size, size);
    let data;
    try{ data = ctx.getImageData(0, 0, size, size).data; }
    catch(e){ return null; } // image protégée (CORS) : on utilisera la palette de secours

    const buckets = new Map();
    for(let i=0;i<data.length;i+=4){
      const r=data[i], g=data[i+1], b=data[i+2], a=data[i+3];
      if(a<80) continue;
      const lum = 0.299*r + 0.587*g + 0.114*b;
      if(lum<14 || lum>246) continue; // ignore les noirs/blancs quasi purs (peu utiles pour un dégradé)
      const key = Math.round(r/24)+','+Math.round(g/24)+','+Math.round(b/24);
      const entry = buckets.get(key);
      if(entry) entry.count++; else buckets.set(key, {r,g,b,count:1});
    }
    const sorted = [...buckets.values()].sort((a,b)=> b.count - a.count);
    return sorted.length ? sorted : null;
  }

  function buildPalette(sorted){
    const dominant = sorted[0];
    const [dh] = rgbToHsl(dominant.r, dominant.g, dominant.b);
    // Couleur secondaire : la plus fréquente qui soit visuellement distincte de la dominante
    const secondary = sorted.find(c=>{
      const [h] = rgbToHsl(c.r, c.g, c.b);
      const dist = Math.abs(c.r-dominant.r) + Math.abs(c.g-dominant.g) + Math.abs(c.b-dominant.b);
      return Math.abs(h-dh) > 20 || dist > 90;
    }) || sorted[Math.min(1, sorted.length-1)];
    // Couleur accent : la plus saturée parmi les couleurs fréquentes
    const accent = sorted.slice(0, 12).sort((a,b)=> rgbToHsl(b.r,b.g,b.b)[1] - rgbToHsl(a.r,a.g,a.b)[1])[0] || dominant;

    const [dh2, ds2, dl2] = rgbToHsl(dominant.r, dominant.g, dominant.b);
    const [sh2, ss2, sl2] = rgbToHsl(secondary.r, secondary.g, secondary.b);
    const [ah2, as2, al2] = rgbToHsl(accent.r, accent.g, accent.b);

    return {
      dominant: hslCss(dh2, clamp(ds2, 0.35, 0.75), clamp(dl2, 0.26, 0.48)),
      secondary: hslCss(sh2, clamp(ss2, 0.28, 0.7), clamp(sl2, 0.16, 0.4)),
      accent: hslCss(ah2, clamp(as2, 0.45, 0.85), clamp(al2, 0.45, 0.66)),
      // "sombre" bornée entre 8% et 20% de luminosité : garantit un fond assez foncé
      // pour que le texte clair du lecteur reste toujours lisible par-dessus (accessibilité)
      dark: hslCss(dh2, clamp(ds2, 0.3, 0.55), clamp(Math.min(dl2, 0.2), 0.08, 0.2)),
      light: hslCss(dh2, clamp(ds2*0.55, 0.08, 0.35), clamp(Math.max(dl2, 0.68), 0.6, 0.8)),
    };
  }

  // Garde-fou mémoire : au-delà de cette taille (~1,8 Mo réels), on n'analyse pas l'image en direct.
  // Une photo de téléphone non compressée peut peser plusieurs Mo une fois décodée en mémoire ;
  // l'analyser en plus de son affichage normal peut faire planter l'onglet sur un appareil modeste.
  // Dans ce cas, la palette de secours est utilisée à la place — jamais de risque de plantage.
  const MAX_ANALYZABLE_LENGTH = 2500000;

  function extract(imageUrl){
    if(!imageUrl) return Promise.resolve(FALLBACK);
    if(cache.has(imageUrl)) return Promise.resolve(cache.get(imageUrl)); // déjà calculée : aucun recalcul
    if(typeof imageUrl === 'string' && imageUrl.length > MAX_ANALYZABLE_LENGTH){
      cache.set(imageUrl, FALLBACK);
      return Promise.resolve(FALLBACK);
    }
    return new Promise((resolve)=>{
      const finish = (palette)=>{ cache.set(imageUrl, palette); resolve(palette); };
      const legacyDecode = ()=>{
        // Repli pour navigateurs plus anciens ou en cas d'échec de la méthode économe ci-dessous
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = ()=>{ const sorted = quantize(img); finish(sorted ? buildPalette(sorted) : FALLBACK); };
        img.onerror = ()=> finish(FALLBACK);
        img.src = imageUrl;
      };
      if(!('createImageBitmap' in window)){ legacyDecode(); return; }
      fetch(imageUrl)
        .then(r=> r.blob())
        .then(blob=> createImageBitmap(blob, { resizeWidth:40, resizeHeight:40, resizeQuality:'low' }))
        .then(bitmap=>{
          const sorted = quantize(bitmap);
          if(bitmap.close) bitmap.close(); // libère immédiatement la mémoire du bitmap, pas d'attente du ramasse-miettes
          finish(sorted ? buildPalette(sorted) : FALLBACK);
        })
        .catch(legacyDecode);
    });
  }

  function forPaletteClass(palClass){
    // Palette de secours pour les pochettes générées (pal-1 à pal-6), cohérente avec leurs dégradés existants
    const map = {
      'pal-1': { dominant:'#6E45A8', secondary:'#141A38', accent:'#A98AD6', dark:'#141A38', light:'#A98AD6' },
      'pal-2': { dominant:'#D4AF6A', secondary:'#7A4E2A', accent:'#E8C77E', dark:'#3D2712', light:'#F2DDA8' },
      'pal-3': { dominant:'#C9667A', secondary:'#3A1530', accent:'#E497A8', dark:'#2A0F22', light:'#E9AFBC' },
      'pal-4': { dominant:'#1D2550', secondary:'#0A0A10', accent:'#8E63C9', dark:'#0A0A10', light:'#A98AD6' },
      'pal-5': { dominant:'#8E63C9', secondary:'#D4AF6A', accent:'#E8C77E', dark:'#2A1D40', light:'#F2DDA8' },
      'pal-6': { dominant:'#2E7D6B', secondary:'#0F2D27', accent:'#5FBBA0', dark:'#0F2D27', light:'#9FDFCC' },
    };
    return map[palClass] || FALLBACK;
  }

  function toGradientCss(palette, angle){
    return `linear-gradient(${angle || 135}deg, ${palette.dominant} 0%, ${palette.secondary} 100%)`;
  }

  return { extract, forPaletteClass, toGradientCss, FALLBACK };
})();

function fmt(s){ const m = Math.floor(s/60); const sec = String(Math.floor(s%60)).padStart(2,'0'); return `${m}:${sec}`; }

function applyCoverTo(el, tr){
  if(tr.cover){
    el.className = 'cover player-cover';
    el.style.backgroundImage = `url(${tr.cover})`;
    el.innerHTML = '';
  } else {
    el.style.backgroundImage = '';
    el.className = 'cover player-cover ' + tr.p;
    el.innerHTML = '<div class="cover-glyph pal-pattern"></div>';
  }
}

let listeningHistory = [];
let favoritesPlaylist = [];
function playTrack(tr){
  // Un morceau change (manuellement, ou via le crossfade lui-même) : on annule tout
  // fondu enchaîné encore en cours pour ne jamais superposer deux transitions.
  if(djFadeTimer){ clearInterval(djFadeTimer); djFadeTimer = null; }
  if(djFadeAudio){ djFadeAudio.pause(); }
  djCrossfadeTriggered = false;

  currentTrack = tr;
  document.getElementById('player-title').textContent = tr.t;
  document.getElementById('player-artist').textContent = tr.a;
  applyCoverTo(document.getElementById('player-cover'), tr);
  syncLikeButtons(tr);
  realAudio.volume = userVolume; // garantit un volume normal, même si un ducking DJ précédent n'a pas été restauré proprement

  // Petit mouvement de tête / pulsation des sourcils de l'avatar DJ à chaque changement de
  // morceau — seulement en mode DJ, là où l'avatar est visible et connecté.
  if(djMode && djAvatarInstance) djAvatarInstance.triggerTransition();
  if(djMode) djSpeak(false);

  listeningHistory.unshift({ track: tr, at: Date.now() });
  listeningHistory = listeningHistory.slice(0, 60);

  // Enregistre une vraie écoute (pour les statistiques et revenus de l'artiste) — jamais bloquant.
  if(tr.isReal && tr.realId){
    fetch(NUNI_API_BASE + '/api/tracks/' + tr.realId + '/play', {
      method:'POST',
      headers: realAuthToken ? {'Authorization':'Bearer ' + realAuthToken} : {}
    }).then(r=> r.json()).then(data=>{
      if(typeof data.streams === 'number'){
        tr.streams = String(data.streams);
        document.querySelectorAll('.track-card').forEach(card=>{
          if(card.dataset.trackId === String(tr.realId)){
            const streamsSpan = card.querySelector('.likes span');
            if(streamsSpan) streamsSpan.textContent = data.streams;
          }
        });
      }
    }).catch(()=>{});
  }

  clearInterval(progressTimer);
  realAudio.pause();
  usingRealAudio = !!tr.audioUrl;
  elapsed = 0;
  duration = 204;
  if(usingRealAudio){
    realAudio.src = tr.audioUrl;
    realAudio.currentTime = 0;
  }
  updateProgress();
  syncFullPlayer();
  playing = false;
  togglePlay();
}
function togglePlay(){
  playing = !playing;
  document.documentElement.classList.toggle('is-playing', playing);
  updateNowPlayingCards();
  const iconPath = playing
    ? '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>'
    : '<path d="M8 5v14l11-7z"/>';
  document.getElementById('play-icon').innerHTML = iconPath;
  const fpIcon = document.getElementById('fp-play-icon');
  if(fpIcon) fpIcon.innerHTML = iconPath;
  if(usingRealAudio){
    if(playing) realAudio.play().catch(err => toast('Le navigateur a bloqué la lecture automatique — appuyez sur ▶ pour lancer le son manuellement.')); else realAudio.pause();
    return;
  }
  if(playing){
    progressTimer = setInterval(()=>{
      elapsed += 1;
      if(elapsed >= duration){ nextTrack(); return; }
      updateProgress();
    }, 1000);
  } else {
    clearInterval(progressTimer);
  }
}
function updateProgress(){
  document.getElementById('time-elapsed').textContent = fmt(elapsed);
  document.getElementById('time-total').textContent = fmt(duration);
  document.getElementById('progress-fill').style.width = (elapsed/duration*100) + '%';
  const fpFill = document.getElementById('fp-progress-fill');
  if(fpFill){
    fpFill.style.width = (elapsed/duration*100) + '%';
    document.getElementById('fp-time-elapsed').textContent = fmt(elapsed);
    document.getElementById('fp-time-total').textContent = fmt(duration);
  }
  updateLyricsHighlight();
  updateFpRemainingPill();
}
/* ============ MICRO-INTERACTIONS RÉUTILISABLES (ondes, rebonds, pulsations, haptique) ============ */
function spawnRipple(e, el){
  const rect = el.getBoundingClientRect();
  const x = (e.clientX ?? (rect.left + rect.width/2)) - rect.left;
  const y = (e.clientY ?? (rect.top + rect.height/2)) - rect.top;
  const span = document.createElement('span');
  span.className = 'nuni-ripple';
  span.style.setProperty('--rx', x + 'px');
  span.style.setProperty('--ry', y + 'px');
  el.appendChild(span);
  setTimeout(()=> span.remove(), 600);
}
document.addEventListener('click', (e)=>{
  const el = e.target.closest('.btn-icon, .fp-pill, .player-controls button, .artist-suggest-card button, #follow-btn, .genre-tile');
  if(el) spawnRipple(e, el);
}, true);
function bounceEl(el){ el.classList.remove('is-bouncing'); void el.offsetWidth; el.classList.add('is-bouncing'); setTimeout(()=> el.classList.remove('is-bouncing'), 520); }
function pulseEl(el){ el.classList.remove('is-pulsing'); void el.offsetWidth; el.classList.add('is-pulsing'); setTimeout(()=> el.classList.remove('is-pulsing'), 440); }
function hapticPing(){ if(navigator.vibrate){ try{ navigator.vibrate(12); }catch(e){} } }
function spawnFlyPing(fromEl, emoji){
  const rect = fromEl.getBoundingClientRect();
  const span = document.createElement('span');
  span.className = 'fp-fly-ping';
  span.textContent = emoji;
  span.style.left = (rect.left + rect.width/2) + 'px';
  span.style.top = (rect.top + rect.height/2) + 'px';
  document.body.appendChild(span);
  setTimeout(()=> span.remove(), 850);
}

function seek(e){
  const rect = e.currentTarget.getBoundingClientRect();
  const pct = (e.clientX - rect.left) / rect.width;
  elapsed = Math.max(0, Math.min(duration, pct*duration));
  if(usingRealAudio) realAudio.currentTime = elapsed;
  updateProgress();
}
/* Barre de progression interactive : grossit au survol, affiche une pastille de temps, se laisse "scrubber" */
function setupFpProgressScrub(){
  const track = document.getElementById('fp-progress-track');
  const tip = document.getElementById('fp-scrub-tip');
  if(!track || !tip) return;
  let dragging = false;
  const posToTime = (clientX)=>{
    const rect = track.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return { pct, time: pct * duration };
  };
  const showTip = (clientX)=>{
    const { pct, time } = posToTime(clientX);
    tip.textContent = fmt(time);
    tip.style.left = (pct*100) + '%';
    tip.classList.add('show');
  };
  track.addEventListener('mousemove', (e)=>{ if(!dragging) showTip(e.clientX); });
  track.addEventListener('mouseleave', ()=>{ if(!dragging) tip.classList.remove('show'); });
  track.addEventListener('mousedown', (e)=>{
    dragging = true;
    track.classList.add('is-scrubbing');
    showTip(e.clientX);
    const { time } = posToTime(e.clientX);
    elapsed = Math.max(0, Math.min(duration, time));
    if(usingRealAudio) realAudio.currentTime = elapsed;
    updateProgress();
  });
  window.addEventListener('mousemove', (e)=>{
    if(!dragging) return;
    showTip(e.clientX);
    const { time } = posToTime(e.clientX);
    elapsed = Math.max(0, Math.min(duration, time));
    if(usingRealAudio) realAudio.currentTime = elapsed;
    updateProgress();
  });
  window.addEventListener('mouseup', ()=>{
    if(!dragging) return;
    dragging = false;
    track.classList.remove('is-scrubbing');
    tip.classList.remove('show');
  });
}
setupFpProgressScrub();
let userVolume = 0.85; // vrai niveau voulu par la personne — jamais écrasé par le ducking du DJ
function setVolume(e){
  const rect = e.currentTarget.getBoundingClientRect();
  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  document.querySelectorAll('#volume-fill, #volume-fill-fp').forEach(v=> v.style.width = (pct*100) + '%');
  realAudio.volume = pct;
  userVolume = pct;
}
let genreRadioFilter = null;
function getCurrentPlaybackPool(){
  return genreRadioFilter ? tracks.filter(t=>t.genre===genreRadioFilter) : tracks;
}
// En mode DJ, avance dans la vraie file mélangée de l'ambiance choisie (djQueue) plutôt que
// dans le catalogue entier — avant, dès le 2e morceau, le DJ "oubliait" son ambiance et
// repassait sur n'importe quel morceau du catalogue, dans l'ordre brut. Quand la file est
// épuisée, elle est re-mélangée pour continuer indéfiniment sans jamais se répéter à
// l'identique d'un tour à l'autre (et sans recoller le dernier morceau joué au premier du tour suivant).
function djAdvanceQueue(){
  djQueuePos++;
  if(djQueuePos >= djQueue.length){
    const m = djModes.find(x=>x.id===djModeId);
    const last = djQueue[djQueue.length-1];
    const reshuffled = m.filter();
    if(reshuffled.length > 1 && reshuffled[0].t === last.t && reshuffled[0].a === last.a){
      reshuffled.push(reshuffled.shift());
    }
    djQueue = reshuffled;
    djQueuePos = 0;
  }
  return djQueue[djQueuePos];
}
function nextTrack(){
  if(djMode && djQueue.length){
    playTrack(djAdvanceQueue());
    return;
  }
  const pool = getCurrentPlaybackPool();
  const i = pool.findIndex(t=>t.t===currentTrack.t);
  playTrack(pool[(i+1) % pool.length] || pool[0]);
}
function prevTrack(){
  if(djMode && djQueue.length){
    djQueuePos = (djQueuePos - 1 + djQueue.length) % djQueue.length;
    playTrack(djQueue[djQueuePos]);
    return;
  }
  const pool = getCurrentPlaybackPool();
  const i = pool.findIndex(t=>t.t===currentTrack.t);
  playTrack(pool[(i-1+pool.length) % pool.length] || pool[0]);
}
function syncLikeButtons(tr){
  const isLiked = favoritesPlaylist.some(f=> f.t === tr.t);
  document.querySelectorAll('#player-like-btn, #fp-like-btn').forEach(b=> b.classList.toggle('liked', isLiked));
}
async function toggleLike(btn){
  bounceEl(btn);
  hapticPing();

  // Morceau réel + compte connecté : vrai like persisté en base, partagé entre tous vos
  // appareils. Avant, ceci ne touchait jamais le serveur — un simple tableau en mémoire,
  // remis à zéro à chaque rechargement de page.
  if(currentTrack.isReal && currentTrack.realId && realAuthToken){
    btn.disabled = true;
    try{
      const res = await fetch(NUNI_API_BASE + '/api/tracks/' + currentTrack.realId + '/like', {
        method:'POST', headers:{ 'Authorization':'Bearer ' + realAuthToken }
      });
      const data = await res.json();
      btn.disabled = false;
      if(!res.ok){ toast('❌ ' + (data.error || 'Erreur.')); return; }
      currentTrack.likes = data.likes;
      if(data.liked){
        if(!favoritesPlaylist.find(t=>t.t===currentTrack.t)) favoritesPlaylist.unshift(currentTrack);
        spawnFlyPing(btn, '❤️');
      } else {
        favoritesPlaylist = favoritesPlaylist.filter(t=>t.t!==currentTrack.t);
      }
      syncLikeButtons(currentTrack);
      document.querySelectorAll('.track-card').forEach(card=>{
        if(card.dataset.trackId === String(currentTrack.realId)){
          const likeSpans = card.querySelectorAll('.likes span');
          if(likeSpans[1]) likeSpans[1].textContent = formatLikes(data.likes);
        }
      });
      toast(data.liked ? 'Ajouté à votre playlist Favoris — visible dans Bibliothèque.' : 'Retiré de votre playlist Favoris.');
    }catch(e){
      btn.disabled = false;
      toast('❌ Impossible de contacter le serveur NUNI.');
    }
    return;
  }

  // Morceau de démonstration, ou visiteur non connecté : comportement local uniquement,
  // comme avant (pas de vrai compte pour rattacher un like persistant).
  const willLike = !btn.classList.contains('liked');
  if(willLike){
    if(!favoritesPlaylist.find(t=>t.t===currentTrack.t)) favoritesPlaylist.unshift(currentTrack);
    spawnFlyPing(btn, '❤️');
  } else {
    favoritesPlaylist = favoritesPlaylist.filter(t=>t.t!==currentTrack.t);
  }
  syncLikeButtons(currentTrack);
  toast(willLike ? 'Ajouté à votre playlist Favoris — visible dans Bibliothèque.' : 'Retiré de votre playlist Favoris.');
}
function shuffleToggle(btn){
  const activating = !btn.style.color;
  btn.style.color = activating ? 'var(--accent)' : '';
  if(activating){ pulseEl(btn); hapticPing(); }
}
function repeatToggle(btn){
  const activating = !btn.style.color;
  btn.style.color = activating ? 'var(--accent)' : '';
  if(activating){ pulseEl(btn); hapticPing(); }
}
function toggleFollow(btn){
  const following = btn.textContent.trim() === 'Suivi ✓';
  bounceEl(btn);
  if(currentArtistPageRealId && realAuthToken){
    btn.disabled = true;
    fetch(NUNI_API_BASE + '/api/follow', {
      method:'POST', headers:{'Content-Type':'application/json', 'Authorization':'Bearer ' + realAuthToken},
      body: JSON.stringify({ artistId: currentArtistPageRealId })
    }).then(r=>r.json()).then(data=>{
      btn.disabled = false;
      if(data.error){ toast('❌ ' + data.error); return; }
      btn.textContent = data.following ? 'Suivi ✓' : 'Suivre';
      if(data.following) hapticPing();
      // Le compteur de followers affiché sur le profil se met à jour tout de suite, sans
      // attendre un rechargement — avant, ce chiffre renvoyé par le serveur était ignoré.
      const statFollowersEl = document.getElementById('artist-stat-followers');
      if(statFollowersEl && typeof data.followersCount === 'number') statFollowersEl.textContent = data.followersCount.toLocaleString('fr-FR');
      toast(data.following ? 'Vous suivez maintenant cet artiste.' : 'Vous ne suivez plus cet artiste.');
    }).catch(()=>{ btn.disabled = false; toast('❌ Impossible de contacter le serveur NUNI.'); });
    return;
  }
  btn.textContent = following ? 'Suivre' : 'Suivi ✓';
  toast(following ? 'Vous ne suivez plus Bibi Mwana.' : 'Vous suivez maintenant Bibi Mwana.');
}
function toggleRevenuePrivacy(){
  const btn = document.getElementById('privacy-toggle');
  const hidden = !btn.classList.contains('is-on');
  btn.classList.toggle('is-on', hidden);
  document.querySelectorAll('.revenue-figure .val').forEach(v=> v.classList.toggle('is-hidden', hidden));
  toast(hidden ? 'Vos revenus sont désormais masqués sur votre profil public.' : 'Vos revenus sont de nouveau visibles.');
}

/* ============ IMPORT FICHIERS (musique & photos) ============ */
let currentReleaseType = 'Single';
function setReleaseType(btn){
  document.querySelectorAll('.rt-btn').forEach(b=> b.classList.remove('is-active'));
  btn.classList.add('is-active');
  currentReleaseType = btn.dataset.type;
  document.getElementById('release-type-echo').textContent = currentReleaseType.toLowerCase();
}
let pendingCoverFile = null;
function handleReleaseCover(e){
  const file = e.target.files[0];
  if(!file) return;
  pendingCoverFile = file;
  const reader = new FileReader();
  reader.onload = ()=>{
    const preview = document.getElementById('release-cover-preview');
    preview.style.backgroundImage = `url(${reader.result})`;
    preview.innerHTML = '';
    toast(`Pochette sélectionnée pour votre ${currentReleaseType.toLowerCase()}.`);
  };
  reader.readAsDataURL(file); // uniquement pour l'aperçu visuel — le vrai fichier est gardé dans pendingCoverFile
  e.target.value = '';
}

/* ============ UPLOAD DIRECT NAVIGATEUR → CLOUDINARY ============
   Les gros fichiers (audio, vidéo) partent DIRECTEMENT vers Cloudinary depuis le navigateur,
   sans jamais être convertis en base64 ni transiter par notre serveur. Ça évite les plantages
   "Out of Memory" sur les fichiers volumineux (WAV, FLAC, clips de plusieurs dizaines de Mo).
   Le serveur ne fournit qu'une signature temporaire, sans jamais exposer de clé secrète. */
async function uploadFileToCloudinary(file, resourceType, onProgress){
  if(!realAuthToken) throw new Error('Connectez-vous pour publier un fichier.');
  const sigRes = await fetch(NUNI_API_BASE + '/api/upload-signature', {
    headers: { 'Authorization': 'Bearer ' + realAuthToken }
  });
  if(!sigRes.ok){
    const err = await sigRes.json().catch(()=>({}));
    throw new Error(err.error || 'Impossible d\'obtenir une autorisation d\'envoi.');
  }
  const sig = await sigRes.json();

  const form = new FormData();
  form.append('file', file);
  form.append('api_key', sig.apiKey);
  form.append('timestamp', sig.timestamp);
  form.append('signature', sig.signature);
  form.append('folder', sig.folder);

  return new Promise((resolve, reject)=>{
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${sig.cloudName}/${resourceType}/upload`);
    xhr.upload.onprogress = (e)=>{
      if(onProgress && e.lengthComputable) onProgress(Math.round((e.loaded/e.total)*100));
    };
    xhr.onload = ()=>{
      if(xhr.status >= 200 && xhr.status < 300){
        try{ resolve(JSON.parse(xhr.responseText).secure_url); }
        catch(err){ reject(new Error('Réponse Cloudinary illisible.')); }
      } else {
        reject(new Error('Envoi refusé par Cloudinary (statut ' + xhr.status + ').'));
      }
    };
    xhr.onerror = ()=> reject(new Error('Connexion à Cloudinary impossible.'));
    xhr.send(form);
  });
}

/* ============ CLIPS — publication + système aléatoire ============ */
let clips = [];
let pendingClipVideoFile = null;
let pendingClipThumbFile = null;
function handleClipThumb(e){
  const file = e.target.files[0];
  if(!file) return;
  pendingClipThumbFile = file;
  const reader = new FileReader();
  reader.onload = ()=>{
    const preview = document.getElementById('clip-thumb-preview');
    preview.style.backgroundImage = `url(${reader.result})`;
    preview.innerHTML = '';
  };
  reader.readAsDataURL(file); // uniquement pour l'aperçu visuel
  e.target.value = '';
}
function handleClipVideo(e){
  const file = e.target.files[0];
  if(!file) return;
  pendingClipVideoFile = file;
  const status = document.getElementById('clip-upload-status');
  const sizeMb = (file.size / (1024*1024)).toFixed(1);
  status.innerHTML = `<div class="upload-item"><div class="ui-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 10l5-3v10l-5-3M4 6h11a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"/></svg></div><div class="ui-info"><div class="ui-name">${file.name} (${sizeMb} Mo)</div></div><div class="ui-status" style="color:var(--accent)">Prêt à publier</div></div>`;
  if(!document.getElementById('clip-title-input').value) document.getElementById('clip-title-input').value = file.name.replace(/\.[^/.]+$/, '');
}
async function publishClip(){
  const title = document.getElementById('clip-title-input').value.trim();
  const thumbPreview = document.getElementById('clip-thumb-preview');
  const thumbData = thumbPreview.style.backgroundImage;
  const hasThumb = thumbData && thumbData !== '';
  if(!pendingClipVideoFile){ toast('Importez un fichier vidéo avant de publier.'); return; }
  if(!title){ toast('Donnez un titre à votre clip avant de publier.'); return; }
  if(!hasThumb || !pendingClipThumbFile){ toast('Choisissez une miniature avant de publier.'); return; }

  const thumbPreviewUrl = thumbData.slice(5, -2); // aperçu local immédiat, en attendant l'envoi réel
  const artistDisplayName = (currentUser && currentUser.artist_name) ? currentUser.artist_name : 'Bibi Mwana';
  const localVideoUrl = URL.createObjectURL(pendingClipVideoFile);
  const newClip = {
    id: 'clip_' + Date.now(), title, artist: artistDisplayName, thumb: thumbPreviewUrl,
    videoUrl: localVideoUrl, views: 0,
    likes: 0, date: new Date().toLocaleDateString('fr-FR', {day:'2-digit', month:'short'}), dur:'—:—'
  };
  clips.unshift(newClip);
  renderClips();
  renderArtistClips(artistDisplayName);

  const videoFile = pendingClipVideoFile;
  const thumbFile = pendingClipThumbFile;
  document.getElementById('clip-title-input').value = '';
  document.getElementById('clip-upload-status').innerHTML = '';
  pendingClipVideoFile = null;
  pendingClipThumbFile = null;
  thumbPreview.style.backgroundImage = '';
  thumbPreview.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 16l4.5-4.5a2 2 0 0 1 2.8 0L16 16M14 14l1.5-1.5a2 2 0 0 1 2.8 0L20 14M4 6h16v12H4z"/></svg>';

  // Envoi réel au serveur NUNI, pour que le clip soit visible par tous les auditeurs
  if(!realAuthToken){
    toast(`Clip "${title}" visible uniquement dans votre navigateur (connectez-vous pour le partager avec tous).`);
    return;
  }
  toast(`Clip "${title}" — envoi vers Cloudinary en cours…`);
  try{
    const [thumbUrl, videoUrl] = await Promise.all([
      uploadFileToCloudinary(thumbFile, 'image'),
      uploadFileToCloudinary(videoFile, 'video'),
    ]);
    const res = await fetch(NUNI_API_BASE + '/api/clips', {
      method:'POST',
      headers:{'Content-Type':'application/json', 'Authorization':'Bearer ' + realAuthToken},
      body: JSON.stringify({ title, thumbUrl, videoUrl })
    });
    if(res.ok){
      toast(`Clip "${title}" bien envoyé sur le serveur NUNI — visible par tous les auditeurs.`);
      loadRealClips();
    } else {
      const err = await res.json().catch(()=>({}));
      toast(`❌ Le clip n'a pas pu être envoyé au serveur : ${err.error || 'erreur inconnue'}. Il reste visible uniquement dans votre navigateur.`);
    }
  }catch(e){
    toast('❌ Impossible de contacter le serveur — le clip reste visible uniquement dans votre navigateur (vidéo peut-être trop lourde).');
  }
}
function ensureClipWatchStyles(){
  if(document.getElementById('nuni-clipwatch-styles')) return;
  const style = document.createElement('style');
  style.id = 'nuni-clipwatch-styles';
  style.textContent = `
    #clip-watch-overlay{position:fixed; inset:0; z-index:9999; background:#0A0A10; overflow-y:auto; opacity:0; transition:opacity .25s ease;}
    #clip-watch-overlay.show{opacity:1;}
    .cw-close{position:fixed; top:18px; right:22px; width:38px; height:38px; border-radius:50%; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.14); color:#fff; font-size:17px; cursor:pointer; z-index:10; display:flex; align-items:center; justify-content:center;}
    .cw-close:hover{background:rgba(255,255,255,0.16);}
    .cw-wrap{max-width:1360px; margin:0 auto; padding:60px 24px 80px; display:grid; grid-template-columns:minmax(0,1fr) 380px; gap:32px; align-items:start;}
    .cw-main{min-width:0;}
    .cw-sidebar{min-width:0;}
    @media (max-width:960px){ .cw-wrap{grid-template-columns:1fr;} }
    .cw-video-wrap{width:100%; aspect-ratio:16/9; background:#000; border-radius:14px; overflow:hidden; display:flex; align-items:center; justify-content:center; box-shadow:0 20px 50px rgba(0,0,0,0.5);}
    .cw-video-wrap video{width:100%; height:100%; object-fit:contain; background:#000;}
    .cw-video-placeholder{color:#6b6b78; font-size:14px; text-align:center; padding:24px;}
    .cw-title{color:#fff; font-size:20px; font-weight:800; margin:18px 0 4px; line-height:1.3;}
    .cw-meta{color:#8a8a94; font-size:13px; margin-bottom:16px;}
    .cw-subrow{display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; padding:14px 0; border-top:1px solid rgba(255,255,255,0.08); border-bottom:1px solid rgba(255,255,255,0.08);}
    .cw-artist-block{display:flex; align-items:center; gap:12px; cursor:pointer;}
    .cw-avatar{width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg,#6E45A8,#D4AF6A); display:flex; align-items:center; justify-content:center; color:#0A0A10; font-weight:700; font-size:15px; flex-shrink:0;}
    .cw-artist-name{color:#fff; font-weight:700; font-size:14.5px;}
    .cw-follow-btn{background:#fff; color:#0A0A10; border:none; border-radius:20px; padding:8px 18px; font-weight:700; font-size:13px; cursor:pointer; white-space:nowrap;}
    .cw-follow-btn.is-following{background:rgba(255,255,255,0.1); color:#fff; border:1px solid rgba(255,255,255,0.25);}
    .cw-actions{display:flex; gap:10px;}
    .cw-related-title{color:#fff; font-size:15px; font-weight:700; margin:0 0 14px;}
    .cw-related-item{display:flex; gap:12px; padding:8px; border-radius:10px; cursor:pointer; transition:background .15s ease;}
    .cw-related-item:hover{background:rgba(255,255,255,0.05);}
    .cw-related-thumb{width:130px; height:74px; border-radius:8px; background-size:cover; background-position:center; flex-shrink:0; position:relative; overflow:hidden;}
    .cw-related-thumb .dur{position:absolute; bottom:4px; right:5px; background:rgba(0,0,0,0.75); color:#fff; font-size:10px; padding:1px 5px; border-radius:4px; font-family:var(--font-data, monospace);}
    .cw-related-info .t{color:#eee; font-size:13.5px; font-weight:600; line-height:1.35; margin-bottom:4px;}
    .cw-related-info .a{color:#8a8a94; font-size:12px;}
  `;
  document.head.appendChild(style);
}
function openClipWatchPage(clip){
  ensureClipWatchStyles();
  if(clip.isReal && clip.realId){
    fetch(NUNI_API_BASE + '/api/clips/' + clip.realId + '/view', {
      method:'POST',
      headers: realAuthToken ? {'Authorization':'Bearer ' + realAuthToken} : {}
    }).then(r=> r.json()).then(data=>{
      // Le serveur renvoie le vrai total à jour (compté ou pas selon les règles anti-triche/doublon).
      // On met à jour partout où ce chiffre est affiché, sans attendre un rechargement de page.
      if(typeof data.views === 'number'){
        clip.views = data.views;
        const metaEl = document.querySelector('#clip-watch-overlay .cw-meta');
        if(metaEl) metaEl.textContent = `${formatLikes(clip.views)} vues · ${clip.date || "aujourd'hui"}`;
        document.querySelectorAll('.clip-card').forEach(card=>{
          if(card.dataset.clipId === String(clip.id)){
            const viewsSpan = card.querySelector('.meta span');
            if(viewsSpan) viewsSpan.textContent = `👁️ ${formatLikes(clip.views)} vues`;
          }
        });
      }
    }).catch(()=>{});
  } else {
    clip.views = (clip.views || 0) + 1; // clips de démonstration uniquement : compteur local simple
  }
  let overlay = document.getElementById('clip-watch-overlay');
  if(overlay) overlay.remove();
  overlay = document.createElement('div');
  overlay.id = 'clip-watch-overlay';
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  const closeOverlay = ()=>{
    const v = overlay.querySelector('video');
    if(v) v.pause();
    overlay.classList.remove('show');
    document.body.style.overflow = '';
    setTimeout(()=> overlay.remove(), 200);
  };

  const initials = clip.artist.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const avatarInner = clip.artistAvatarUrl
    ? `style="background-image:url(${clip.artistAvatarUrl}); background-size:cover; background-position:center;"`
    : '';
  const videoInner = clip.videoUrl
    ? `<video src="${clip.videoUrl}" controls autoplay></video>`
    : `<div class="cw-video-placeholder">🎬 Aperçu vidéo non fourni pour ce clip de démonstration.</div>`;

  overlay.innerHTML = `
    <button class="cw-close" title="Fermer">✕</button>
    <div class="cw-wrap">
      <div class="cw-main">
        <div class="cw-video-wrap">${videoInner}</div>
        <div class="cw-title">${clip.title}</div>
        <div class="cw-meta">${formatLikes(clip.views)} vues · ${clip.date || "aujourd'hui"}</div>
        <div class="cw-subrow">
          <div class="cw-artist-block">
            <div class="cw-avatar" ${avatarInner}>${clip.artistAvatarUrl ? '' : initials}</div>
            <div class="cw-artist-name">${clip.artist}</div>
            <button class="cw-follow-btn">Suivre</button>
          </div>
          <div class="cw-actions">
            <button class="av-icon-btn cw-like-btn" title="J'aime">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
              <span class="cw-reaction-count">${clip.likes ? formatLikes(clip.likes) : ''}</span>
            </button>
            <button class="av-icon-btn cw-dislike-btn" title="Je n'aime pas">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transform:scaleY(-1);"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
              <span class="cw-reaction-count">${clip.dislikes ? formatLikes(clip.dislikes) : ''}</span>
            </button>
            <button class="av-icon-btn cw-share-btn" title="Partager"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.5l6.8-3.9M8.6 13.5l6.8 3.9"/></svg></button>
          </div>
        </div>
      </div>
      <div class="cw-sidebar">
        <div class="cw-related-title">À suivre</div>
        <div class="cw-related-list"></div>
      </div>
    </div>
  `;
  ensureBadgeStyles(); // réutilise av-icon-btn déjà stylé par l'album view

  overlay.querySelector('.cw-close').onclick = closeOverlay;
  overlay.querySelector('.cw-artist-block').onclick = (e)=>{
    if(e.target.closest('.cw-follow-btn')) return;
    closeOverlay();
    openArtistPage(clip.artist);
  };
  const followBtn = overlay.querySelector('.cw-follow-btn');
  followBtn.onclick = (e)=>{
    e.stopPropagation();
    const now = followBtn.classList.toggle('is-following');
    followBtn.textContent = now ? 'Suivi ✓' : 'Suivre';
    toast(now ? `Vous suivez maintenant ${clip.artist}.` : `Vous ne suivez plus ${clip.artist}.`);
  };
  const likeBtn = overlay.querySelector('.cw-like-btn');
  const dislikeBtn = overlay.querySelector('.cw-dislike-btn');

  // Précharge le vrai statut (déjà aimé / déjà pas-aimé) pour afficher les bons boutons actifs
  // dès l'ouverture, plutôt que de toujours repartir de zéro visuellement.
  if(clip.isReal && clip.realId && realAuthToken){
    fetch(NUNI_API_BASE + '/api/clips/' + clip.realId + '/my-reaction', {
      headers:{ 'Authorization':'Bearer ' + realAuthToken }
    }).then(r=>r.json()).then(data=>{
      likeBtn.classList.toggle('is-active', !!data.liked);
      dislikeBtn.classList.toggle('is-active', !!data.disliked);
    }).catch(()=>{});
  }

  likeBtn.onclick = async ()=>{
    bounceEl(likeBtn);
    hapticPing();
    if(clip.isReal && clip.realId && realAuthToken){
      likeBtn.disabled = true; dislikeBtn.disabled = true;
      try{
        const res = await fetch(NUNI_API_BASE + '/api/clips/' + clip.realId + '/like', {
          method:'POST', headers:{ 'Authorization':'Bearer ' + realAuthToken }
        });
        const data = await res.json();
        likeBtn.disabled = false; dislikeBtn.disabled = false;
        if(!res.ok){ toast('❌ ' + (data.error || 'Erreur.')); return; }
        clip.likes = data.likes; clip.dislikes = data.dislikes;
        likeBtn.classList.toggle('is-active', data.liked);
        dislikeBtn.classList.remove('is-active'); // exclusion mutuelle
        likeBtn.querySelector('.cw-reaction-count').textContent = clip.likes ? formatLikes(clip.likes) : '';
        dislikeBtn.querySelector('.cw-reaction-count').textContent = clip.dislikes ? formatLikes(clip.dislikes) : '';
      }catch(e){ likeBtn.disabled = false; dislikeBtn.disabled = false; toast('❌ Impossible de contacter le serveur NUNI.'); }
      return;
    }
    // Clip de démonstration, ou visiteur non connecté : comportement local uniquement
    const liked = likeBtn.classList.toggle('is-active');
    clip.likes += liked ? 1 : -1;
    if(liked) dislikeBtn.classList.remove('is-active');
  };

  dislikeBtn.onclick = async ()=>{
    bounceEl(dislikeBtn);
    hapticPing();
    if(clip.isReal && clip.realId && realAuthToken){
      likeBtn.disabled = true; dislikeBtn.disabled = true;
      try{
        const res = await fetch(NUNI_API_BASE + '/api/clips/' + clip.realId + '/dislike', {
          method:'POST', headers:{ 'Authorization':'Bearer ' + realAuthToken }
        });
        const data = await res.json();
        likeBtn.disabled = false; dislikeBtn.disabled = false;
        if(!res.ok){ toast('❌ ' + (data.error || 'Erreur.')); return; }
        clip.likes = data.likes; clip.dislikes = data.dislikes;
        dislikeBtn.classList.toggle('is-active', data.disliked);
        likeBtn.classList.remove('is-active'); // exclusion mutuelle
        likeBtn.querySelector('.cw-reaction-count').textContent = clip.likes ? formatLikes(clip.likes) : '';
        dislikeBtn.querySelector('.cw-reaction-count').textContent = clip.dislikes ? formatLikes(clip.dislikes) : '';
      }catch(e){ likeBtn.disabled = false; dislikeBtn.disabled = false; toast('❌ Impossible de contacter le serveur NUNI.'); }
      return;
    }
    const disliked = dislikeBtn.classList.toggle('is-active');
    clip.dislikes = (clip.dislikes || 0) + (disliked ? 1 : -1);
    if(disliked) likeBtn.classList.remove('is-active');
  };
  overlay.querySelector('.cw-share-btn').onclick = ()=>{
    toast('Lien du clip copié — partagez-le où vous voulez 🕊️');
  };

  const related = clips.filter(c=>c!==clip).sort((a,b)=>{
    const aSame = a.artist===clip.artist ? 0 : 1;
    const bSame = b.artist===clip.artist ? 0 : 1;
    return aSame - bSame;
  }).slice(0, 8);
  const relatedList = overlay.querySelector('.cw-related-list');
  related.forEach(rc=>{
    const item = document.createElement('div');
    item.className = 'cw-related-item';
    const thumbStyle = rc.thumb ? `background-image:url(${rc.thumb});` : `background:linear-gradient(135deg,#6E45A8,#141A38);`;
    item.innerHTML = `
      <div class="cw-related-thumb" style="${thumbStyle}"><span class="dur">${rc.dur||'—:—'}</span></div>
      <div class="cw-related-info"><div class="t">${rc.title}</div><div class="a">${rc.artist} · ${formatLikes(rc.views)} vues</div></div>`;
    item.onclick = ()=> openClipWatchPage(rc);
    relatedList.appendChild(item);
  });

  requestAnimationFrame(()=> overlay.classList.add('show'));
}
function clipCard(clip){
  const card = document.createElement('div');
  card.className = 'clip-card';
  card.dataset.clipId = clip.id;
  const thumbStyle = clip.thumb ? `background-image:url(${clip.thumb}); background-size:cover; background-position:center;` : '';
  const palClass = clip.thumb ? '' : (clip.pal || 'pal-1');
  const initials = (clip.artist||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const avatarStyle = clip.artistAvatarUrl
    ? `background-image:url(${clip.artistAvatarUrl}); background-size:cover; background-position:center;`
    : `background:var(--grad-envol); display:flex; align-items:center; justify-content:center; color:#0A0A10; font-weight:700; font-size:11px; font-family:var(--font-data);`;
  card.innerHTML = `
    <div class="clip-thumb ${palClass}" style="${thumbStyle}; position:relative;">
      <div class="play-fab"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
      <span class="dur">${clip.dur||'—:—'}</span>
      <div class="clip-artist-avatar" title="Voir le profil de ${clip.artist}" style="position:absolute; bottom:8px; left:8px; width:30px; height:30px; border-radius:50%; border:2px solid rgba(255,255,255,.85); box-shadow:0 2px 8px rgba(0,0,0,.4); cursor:pointer; z-index:2; ${avatarStyle}">${clip.artistAvatarUrl ? '' : initials}</div>
    </div>
    <div class="clip-info">
      <div class="t">${clip.title}</div>
      <div class="a">${clip.artist}</div>
      <div class="meta"><span>👁️ ${formatLikes(clip.views)} vues</span><span>❤️ ${formatLikes(clip.likes)}</span></div>
    </div>`;
  card.querySelector('.clip-artist-avatar').onclick = (e)=>{ e.stopPropagation(); openArtistPage(clip.artist); };
  card.onclick = ()=> openClipWatchPage(clip);
  return card;
}
function shuffleArray(arr){
  const a = [...arr];
  for(let i=a.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
function renderClips(){
  const grid = document.getElementById('clips-grid');
  if(!grid) return;
  grid.innerHTML = '';
  if(!clips.length){
    grid.innerHTML = `<p style="grid-column:1/-1; color:var(--text-faint); font-size:13px;">Aucun clip publié pour le moment sur NUNI — revenez bientôt !</p>`;
    return;
  }
  shuffleArray(clips).forEach(c=> grid.appendChild(clipCard(c)));
}
function renderArtistClips(artistName){
  const grid = document.getElementById('artist-page-clips');
  if(!grid) return;
  grid.innerHTML = '';
  const mine = clips.filter(c=>c.artist===artistName);
  if(!mine.length){
    grid.innerHTML = `<p style="grid-column:1/-1; color:var(--text-faint); font-size:13px;">Aucun clip publié pour le moment.</p>`;
    return;
  }
  mine.forEach(c=> grid.appendChild(clipCard(c)));
}
// Avant : 6 clips factices ("Bibi Mwana", "Ndombe Junior"...) toujours affichés, mélangés
// aux vrais clips publiés par les artistes. Retiré — seuls les vrais clips (loadRealClips,
// plus bas) doivent apparaître sur cet onglet.

async function loadRealClips(){
  try{
    const res = await fetch(NUNI_API_BASE + '/api/clips');
    if(!res.ok) return;
    const data = await res.json();
    if(!data.clips || !data.clips.length) return;
    // retire les vrais clips déjà chargés avant de réinjecter (évite les doublons)
    for(let i = clips.length - 1; i >= 0; i--){ if(clips[i].isReal) clips.splice(i, 1); }
    const mapped = data.clips.map(c => ({
      id: 'real_' + c.id, realId: c.id, title: c.title, artist: c.artist_name || 'Artiste NUNI',
      thumb: c.thumb_url || null, pal: 'pal-1', videoUrl: c.video_url || null,
      views: c.views || 0, likes: c.likes || 0, dislikes: c.dislikes || 0, isReal: true,
      date: '', dur: '—:—',
      artistId: c.artist_id, artistAvatarUrl: c.artist_avatar_url || null,
    }));
    clips.unshift(...mapped);
    renderClips();
  }catch(e){ /* pas grave si le serveur est indisponible, les clips de démo restent affichés */ }
}
loadRealClips();

/* ============ LECTEUR VIDÉO CLIP (style iOS) ============ */
let currentClip = null;
function openClipPlayer(clip){
  currentClip = clip;
  document.getElementById('clip-player-title').textContent = clip.title;
  document.getElementById('clip-player-artist').textContent = clip.artist;
  document.getElementById('clip-player-likes').textContent = formatLikes(clip.likes);
  document.getElementById('clip-player-views').textContent = formatLikes(clip.views);
  const video = document.getElementById('clip-player-video');
  const likeBtn = document.querySelector('.clip-player-actions button');
  likeBtn.classList.remove('liked');
  if(clip.videoUrl){
    video.src = clip.videoUrl;
    video.style.display = '';
    video.play().catch(()=>{});
  } else {
    video.removeAttribute('src');
    video.style.display = 'none';
    toast(`Aperçu du clip « ${clip.title} » — vidéo non fournie dans cette démo.`);
  }
  document.getElementById('clip-player-overlay').classList.add('show');
}
function closeClipPlayer(){
  const video = document.getElementById('clip-player-video');
  video.pause();
  document.getElementById('clip-player-overlay').classList.remove('show');
}
async function toggleClipLike(btn){
  if(!currentClip) return;
  if(currentClip.isReal && currentClip.realId && realAuthToken){
    btn.disabled = true;
    try{
      const res = await fetch(NUNI_API_BASE + '/api/clips/' + currentClip.realId + '/like', {
        method:'POST', headers:{ 'Authorization':'Bearer ' + realAuthToken }
      });
      const data = await res.json();
      btn.disabled = false;
      if(!res.ok){ toast('❌ ' + (data.error || 'Erreur.')); return; }
      currentClip.likes = data.likes;
      btn.classList.toggle('liked', data.liked);
      document.getElementById('clip-player-likes').textContent = formatLikes(currentClip.likes);
    }catch(e){ btn.disabled = false; toast('❌ Impossible de contacter le serveur NUNI.'); }
    return;
  }
  const liked = btn.classList.toggle('liked');
  currentClip.likes += liked ? 1 : -1;
  document.getElementById('clip-player-likes').textContent = formatLikes(currentClip.likes);
}

let uploadedFiles = [];
function fileToDataURL(file){
  return new Promise((resolve, reject)=>{
    const reader = new FileReader();
    reader.onload = ()=> resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
async function publishRelease(){
  const hasAudio = uploadedFiles.length > 0;
  const titre = document.getElementById('rf-titre').value.trim();
  const coverPreview = document.getElementById('release-cover-preview');
  const coverData = coverPreview.style.backgroundImage;
  const hasCover = coverData && coverData !== '';
  const droitsOk = document.getElementById('rf-droits').checked;

  if(!hasAudio){ toast('Importez au moins un fichier audio avant de publier.'); return; }
  if(!titre){ toast('Donnez un titre à votre projet avant de publier.'); document.getElementById('rf-titre').focus(); return; }
  if(!hasCover){ toast('Choisissez une pochette avant de publier.'); return; }
  if(!droitsOk){ toast('Vous devez confirmer détenir les droits sur ce contenu.'); return; }

  const coverUrl = coverData.slice(5, -2); // strip url("...") — aperçu local immédiat
  const coverFile = pendingCoverFile; // vrai fichier, pour l'envoi direct vers Cloudinary
  const genre = document.getElementById('rf-genre').value;
  const paroles = document.getElementById('rf-paroles').value.trim();
  const dateVal = document.getElementById('rf-date').value;
  const releaseLabel = dateVal ? new Date(dateVal).toLocaleDateString('fr-FR', {day:'2-digit', month:'short', year:'numeric'}) : "aujourd'hui";
  // Programmation réelle — avant, ce champ ne servait qu'à afficher une étiquette de date,
  // jamais envoyé au serveur comme vraie date de sortie : un morceau daté du futur était en
  // réalité publié immédiatement, sans aucune vraie programmation.
  const isScheduledForFuture = !!(dateVal && new Date(dateVal) > new Date());
  // Crédits réels — avant, ces 4 champs étaient affichés dans le formulaire mais jamais lus
  // ni envoyés au serveur (seuls titre/genre/paroles/date étaient utilisés).
  const description = document.getElementById('rf-description').value.trim();
  const featuring = document.getElementById('rf-feat').value.trim();
  const composer = document.getElementById('rf-auteur').value.trim();
  const studio = document.getElementById('rf-studio').value.trim();

  const artistDisplayName = (currentUser && currentUser.artist_name) ? currentUser.artist_name : 'Bibi Mwana';
  const filesForUpload = [...uploadedFiles];
  const newTracks = filesForUpload.map((file, i)=>{
    const trackTitle = filesForUpload.length > 1 ? `${titre} · Piste ${i+1}` : titre;
    return {
      t: trackTitle, a: artistDisplayName, p: 'pal-1', album: titre, genre: genre, year: new Date().getFullYear(),
      streams: '0', release: releaseLabel, verified: true, likes: 0,
      cover: coverUrl, audioUrl: URL.createObjectURL(file), releaseType: currentReleaseType,
      lyrics: paroles || null,
      description: description || null, featuring: featuring || null, composer: composer || null, studio: studio || null,
    };
  });

  // Un morceau programmé pour une date future ne doit apparaître NULLE PART publiquement
  // avant cette date (ni dans la discographie locale, ni lu automatiquement) — seul le
  // calendrier des sorties doit le montrer, en "à venir".
  if(isScheduledForFuture){
    toast(`"${titre}" (${currentReleaseType}) programmé pour le ${releaseLabel} — il sera publié automatiquement à cette date, visible dès maintenant dans votre calendrier des sorties.`);
  } else {
    tracks.unshift(...newTracks);
    // figure automatiquement dans la zone artiste (discographie + tendances)
    const isGroupedRelease = newTracks.length > 1 && newTracks[0].releaseType && newTracks[0].releaseType !== 'Single';
    ['shelf-artist','shelf-artist-trending','shelf-new'].forEach(id=>{
      const row = document.getElementById(id);
      if(!row) return;
      if(isGroupedRelease){
        row.prepend(trackCard(newTracks[0])); // une seule pochette représente tout l'album/EP/mixtape
      } else {
        newTracks.slice().reverse().forEach(tr=> row.prepend(trackCard(tr)));
      }
    });
    toast(`"${titre}" (${currentReleaseType}) publié — disponible dans votre discographie. Lecture en cours…`);
  }

  // Envoi réel au serveur NUNI — scheduledReleaseAt fait la vraie différence : le serveur
  // garde le morceau non-publié (published=0) jusqu'à cette date, puis le publie lui-même
  // automatiquement (job en arrière-plan côté serveur, vérifié chaque minute).
  if(realAuthToken){
    (async ()=>{
      let successCount = 0;
      let failCount = 0;
      let lastError = '';
      let cloudCoverUrl = null;
      try{
        cloudCoverUrl = await uploadFileToCloudinary(coverFile, 'image');
      }catch(e){
        toast(`❌ Envoi de la pochette impossible : ${e.message}. ${isScheduledForFuture ? 'La programmation a échoué.' : 'Les morceaux restent visibles uniquement dans votre navigateur.'}`);
        currentUser.track_count = (currentUser.track_count || 0);
        return;
      }
      for(const file of filesForUpload){
        try{
          const fileIndex = filesForUpload.indexOf(file);
          const perTrackTitle = filesForUpload.length > 1 ? `${titre} · Piste ${fileIndex+1}` : titre;
          const cloudAudioUrl = await uploadFileToCloudinary(file, 'video'); // Cloudinary traite l'audio sous "video"
          const res = await fetch(NUNI_API_BASE + '/api/tracks', {
            method:'POST',
            headers:{'Content-Type':'application/json', 'Authorization':'Bearer ' + realAuthToken},
            body: JSON.stringify({
              title: perTrackTitle, album: titre, genre: genre, releaseType: currentReleaseType,
              coverUrl: cloudCoverUrl, audioUrl: cloudAudioUrl, lyrics: paroles || null,
              composer: composer || null, featuring: featuring || null, studio: studio || null,
              description: description || null, releaseDate: dateVal || null,
              scheduledReleaseAt: isScheduledForFuture ? dateVal : null,
            })
          });
          if(res.ok){
            successCount++;
          } else {
            failCount++;
            const errData = await res.json().catch(()=>({}));
            lastError = errData.error || ('Erreur serveur (' + res.status + ')');
          }
        }catch(e){ failCount++; lastError = e.message || 'Connexion au serveur impossible.'; }
      }
      if(failCount === 0){
        toast(isScheduledForFuture
          ? 'Programmation confirmée sur le serveur NUNI.'
          : 'Vos morceaux ont bien été envoyés sur le serveur NUNI — visibles par tous les auditeurs.');
      } else if(successCount > 0){
        toast(`⚠️ ${successCount} morceau(x) envoyé(s), ${failCount} échec(s) : ${lastError}`);
      } else {
        toast(`❌ Aucun morceau envoyé au serveur : ${lastError}.`);
      }
      currentUser.track_count = (currentUser.track_count || 0) + (isScheduledForFuture ? 0 : successCount);
      // Retire les morceaux "temporaires" (aperçu local immédiat à la publication) une fois
      // que loadRealTracks() a rechargé la vraie version depuis le serveur — sinon les deux
      // coexistaient indéfiniment dans `tracks`, causant un doublon visuel (même morceau
      // affiché deux fois, partout où `tracks` est utilisé : page artiste, accueil, etc.)
      newTracks.forEach(nt=>{
        const idx = tracks.indexOf(nt);
        if(idx !== -1) tracks.splice(idx, 1);
      });
      await loadRealTracks();
      refreshMainShelves();
      if(currentUser && currentUser.account_type === 'artist' && document.getElementById('view-artist').style.display !== 'none'){
        openArtistPage(currentUser.artist_name); // reconstruit proprement la page si elle est déjà ouverte (recharge aussi le calendrier)
      }
    })();
  }

  // reset form for the next upload
  document.getElementById('rf-titre').value = '';
  document.getElementById('rf-description').value = '';
  document.getElementById('rf-feat').value = '';
  document.getElementById('rf-auteur').value = '';
  document.getElementById('rf-studio').value = '';
  document.getElementById('rf-paroles').value = '';
  document.getElementById('rf-date').value = '';
  document.getElementById('rf-explicit').checked = false;
  document.getElementById('rf-droits').checked = false;
  document.getElementById('audio-upload-list').innerHTML = '';
  uploadedFiles = [];
  pendingCoverFile = null;
  coverPreview.style.backgroundImage = '';
  coverPreview.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 16l4.5-4.5a2 2 0 0 1 2.8 0L16 16M14 14l1.5-1.5a2 2 0 0 1 2.8 0L20 14M4 6h16v12H4z"/></svg>';

  // lire immédiatement le son importé pour vérifier qu'il tourne bien — seulement s'il est
  // réellement publié tout de suite (pas pour un morceau programmé pour plus tard)
  if(!isScheduledForFuture){
    playTrack(newTracks[0]);
    openFullPlayer();
  }
}
function handleAudioUpload(e){
  let files = Array.from(e.target.files || []);
  const list = document.getElementById('audio-upload-list');

  if(currentReleaseType === 'Single'){
    // Un Single ne prend qu'un seul fichier : on remplace ce qui était déjà importé
    if(files.length > 1){ toast('Un Single ne contient qu\'un seul fichier audio — seul le premier a été gardé.'); files = files.slice(0,1); }
    uploadedFiles = [];
    list.innerHTML = '';
  } else {
    const remaining = 20 - uploadedFiles.length;
    if(files.length > remaining){
      toast(`Limite de 20 fichiers audio par ${currentReleaseType.toLowerCase()} — seuls les ${Math.max(remaining,0)} premiers ont été ajoutés.`);
      files = files.slice(0, Math.max(remaining,0));
    }
  }

  files.forEach(file=>{
    uploadedFiles.push(file);
    const item = document.createElement('div');
    item.className = 'upload-item';
    const name = file.name.replace(/\.[^/.]+$/, '');
    const previewUrl = URL.createObjectURL(file);
    item.innerHTML = `
      <div class="ui-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13M9 9l12-2"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></div>
      <div class="ui-info">
        <div class="ui-name">${name}</div>
        <div class="ui-bar"><div class="ui-bar-fill"></div></div>
        <audio class="ui-native-preview" controls preload="metadata" src="${previewUrl}"></audio>
      </div>
      <div class="ui-status">Import…</div>`;
    list.prepend(item);
    const fill = item.querySelector('.ui-bar-fill');
    const status = item.querySelector('.ui-status');
    setTimeout(()=>{ fill.style.width = '100%'; }, 50);
    setTimeout(()=>{ status.textContent = 'Prêt à publier'; status.style.color = 'var(--accent)'; }, 1500);
    if(!document.getElementById('rf-titre').value) document.getElementById('rf-titre').value = name;
  });
  if(files.length) toast(`${files.length} fichier(s) audio importé(s) — testez le son avec le lecteur ci-dessous avant de publier.`);
  e.target.value = '';
}
async function handlePhotoUpload(e, kind){
  const file = e.target.files[0];
  if(!file) return;

  // Aperçu local immédiat, en attendant l'envoi réel
  const reader = new FileReader();
  const localPreviewUrl = await new Promise(resolve=>{
    reader.onload = ()=> resolve(reader.result);
    reader.readAsDataURL(file);
  });
  if(kind === 'avatar'){
    applyAvatarEverywhere(localPreviewUrl);
  } else {
    applyBannerEverywhere(localPreviewUrl);
  }
  e.target.value = '';

  // Envoi réel — avant, cette photo restait purement locale : elle disparaissait dès qu'on
  // quittait l'onglet Artiste puis qu'on y revenait (openArtistPage réaffichait toujours le
  // dégradé par défaut), et n'était jamais visible pour les autres visiteurs ni après un rechargement.
  if(kind !== 'avatar'){
    if(!realAuthToken){
      toast('Connectez-vous avec un vrai compte Artiste pour que cette photo soit enregistrée.');
      return;
    }
    toast('Envoi de la photo de couverture en cours…');
    try{
      const cloudUrl = await uploadFileToCloudinary(file, 'image');
      const res = await fetch(NUNI_API_BASE + '/api/artist/banner', {
        method:'PUT', headers:{'Content-Type':'application/json', 'Authorization':'Bearer ' + realAuthToken},
        body: JSON.stringify({ bannerUrl: cloudUrl })
      });
      const data = await res.json();
      if(!res.ok){ toast('❌ ' + (data.error || 'Erreur.')); return; }
      currentUser.banner_url = cloudUrl;
      applyBannerEverywhere(cloudUrl);
      toast('✅ Photo de couverture enregistrée — visible sur votre page artiste.');
    }catch(e){
      toast('❌ Impossible d\'envoyer la photo : ' + (e.message || 'erreur inconnue'));
    }
    return;
  }
  if(!realAuthToken){
    toast('Connectez-vous avec un vrai compte Artiste pour que cette photo soit enregistrée.');
    return;
  }
  toast('Envoi de la photo en cours…');
  try{
    const cloudUrl = await uploadFileToCloudinary(file, 'image');
    const res = await fetch(NUNI_API_BASE + '/api/artist/avatar', {
      method:'PUT', headers:{'Content-Type':'application/json', 'Authorization':'Bearer ' + realAuthToken},
      body: JSON.stringify({ avatarUrl: cloudUrl })
    });
    const data = await res.json();
    if(!res.ok){ toast('❌ ' + (data.error || 'Erreur.')); return; }
    currentUser.avatar_url = cloudUrl;
    applyAvatarEverywhere(cloudUrl);
    toast('✅ Photo de profil enregistrée — visible partout sur NUNI.');
  }catch(e){
    toast('❌ Impossible d\'envoyer la photo : ' + (e.message || 'erreur inconnue'));
  }
}
function applyAvatarEverywhere(url){
  document.querySelectorAll('.artist-avatar, .user-chip .avatar').forEach(el=>{
    el.style.backgroundImage = `url(${url})`;
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';
    el.textContent = '';
  });
  const avatarDash = document.getElementById('avatar-preview-dash');
  if(avatarDash){ avatarDash.style.backgroundImage = `url(${url})`; avatarDash.textContent = ''; }
}
function applyBannerEverywhere(url){
  const dash = document.getElementById('cover-preview-dash');
  if(dash){ dash.style.backgroundImage = `url(${url})`; }
  const cover = document.querySelector('.artist-cover');
  if(cover){ cover.style.backgroundImage = `url(${url})`; }
}

// ============ SONS EN VEDETTE — l'artiste choisit lui-même quoi mettre en avant ============
// Avant : aucune sélection possible, la page artiste ne montrait que la Discographie
// complète, sans que l'artiste puisse choisir de mettre certains morceaux/albums en avant.
let featuredTrackIds = []; // sélection en cours dans le panneau du Dashboard
function renderFeaturedPicker(){
  const list = document.getElementById('featured-picker-list');
  if(!list) return;
  const myTracks = dedupeAlbums(tracks.filter(t=> t.isReal && currentUser && t.artistId === currentUser.id));
  if(!myTracks.length){
    list.innerHTML = `<p style="font-size:12.5px; color:var(--text-faint);">Publiez d'abord un morceau pour pouvoir le mettre en vedette.</p>`;
    return;
  }
  list.innerHTML = myTracks.map(t=>`
    <label style="display:flex; align-items:center; gap:10px; padding:8px 10px; border:1px solid var(--border); border-radius:10px; cursor:pointer;">
      <input type="checkbox" value="${t.realId}" ${featuredTrackIds.includes(t.realId) ? 'checked' : ''} onchange="toggleFeaturedTrack(${t.realId}, this.checked)">
      <div style="width:34px; height:34px; border-radius:8px; background-image:url(${t.cover||''}); background-size:cover; background-position:center; flex-shrink:0;"></div>
      <span style="font-size:13.5px;">${t.t}</span>
    </label>`).join('');
}
function toggleFeaturedTrack(id, checked){
  if(checked){
    if(featuredTrackIds.length >= 6){
      toast('Maximum 6 sons en vedette — décochez-en un avant d\'en ajouter un autre.');
      renderFeaturedPicker(); // remet la case décochée à l'écran
      return;
    }
    featuredTrackIds.push(id);
  } else {
    featuredTrackIds = featuredTrackIds.filter(x=> x !== id);
  }
}
async function loadFeaturedPicker(){
  if(!currentUser || currentUser.account_type !== 'artist') return;
  try{
    const res = await fetch(NUNI_API_BASE + '/api/artist/' + currentUser.id + '/featured-tracks');
    if(res.ok){
      const data = await res.json();
      featuredTrackIds = (data.tracks || []).map(t=> t.id);
    }
  }catch(e){ /* pas grave si le serveur est momentanément indisponible */ }
  renderFeaturedPicker();
}
async function saveFeaturedTracks(){
  if(!realAuthToken){ toast('Connectez-vous pour enregistrer votre sélection.'); return; }
  try{
    const res = await fetch(NUNI_API_BASE + '/api/artist/featured-tracks', {
      method:'PUT', headers:{'Content-Type':'application/json', 'Authorization':'Bearer ' + realAuthToken},
      body: JSON.stringify({ trackIds: featuredTrackIds })
    });
    const data = await res.json();
    if(!res.ok){ toast('❌ ' + (data.error || 'Erreur.')); return; }
    toast('✅ Sélection enregistrée — visible sur votre page artiste.');
  }catch(e){
    toast('❌ Impossible d\'enregistrer la sélection : ' + (e.message || 'erreur inconnue'));
  }
}
// Suppression d'un morceau — notamment utile pour corriger une publication en double.
async function deleteMyTrack(trackId){
  if(!trackId || !realAuthToken) return;
  if(!confirm('Supprimer définitivement ce morceau ? Cette action est irréversible.')) return;
  try{
    const res = await fetch(NUNI_API_BASE + '/api/tracks/' + trackId, {
      method:'DELETE', headers:{ 'Authorization':'Bearer ' + realAuthToken }
    });
    const data = await res.json();
    if(!res.ok){ toast('❌ ' + (data.error || 'Erreur.')); return; }
    toast('✅ Morceau supprimé.');
    await loadRealTracks();
    refreshMainShelves();
    if(currentUser && currentUser.account_type === 'artist') openArtistPage(currentUser.artist_name);
  }catch(e){
    toast('❌ Suppression impossible : ' + (e.message || 'erreur inconnue'));
  }
}

// Point d'entrée unique pour changer sa photo de profil, quel que soit le bouton utilisé
// (menu profil en haut à droite, ou "Photos de mon profil artiste" dans le Dashboard) —
// avant, ces deux boutons ne se parlaient jamais : chacun ne mettait à jour qu'un seul
// endroit à l'écran, sans jamais rien enregistrer réellement ni synchroniser le reste.
async function handleProfileAvatarUpload(e){
  const file = e.target.files[0];
  if(!file) return;

  const reader = new FileReader();
  const localPreviewUrl = await new Promise(resolve=>{
    reader.onload = ()=> resolve(reader.result);
    reader.readAsDataURL(file);
  });
  applyAvatarEverywhere(localPreviewUrl); // aperçu immédiat, partout
  e.target.value = '';

  if(!realAuthToken){
    toast('Connectez-vous pour que cette photo soit enregistrée.');
    return;
  }
  if(currentUser && currentUser.account_type !== 'artist'){
    toast('Photo mise à jour pour cette session — l\'enregistrement permanent est pour l\'instant réservé aux comptes Artiste.');
    return;
  }
  toast('Envoi de la photo en cours…');
  try{
    const cloudUrl = await uploadFileToCloudinary(file, 'image');
    const res = await fetch(NUNI_API_BASE + '/api/artist/avatar', {
      method:'PUT', headers:{'Content-Type':'application/json', 'Authorization':'Bearer ' + realAuthToken},
      body: JSON.stringify({ avatarUrl: cloudUrl })
    });
    const data = await res.json();
    if(!res.ok){ toast('❌ ' + (data.error || 'Erreur.')); return; }
    currentUser.avatar_url = cloudUrl;
    applyAvatarEverywhere(cloudUrl); // remplace l'aperçu local par la vraie URL définitive
    toast('✅ Photo de profil enregistrée — visible partout sur NUNI.');
  }catch(e){
    toast('❌ Impossible d\'envoyer la photo : ' + (e.message || 'erreur inconnue'));
  }
}

/* ============ FULL-SCREEN PLAYER ============ */
let lyricsOpen = false, immersionOn = false;

function openFullPlayer(showLyrics){
  document.getElementById('full-player').classList.add('open');
  document.body.style.overflow = 'hidden';
  syncFullPlayer();
  if(showLyrics && !lyricsOpen) toggleLyrics();
}
function closeFullPlayer(){
  document.getElementById('full-player').classList.remove('open');
  document.getElementById('full-player').classList.remove('immersion');
  immersionOn = false;
  document.body.style.overflow = '';
}
function toggleImmersion(){
  immersionOn = !immersionOn;
  document.getElementById('full-player').classList.toggle('immersion', immersionOn);
  if(immersionOn && !lyricsOpen) toggleLyrics();
}
function cycleSpeed(){
  const speeds = [1, 1.25, 1.5, 0.75];
  playbackSpeed = speeds[(speeds.indexOf(playbackSpeed)+1) % speeds.length];
  document.getElementById('speed-btn').textContent = playbackSpeed + '×';
  toast('Vitesse de lecture : ' + playbackSpeed + '×');
}
function cycleQuality(){
  qualityIndex = (qualityIndex+1) % qualities.length;
  document.getElementById('quality-btn').textContent = qualities[qualityIndex];
  toast('Qualité audio : ' + qualities[qualityIndex]);
}
function toggleLyrics(){
  lyricsOpen = !lyricsOpen;
  document.getElementById('fp-lyrics').classList.toggle('open', lyricsOpen);
  document.getElementById('lyrics-toggle-btn').classList.toggle('is-active', lyricsOpen);
  if(lyricsOpen){
    document.getElementById('fp-scroll').scrollTo({top: document.getElementById('fp-lyrics').offsetTop - 90, behavior:'smooth'});
  }
}
let currentLyricLines = [];
/* Construit les lignes de paroles du morceau en cours.
   - Si l'artiste a fourni un vrai texte : réparti dans le temps de façon régulière sur la durée du morceau
     (on n'a pas de minutage précis ligne par ligne, donc c'est une répartition égale plutôt qu'un vrai
     minutage — un vrai éditeur de paroles synchronisées serait un chantier à part, plus ambitieux).
   - Sinon, pour l'unique morceau de démonstration d'origine : on garde son texte spécifique.
   - Sinon : aucune parole disponible, message clair plutôt qu'un texte qui n'a rien à voir. */
function buildLyricLinesFor(tr){
  if(tr && tr.lyrics){
    const rawLines = tr.lyrics.split('\n').map(s=>s.trim()).filter(Boolean);
    if(rawLines.length){
      const total = (usingRealAudio && duration) ? duration : (duration || 204);
      const step = total / (rawLines.length + 1);
      return rawLines.map((text,i)=> ({ time: Math.round(step*(i+1)), text }));
    }
  }
  if(tr && tr.t === 'Mokili Ya Sika' && tr.a === 'Bibi Mwana'){
    return [
      {time:0,   text:"Ce soir la ville respire au rythme du tambour"},
      {time:26,  text:"Chaque voix qui s'élève trouve enfin son retour"},
      {time:52,  text:"Nos rêves prennent racine dans la terre et le son"},
      {time:78,  text:"Mokili ya sika, un monde en chanson"},
      {time:104, text:"On se lève ensemble quand la musique appelle"},
      {time:130, text:"Le Congo dans le cœur, l'envol sous nos ailes"},
      {time:156, text:"Écoute, soutiens, fais grandir notre histoire"},
      {time:180, text:"Nuni nous rassemble, longue vie à la mémoire"},
    ];
  }
  return [];
}
function renderLyrics(){
  const box = document.getElementById('fp-lyrics-lines');
  if(!box) return;
  box.innerHTML = '';
  currentLyricLines = buildLyricLinesFor(currentTrack);
  if(!currentLyricLines.length){
    box.innerHTML = `<p style="cursor:default; color:var(--text-faint); font-size:14px;">Paroles non fournies pour ce morceau.</p>`;
    return;
  }
  currentLyricLines.forEach((l,i)=>{
    const p = document.createElement('p');
    p.textContent = l.text;
    p.dataset.time = l.time;
    p.onclick = ()=>{ elapsed = l.time; updateProgress(); };
    box.appendChild(p);
  });
}
function updateLyricsHighlight(){
  const box = document.getElementById('fp-lyrics-lines');
  if(!box || !currentLyricLines.length) return;
  const lines = box.querySelectorAll('p');
  let current = 0;
  currentLyricLines.forEach((l,i)=>{ if(elapsed >= l.time) current = i; });
  lines.forEach((p,i)=> p.classList.toggle('is-current', i===current));
}
function renderFanWall(){
  const wall = document.getElementById('fan-wall');
  if(!wall || wall.dataset.filled) return;
  wall.dataset.filled = '1';
  fans.forEach(f=>{
    const d = document.createElement('div');
    d.className = 'fan-avatar';
    d.textContent = f;
    wall.appendChild(d);
  });
}
let fpLastTextKey = null;
function syncFullPlayer(){
  const tr = currentTrack;
  const textKey = tr.t + '::' + tr.a;
  const textSwap = document.getElementById('fp-text-swap');
  const applyText = ()=>{
    document.getElementById('fp-title').textContent = tr.t;
    document.getElementById('fp-artist').textContent = tr.a;
    document.getElementById('fp-meta').textContent = `${tr.album} · ${tr.genre} · ${tr.year}`;
    document.getElementById('fp-meta2').textContent = `${tr.streams} écoutes · Sorti le ${tr.release}`;
    document.getElementById('fp-verified').style.display = tr.verified ? 'inline-flex' : 'none';
    renderFpInfoPills(tr);
  };
  if(textSwap && textKey !== fpLastTextKey){
    fpLastTextKey = textKey;
    textSwap.classList.add('is-swapping');
    setTimeout(()=>{ applyText(); textSwap.classList.remove('is-swapping'); }, 180);
  } else {
    applyText();
  }
  applyPlayerVisuals(tr);
  document.getElementById('fp-bio-avatar').textContent = tr.a.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  document.getElementById('fp-artist-stat').style.display = (tr.a === 'Bibi Mwana') ? 'flex' : 'none';
  renderLyrics();
  updateLyricsHighlight();
  renderFanWall();
  if(document.getElementById('fp-queue') && document.getElementById('fp-queue').classList.contains('open')) renderQueuePanel();
  // suggestions
  const similar = document.getElementById('fp-suggest-similar');
  const sameArtist = document.getElementById('fp-suggest-artist');
  if(similar){ similar.innerHTML=''; tracks.filter(t=>t.genre===tr.genre && t.t!==tr.t).slice(0,5).forEach(t=> similar.appendChild(trackCard(t))); if(!similar.children.length) tracks.filter(t=>t.t!==tr.t).slice(0,5).forEach(t=> similar.appendChild(trackCard(t))); }
  if(sameArtist){ sameArtist.innerHTML=''; tracks.filter(t=>t.a===tr.a && t.t!==tr.t).forEach(t=> sameArtist.appendChild(trackCard(t))); if(!sameArtist.children.length) tracks.filter(t=>t.t!==tr.t).slice(0,4).forEach(t=> sameArtist.appendChild(trackCard(t))); }
}

/* ============ VISUELS DU LECTEUR : fond dégradé + halo + pochette (via NuniPalette) ============ */
let fpActiveBgLayer = 'a'; // alterne entre les deux calques pour un fondu propre
let fpLastCoverKey = null; // évite de relancer toute l'animation si le morceau n'a pas vraiment changé de visuel
function applyPlayerVisuals(tr){
  const coverKey = tr.cover || tr.p;
  const coverEl = document.getElementById('fp-cover');
  const isSameVisual = coverKey === fpLastCoverKey;

  // --- Pochette : petite transition en fondu, seulement si elle change vraiment ---
  const updateCoverEl = ()=>{
    if(tr.cover){
      coverEl.className = 'cover fp-cover';
      coverEl.style.backgroundImage = `url(${tr.cover})`;
      coverEl.innerHTML = '';
    } else {
      coverEl.style.backgroundImage = '';
      coverEl.className = 'cover fp-cover ' + tr.p;
      coverEl.innerHTML = '<div class="cover-glyph pal-pattern"></div>';
    }
  };
  if(isSameVisual){
    updateCoverEl();
  } else {
    coverEl.style.opacity = '0';
    coverEl.style.transform = 'scale(.94)';
    setTimeout(()=>{
      updateCoverEl();
      coverEl.style.opacity = '1';
      coverEl.style.transform = 'scale(1)';
    }, 180);
  }

  // --- Palette + fond + halo : recalcul seulement si le visuel a changé (cache interne en plus) ---
  const applyPalette = (palette)=>{
    const nextLayerId = fpActiveBgLayer === 'a' ? 'fp-bg-b' : 'fp-bg-a';
    const prevLayerId = fpActiveBgLayer === 'a' ? 'fp-bg-a' : 'fp-bg-b';
    const nextLayer = document.getElementById(nextLayerId);
    const prevLayer = document.getElementById(prevLayerId);
    if(nextLayer){
      nextLayer.style.background = `linear-gradient(135deg, ${palette.dominant} 0%, ${palette.secondary} 60%, ${palette.dark} 100%)`;
      nextLayer.classList.add('is-active');
    }
    if(prevLayer) prevLayer.classList.remove('is-active');
    fpActiveBgLayer = fpActiveBgLayer === 'a' ? 'b' : 'a';

    const halo = document.getElementById('fp-halo');
    if(halo) halo.style.background = `radial-gradient(circle, ${palette.accent} 0%, transparent 72%)`;
  };

  if(isSameVisual) return; // même pochette qu'avant : on ne relance ni le calcul ni le fondu du fond
  fpLastCoverKey = coverKey;

  if(tr.cover){
    NuniPalette.extract(tr.cover).then(applyPalette);
  } else {
    applyPalette(NuniPalette.forPaletteClass(tr.p));
  }
}

/* ============ INFOS DISCRÈTES DU LECTEUR (type de sortie, année, piste, temps restant) ============ */
function renderFpInfoPills(tr){
  const wrap = document.getElementById('fp-info-pills');
  if(!wrap) return;
  const pills = [];
  if(tr.releaseType) pills.push(tr.releaseType);
  if(tr.year) pills.push(String(tr.year));

  if(tr.album && tr.releaseType && tr.releaseType !== 'Single'){
    const albumTracks = tracks.filter(t=> t.album === tr.album && t.a === tr.a);
    if(albumTracks.length > 1){
      const idx = albumTracks.findIndex(t=> t.t === tr.t);
      if(idx > -1) pills.push(`Piste ${idx+1}/${albumTracks.length}`);
    }
  }
  wrap.innerHTML = pills.map(p=> `<span class="fp-info-pill">${p}</span>`).join('')
    + `<span class="fp-info-pill" id="fp-remaining-pill">--:-- restantes</span>`;
  updateFpRemainingPill();
}
function updateFpRemainingPill(){
  const el = document.getElementById('fp-remaining-pill');
  if(!el) return;
  const remaining = Math.max(0, duration - elapsed);
  el.textContent = fmt(remaining) + ' restantes';
}

/* ============ FILE D'ATTENTE ============
   Simplification assumée : la file reflète l'ordre réel de lecture (pool de morceaux courant,
   selon le mode radio/DJ/genre en cours) plutôt qu'un ordre librement réorganisable à la souris.
   Cliquer sur un morceau "à suivre" le lance immédiatement. Un vrai glisser-déposer demanderait
   de repenser toute la logique de rotation Radio/DJ NUNI — proposé comme chantier à part si voulu. */
function queueRowHtml(tr, extra){
  const cov = tr.cover ? `style="background-image:url(${tr.cover})"` : `style="background:${palGradients[tr.p]||palGradients['pal-1']}"`;
  return `<div class="fp-queue-cov" ${cov}></div><div class="fp-queue-info"><div class="t">${tr.t}</div><div class="a">${tr.a}</div></div>${extra||''}`;
}
let fpQueueUpcoming = [];
let fpQueueHistoryList = [];
function renderQueuePanel(){
  const pool = getCurrentPlaybackPool();
  const i = pool.findIndex(t=> t.t === currentTrack.t);
  const current = document.getElementById('fp-queue-current');
  const next = document.getElementById('fp-queue-next');
  const hist = document.getElementById('fp-queue-history');
  if(!current || !next || !hist) return;

  current.innerHTML = `<div class="fp-queue-item is-current">${queueRowHtml(currentTrack)}</div>`;

  fpQueueUpcoming = [];
  for(let k=1; k<=5 && k<pool.length; k++) fpQueueUpcoming.push(pool[(i+k) % pool.length]);
  next.innerHTML = fpQueueUpcoming.length
    ? fpQueueUpcoming.map((tr, idx)=> `<div class="fp-queue-item" data-queue-kind="next" data-queue-idx="${idx}">${queueRowHtml(tr)}</div>`).join('')
    : `<div class="fp-queue-empty">Rien d'autre à suivre pour le moment.</div>`;

  fpQueueHistoryList = listeningHistory.filter(h=> h.track.t !== currentTrack.t).slice(0, 5).map(h=> h.track);
  hist.innerHTML = fpQueueHistoryList.length
    ? fpQueueHistoryList.map((tr, idx)=> `<div class="fp-queue-item" data-queue-kind="history" data-queue-idx="${idx}">${queueRowHtml(tr)}</div>`).join('')
    : `<div class="fp-queue-empty">Aucun historique récent.</div>`;
}
document.addEventListener('click', (e)=>{
  const item = e.target.closest('.fp-queue-item[data-queue-kind]');
  if(!item) return;
  const kind = item.dataset.queueKind;
  const idx = Number(item.dataset.queueIdx);
  const tr = kind === 'next' ? fpQueueUpcoming[idx] : fpQueueHistoryList[idx];
  if(tr) playTrack(tr);
});
function toggleQueuePanel(){
  const panel = document.getElementById('fp-queue');
  const btn = document.getElementById('queue-toggle-btn');
  const willOpen = !panel.classList.contains('open');
  panel.classList.toggle('open', willOpen);
  if(btn) btn.classList.toggle('is-active', willOpen);
  if(willOpen){
    renderQueuePanel();
    panel.scrollIntoView({ behavior:'smooth', block:'start' });
  }
}

/* ============ MENU RAPIDE (⋯) ============ */
function toggleQuickMenu(e){
  e.stopPropagation();
  document.getElementById('fp-quick-menu').classList.toggle('open');
}
function closeQuickMenu(){
  const m = document.getElementById('fp-quick-menu');
  if(m) m.classList.remove('open');
}
document.addEventListener('click', (e)=>{
  const wrap = document.querySelector('.fp-quick-menu-wrap');
  if(wrap && !wrap.contains(e.target)) closeQuickMenu();
});
function openFpAlbum(){
  closeQuickMenu();
  const tr = currentTrack;
  const albumTracks = tracks.filter(t=> t.album === tr.album && t.a === tr.a);
  if(albumTracks.length > 1){ closeFullPlayer(); openAlbumView(tr); }
  else { toast('Ce morceau ne fait pas partie d\'un album multi-titres.'); }
}
function openFpCredits(){
  closeQuickMenu();
  const tr = currentTrack;
  const body = document.getElementById('credits-body');
  body.innerHTML = `
    <div class="pi-sub-card">
      <div class="pi-sub-row"><span>Artiste principal</span><b>${tr.a}</b></div>
      <div class="pi-sub-row"><span>Featuring</span><b>${tr.featuring || '—'}</b></div>
      <div class="pi-sub-row"><span>Compositeur / Auteur</span><b>${tr.composer || '—'}</b></div>
      <div class="pi-sub-row"><span>Studio d'enregistrement</span><b>${tr.studio || '—'}</b></div>
      <div class="pi-sub-row"><span>Album / Sortie</span><b>${tr.album || '—'}</b></div>
      <div class="pi-sub-row"><span>Genre</span><b>${tr.genre || '—'}</b></div>
      <div class="pi-sub-row"><span>Année</span><b>${tr.year || '—'}</b></div>
      <div class="pi-sub-row"><span>Type de sortie</span><b>${tr.releaseType || 'Single'}</b></div>
      <div class="pi-sub-row"><span>Distribution</span><b>NUNI</b></div>
    </div>
    ${tr.description ? `<p style="color:var(--text-dim); font-size:13px; margin-top:14px; line-height:1.5;">${tr.description}</p>` : ''}`;
  document.getElementById('credits-modal-overlay').classList.add('show');
}
function closeFpCredits(){
  document.getElementById('credits-modal-overlay').classList.remove('show');
}

/* ============ LÉGÈRE PROFONDEUR 3D SUR LA POCHETTE (souris, ordinateur uniquement) ============ */
function setupFpCoverTilt(){
  const wrap = document.getElementById('fp-cover-wrap');
  if(!wrap) return;
  const canHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if(!canHover) return; // mobile/tactile : on n'ajoute pas cet effet, inutile et parfois gênant
  wrap.addEventListener('mousemove', (e)=>{
    const rect = wrap.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    const rotateY = px * 12; // rotation max ~6° de chaque côté, effet volontairement discret
    const rotateX = py * -12;
    wrap.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });
  wrap.addEventListener('mouseleave', ()=>{
    wrap.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
  });
}
setupFpCoverTilt();

/* ============ DASHBOARD CHART — vrais streams par mois, plus de données inventées ============
   Avant : const monthly = [{m:'Jan', v:31}, ...] codé en dur, identique pour tout le monde.
   Maintenant : vrai regroupement des écoutes de CET artiste par mois, via le nouvel endpoint
   /api/artist/stats/monthly (6 derniers mois, y compris les mois à 0 écoute). */
async function loadDashboardChart(){
  const chart = document.getElementById('bar-chart');
  if(!chart) return;
  chart.innerHTML = '';
  if(!realAuthToken) return;
  let monthly;
  try{
    const res = await fetch(NUNI_API_BASE + '/api/artist/stats/monthly', {
      headers:{ 'Authorization':'Bearer ' + realAuthToken }
    });
    if(!res.ok) return;
    const data = await res.json();
    monthly = data.monthly;
  }catch(e){ return; /* pas grave si le serveur est momentanément indisponible */ }
  if(!monthly || !monthly.length) return;

  const max = Math.max(1, ...monthly.map(m=>m.v));
  monthly.forEach(m=>{
    const col = document.createElement('div');
    col.className = 'bar-col';
    col.innerHTML = `<div class="bar-fill" style="height:0%" data-h="${(m.v/max*100)}"></div><div class="m-lbl">${m.m}</div>`;
    chart.appendChild(col);
  });
  setTimeout(()=>{
    document.querySelectorAll('#bar-chart .bar-fill').forEach(b=> b.style.height = b.dataset.h + '%');
  }, 300);
}

updateProgress();

/* ============ COMPTEUR D'AUDITEURS ACTIFS (accueil) — VRAI chiffre, plus de simulation ============
   Avant : un compteur de démo qui partait d'un nombre inventé (184 320) et s'incrémentait
   au hasard toutes les 2,2s, sans aucun rapport avec la réalité. Maintenant : le vrai nombre
   de comptes (Consommateur + Artiste) dont le Pass est actuellement actif, tiré directement
   de la base de données. Rafraîchi régulièrement pour rester à jour sans devoir recharger la page. */
const impactEl = document.getElementById('impact-value');
function formatFCFA(n){ return Math.round(n).toLocaleString('fr-FR'); }
async function refreshActiveUsersCount(){
  if(!impactEl) return;
  try{
    const res = await fetch(NUNI_API_BASE + '/api/stats/public');
    if(!res.ok) return;
    const data = await res.json();
    if(typeof data.active_users === 'number') impactEl.textContent = formatFCFA(data.active_users);
  }catch(e){ /* pas grave si le serveur est momentanément indisponible — l'ancien chiffre reste affiché */ }
}
refreshActiveUsersCount();
setInterval(refreshActiveUsersCount, 3000); // quasi instantané, sans surcharger le serveur gratuit

/* ============ NUNI RADIO TUNER (12 stations) ============ */
const tunerStations = [
  { freq:'87.5', name:'NUNI Hits', desc:'Les morceaux les plus populaires de la plateforme.', filter: ()=>[...tracks].sort((a,b)=>(b.likes||0)-(a.likes||0)) },
  { freq:'88.9', name:'NUNI Rap Congo', desc:'Rap, drill et trap congolais.', filter: ()=> tracks.filter(t=>t.genre==='Rap') },
  { freq:'90.3', name:'NUNI Rumba', desc:'Rumba congolaise classique et moderne.', filter: ()=> tracks.filter(t=>t.genre==='Rumba') },
  { freq:'91.7', name:'NUNI Gospel', desc:'Gospel congolais, entre tradition et modernité.', filter: ()=> tracks.filter(t=>t.genre==='Gospel') },
  { freq:'93.1', name:'NUNI Afro', desc:'Le meilleur de l\'afrobeat congolais.', filter: ()=> tracks.filter(t=>t.genre==='Afro') },
  { freq:'94.8', name:'NUNI Urban', desc:'Hip-hop et sonorités urbaines congolaises.', filter: ()=> tracks.filter(t=>t.genre==='Hip-Hop') },
  { freq:'96.4', name:'NUNI Amapiano', desc:'Amapiano et sons électroniques africains.', filter: ()=> [...tracks].sort(()=>Math.random()-0.5) },
  { freq:'98.2', name:'NUNI Love', desc:'Titres doux, pour les cœurs romantiques.', filter: ()=> [...tracks].sort(()=>Math.random()-0.5) },
  { freq:'100.5', name:'NUNI Live', desc:'Sessions et performances live.', filter: ()=> [...tracks].sort(()=>Math.random()-0.5) },
  { freq:'102.8', name:'NUNI Découverte', desc:'Nouveaux artistes à découvrir en premier.', filter: ()=> [...tracks].sort((a,b)=>(a.likes||0)-(b.likes||0)) },
  { freq:'104.4', name:'NUNI Classics', desc:'Musique traditionnelle congolaise intemporelle.', filter: ()=> tracks.filter(t=>t.genre==='Traditionnel') },
  { freq:'106.9', name:'NUNI Night', desc:'Ambiance nocturne, mix continu.', filter: ()=> [...tracks].sort(()=>Math.random()-0.5) },
];
let tunerIndex = 0;
let tunerPlaying = false;
let tunerQueue = [];
let tunerQueuePos = 0;
let stationChangeTimer = null;

function openTuner(tab){
  document.getElementById('tuner-modal-overlay').classList.add('show');
  renderTunerStationList();
  renderTunerStation(false);
  switchTunerTab(tab || 'radio');
}
function closeTuner(){
  document.getElementById('tuner-modal-overlay').classList.remove('show');
}

/* ============ NUNI TALENT — TOP 100 ============ */
const talentExtraNames = [
  'Mokili Stars','Kin Beatz','Rumba Nouvelle','Sista Ngoma','Fally Junior','Baila Africa','Zaiko Nouveau',
  'DJ Mbote','Bana Kin','Congo Vibes','Etoile ya Ndenge','Lumière Kongo','Vox Poto','Mabele Sound',
  'Rythme na Biso','Sango Malamu','Nzoto Kin','Papa Style','Mama Rumba','Yaya Talent','Baba Ngoma',
  'Nzela Music','Bilombe','Kongo Fire','Boma Sound',
];
let talentTop100 = null;
function buildTalentTop100(){
  if(talentTop100) return talentTop100;
  const base = suggestedArtists.map(a => ({
    name: a.n, genre: a.g.split(' · ')[0],
    streams: tracks.filter(t=>t.a===a.n).reduce((s,t)=> s + (t.likes||0)*37, 50000 + Math.floor(Math.random()*400000)),
  }));
  const genresPool = ['Rumba','Afro','Gospel','Rap','Hip-Hop','Traditionnel'];
  const extra = talentExtraNames.map((n,i) => ({
    name: n, genre: genresPool[i % genresPool.length],
    streams: Math.floor(380000 - i*11000 + Math.random()*15000),
  }));
  talentTop100 = [...base, ...extra]
    .sort((a,b)=> b.streams - a.streams)
    .map((a,i)=> ({ ...a, rank: i+1, voted: false, votesThisWeek: 0 }));
  return talentTop100;
}
function openTalentModal(){
  const list = buildTalentTop100();
  const wrap = document.getElementById('talent-rank-list');
  wrap.innerHTML = '';
  list.forEach(a=>{
    const item = document.createElement('div');
    item.className = 'talent-rank-item' + (a.rank<=3 ? ' top3' : '');
    const initials = a.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    item.innerHTML = `
      <div class="talent-rank-num">${a.rank<=3 ? ['🥇','🥈','🥉'][a.rank-1] : '#'+a.rank}</div>
      <div class="talent-rank-av">${initials}</div>
      <div class="talent-rank-info">
        <div class="talent-rank-name">${a.name}</div>
        <div class="talent-rank-meta">${a.genre} · ${formatLikes(a.streams)} écoutes</div>
      </div>
      <button class="talent-vote-btn ${a.voted?'voted':''}" onclick="voteForArtist(${a.rank}, this, event)">${a.voted ? '✓ Voté' : 'Voter'}</button>`;
    wrap.appendChild(item);
  });
  renderWeeklyWinner();
  spawnTalentBubbles();
  document.getElementById('talent-modal-overlay').classList.add('show');
}
function closeTalentModal(){
  document.getElementById('talent-modal-overlay').classList.remove('show');
}
function renderWeeklyWinner(){
  const card = document.getElementById('talent-winner-card');
  if(!talentTop100 || !card) return;
  const winner = [...talentTop100].sort((a,b)=> b.votesThisWeek - a.votesThisWeek || b.streams - a.streams)[0];
  const initials = winner.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const nextSunday = new Date('2026-07-05');
  const fmtDate = nextSunday.toLocaleDateString('fr-FR', {weekday:'long', day:'2-digit', month:'long'});
  card.innerHTML = `
    <div class="av">${initials}</div>
    <div>
      <span class="badge">🏆 Artiste le plus aimé &amp; voté cette semaine</span>
      <div class="name">${winner.name}</div>
      <div class="meta">${winner.votesThisWeek} vote(s) cette semaine · résultat final ${fmtDate}</div>
    </div>`;
}
function voteForArtist(rank, btn, evt){
  const entry = talentTop100.find(a=>a.rank===rank);
  if(!entry || entry.voted) return;
  entry.voted = true;
  entry.streams += 500;
  entry.votesThisWeek = (entry.votesThisWeek||0) + 1;
  btn.textContent = '✓ Voté';
  btn.classList.add('voted');
  const rect = btn.getBoundingClientRect();
  spawnVoteBubble(rect.left + rect.width/2, rect.top + rect.height/2);
  renderWeeklyWinner();
  toast(`Vote enregistré pour ${entry.name} 🕊️`);
}
function spawnVoteBubble(x, y){
  for(let i=0;i<5;i++){
    const b = document.createElement('div');
    b.className = 'vote-bubble-pop';
    const size = 8 + Math.random()*14;
    b.style.width = size+'px'; b.style.height = size+'px';
    b.style.left = (x + (Math.random()*40-20)) + 'px';
    b.style.top = (y + (Math.random()*10-5)) + 'px';
    b.style.animationDelay = (i*0.05)+'s';
    document.body.appendChild(b);
    setTimeout(()=> b.remove(), 900);
  }
}
function spawnTalentBubbles(){
  const layer = document.getElementById('talent-bubbles');
  layer.innerHTML = '';
  for(let i=0;i<10;i++){
    const b = document.createElement('div');
    b.className = 'talent-bubble';
    const size = 14 + Math.random()*36;
    b.style.width = size+'px'; b.style.height = size+'px';
    b.style.left = (Math.random()*100)+'%';
    b.style.animationDuration = (7+Math.random()*8)+'s';
    b.style.animationDelay = (Math.random()*8)+'s';
    layer.appendChild(b);
  }
}

function switchTunerTab(tab){
  document.getElementById('tuner-tab-radio').classList.toggle('is-active', tab==='radio');
  document.getElementById('tuner-tab-dj').classList.toggle('is-active', tab==='dj');
  document.getElementById('tuner-pane-radio').style.display = tab==='radio' ? 'block' : 'none';
  document.getElementById('tuner-pane-dj').style.display = tab==='dj' ? 'block' : 'none';
}
function renderTunerStationList(){
  const list = document.getElementById('tuner-station-list');
  list.innerHTML = '';
  tunerStations.forEach((s,i)=>{
    const chip = document.createElement('button');
    chip.className = 'tuner-station-chip' + (i===tunerIndex ? ' is-active' : '');
    chip.textContent = s.freq;
    chip.onclick = ()=>{ tunerIndex = i; renderTunerStation(true); };
    list.appendChild(chip);
  });
}
function renderTunerStation(withFlicker){
  const s = tunerStations[tunerIndex];
  const noise = document.getElementById('tuner-noise');
  if(withFlicker){
    noise.classList.remove('flicker'); void noise.offsetWidth; noise.classList.add('flicker');
  }
  document.getElementById('tuner-freq').innerHTML = s.freq + ' <span>MHz</span>';
  document.getElementById('tuner-station-name').textContent = s.name;
  document.getElementById('tuner-station-desc').textContent = s.desc;
  renderTunerStationList();
  if(tunerPlaying) startTunerPlayback();
}
function tunerStep(dir){
  tunerIndex = (tunerIndex + dir + tunerStations.length) % tunerStations.length;
  renderTunerStation(true);
}
const RADIO_FALLBACK_STREAM = 'https://radio.garden/api/ara/content/listen/O90IGaKD/channel.mp3';
const RADIO_FALLBACK_NAME = 'Radio Congo (flux de secours)';
async function fetchLocalRadioStation(){
  const endpoints = [
    'https://de1.api.radio-browser.info/json/stations/search?country=Democratic%20Republic%20of%20the%20Congo&limit=8&hidebroken=true',
    'https://de1.api.radio-browser.info/json/stations/search?country=Congo&limit=8&hidebroken=true',
  ];
  for(const url of endpoints){
    try{
      const res = await fetch(url);
      if(!res.ok) continue;
      const stations = await res.json();
      const valid = stations.find(s => s.url_resolved || s.url);
      if(valid) return { name: valid.name || 'Radio locale', url: valid.url_resolved || valid.url };
    }catch(e){ /* essaie l'endpoint suivant */ }
  }
  return null;
}
async function startTunerPlayback(){
  const s = tunerStations[tunerIndex];
  tunerQueue = s.filter();
  radioMode = true; genreRadioActive = null; djMode = false;

  // priorité aux vrais fichiers importés correspondant à la station (son réel)
  const realTrack = tunerQueue.find(t => t.audioUrl);
  if(realTrack){
    usingRealAudio = false;
    playTrack(realTrack);
    document.getElementById('radio-badge').style.display = 'inline-flex';
    updateTunerNowPlaying();
    return;
  }

  // sinon : flux radio réel en direct, pour un vrai son
  toast('Connexion à un flux radio réel…');
  let station = null;
  try{ station = await fetchLocalRadioStation(); }catch(e){ station = null; }
  if(!station) station = { name: RADIO_FALLBACK_NAME, url: RADIO_FALLBACK_STREAM };

  clearInterval(progressTimer);
  usingRealAudio = true;
  realAudio.pause();
  realAudio.src = station.url;
  currentTrack = { t: s.name, a: `En direct — ${station.name}`, p: 'pal-4', audioUrl: station.url };
  document.getElementById('player-title').textContent = currentTrack.t;
  document.getElementById('player-artist').textContent = currentTrack.a;
  applyCoverTo(document.getElementById('player-cover'), currentTrack);
  syncFullPlayer();
  realAudio.play().then(()=>{
    toast(`🔊 Son en direct — ${station.name}`);
  }).catch(()=>{
    toast('Lecture bloquée par le navigateur — appuyez sur ▶ dans le lecteur pour démarrer le son manuellement.');
  });
  playing = true;
  document.documentElement.classList.add('is-playing');
  document.getElementById('play-icon').innerHTML = '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>';
  const fpIcon = document.getElementById('fp-play-icon');
  if(fpIcon) fpIcon.innerHTML = '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>';
  document.getElementById('radio-badge').style.display = 'inline-flex';
  updateTunerNowPlaying();
}
function updateTunerNowPlaying(){
  const tr = currentTrack;
  document.getElementById('tuner-track-t').textContent = tr ? tr.t : '—';
  document.getElementById('tuner-track-a').textContent = tr ? tr.a : '—';
  const cover = document.getElementById('tuner-cover');
  if(tr && tr.cover){ cover.style.backgroundImage = `url(${tr.cover})`; }
  else{ cover.style.backgroundImage = ''; cover.style.background = 'var(--grad-envol)'; }
}
function tunerTogglePlay(){
  tunerPlaying = !tunerPlaying;
  const btn = document.getElementById('tuner-play-btn');
  if(tunerPlaying){
    btn.textContent = '⏸ Station en cours';
    startTunerPlayback();
  } else {
    btn.textContent = '▶ Écouter cette station';
    radioMode = false;
    document.getElementById('radio-badge').style.display = 'none';
    if(playing) togglePlay();
  }
}

/* ============ NUNI DJ (6 modes) ============ */
// Ne sélectionne que des morceaux avec un vrai fichier audio — les morceaux de démonstration
// du catalogue (Mokili Ya Sika, Lokito...) n'ont pas de vrai son (pas de tr.audioUrl) : si le
// DJ tombait dessus, on entendait la voix du DJ mais aucune musique (silence simulé).
// Deux instrumentaux fournis directement (hébergés en statique dans le dépôt Nuni site,
// pas via Cloudinary — évite tout souci CORS pour ces fichiers-là). Classés "Afro" d'après
// leur nom de fichier (AFRO_TYPE_BEAT, Instru Afro Mélodique) — à corriger si le genre ne
// correspond pas une fois entendu.
const DJ_BONUS_TRACKS = [
  { t: 'Maasai (Afro Drill)', a: 'NUNI DJ Set', p: 'pal-4', genre: 'Afro', likes: 0, streams: '0',
    audioUrl: 'assets/dj-tracks/maasai-afro-drill.mp3', isReal: false },
  { t: 'Boucan (Instru Afro Mélodique)', a: 'NUNI DJ Set', p: 'pal-6', genre: 'Afro', likes: 0, streams: '0',
    audioUrl: 'assets/dj-tracks/boucan-afro-melodique.mp3', isReal: false },
];
function realPlayableTracks(){ return tracks.filter(t=> !!t.audioUrl).concat(DJ_BONUS_TRACKS); }
const djModes = [
  { id:'club', name:'Club', bpm:126, transition:'Beat Sync', filter: ()=> shuffleArray(realPlayableTracks()) },
  { id:'festival', name:'Festival', bpm:132, transition:'Drop enchaîné', filter: ()=> [...realPlayableTracks()].sort((a,b)=>(b.likes||0)-(a.likes||0)) },
  { id:'chill', name:'Chill', bpm:92, transition:'Fondu doux', filter: ()=>{
      const all = realPlayableTracks();
      const pool = all.filter(t=>t.genre==='Gospel' || t.genre==='Traditionnel');
      return shuffleArray(pool.length ? pool : all);
    } },
  { id:'afro', name:'Afro Party', bpm:118, transition:'Crossfade rythmé', filter: ()=>{
      const all = realPlayableTracks();
      const pool = all.filter(t=>['Afro','Traditionnel'].includes(t.genre));
      return shuffleArray(pool.length ? pool : all);
    } },
  { id:'rapcongo', name:'Rap Congo', bpm:96, transition:'Cut sec', filter: ()=>{
      const all = realPlayableTracks();
      const pool = all.filter(t=>t.genre==='Rap');
      return shuffleArray(pool.length ? pool : all);
    } },
  { id:'rumba', name:'Rumba Lounge', bpm:100, transition:'Mix très doux', filter: ()=>{
      const all = realPlayableTracks();
      const pool = all.filter(t=>t.genre==='Rumba');
      return shuffleArray(pool.length ? pool : all);
    } },
];
let djModeId = 'club';
let djPlaying = false;
let djQueue = [];
let djQueuePos = 0; // position actuelle dans djQueue — permet à nextTrack/prevTrack de rester dans la vraie file du mode DJ
let djTimer = null;

function renderDjModes(){
  const wrap = document.getElementById('dj-modes');
  wrap.innerHTML = '';
  djModes.forEach(m=>{
    const chip = document.createElement('button');
    chip.className = 'dj-mode-chip' + (m.id===djModeId ? ' is-active' : '');
    chip.textContent = m.name;
    chip.onclick = ()=>{ djModeId = m.id; renderDjModes(); updateDjLabels(); if(djPlaying) startDjPlayback(); };
    wrap.appendChild(chip);
  });
}
// Couleurs par ambiance — cohérentes avec le mood de chaque mode DJ (violet nocturne pour
// Club, rose/or plus vif pour Festival, tons chauds et doux pour Chill/Rumba, etc.)
const DJ_FX_THEMES = {
  club:      { c1:'#6E45A8', c2:'#D4AF6A' },
  festival:  { c1:'#C9667A', c2:'#E8C77E' },
  chill:     { c1:'#1E8449', c2:'#D4AF6A' },
  afro:      { c1:'#1E8449', c2:'#E8C77E' },
  rapcongo:  { c1:'#7A1E14', c2:'#1D2550' },
  rumba:     { c1:'#C0392B', c2:'#D4AF6A' },
};
function applyDjFxTheme(){
  const stage = document.getElementById('dj-fx-stage');
  const m = djModes.find(x=>x.id===djModeId);
  if(!stage || !m) return;
  const theme = DJ_FX_THEMES[m.id] || DJ_FX_THEMES.club;
  stage.style.setProperty('--dj-fx-c1', theme.c1);
  stage.style.setProperty('--dj-fx-c2', theme.c2);
  stage.style.setProperty('--dj-beat-duration', (60 / m.bpm) + 's');
}
function updateDjLabels(){
  const m = djModes.find(x=>x.id===djModeId);
  document.getElementById('dj-mode-label').textContent = m.name;
  document.getElementById('dj-transition-label').textContent = m.transition;
  document.getElementById('dj-bpm-label').textContent = m.bpm;
  applyDjFxTheme();
}
let djAvatarInstance = null; // instance unique de NuniDJAvatar, créée à la première activation du mode DJ
function startDjPlayback(){
  const m = djModes.find(x=>x.id===djModeId);
  djQueue = m.filter();
  if(!djQueue.length){ toast('Aucun titre disponible pour ce mode pour le moment.'); return; }
  djQueuePos = 0;
  radioMode = false; genreRadioActive = null; djMode = true;
  usingRealAudio = false;
  playTrack(djQueue[0]);
  updateDjNowPlaying();
  clearInterval(djTimer);
  djTimer = setInterval(updateDjNowPlaying, 1000);

  // Avatar DJ animé, réactif en temps réel au vrai son en cours de lecture (analyse Web
  // Audio) — remplace visuellement la pochette statique par un visage qui bouge avec la
  // musique. Créé une seule fois, reconnecté à chaque activation du mode DJ.
  if(typeof NuniDJAvatar !== 'undefined'){
    const container = document.getElementById('dj-avatar-container');
    if(container){
      try{
        if(!djAvatarInstance) djAvatarInstance = new NuniDJAvatar(container, { djMode:true, size:180 });
        // Volontairement PAS connecté au vrai son (djAvatarInstance.connect(realAudio)) :
        // Cloudinary ne renvoie pas les en-têtes CORS nécessaires pour ces fichiers, et une
        // fois un graphe Web Audio branché sur une source cross-origin non autorisée, Chrome
        // ne se contente pas de couper l'analyse — il coupe le SON RÉEL joué (confirmé en
        // console : "MediaElementAudioSource outputs zeroes due to CORS access restrictions").
        // L'avatar garde son animation de base (respiration, clignements, mode DJ) sans être
        // piloté précisément par l'audio, en échange d'un son garanti.
        djAvatarInstance.start();
      }catch(e){
        console.warn('Avatar DJ non démarré (son réel non affecté) :', e);
      }
    }
  }
}
function updateDjNowPlaying(){
  const tr = currentTrack;
  document.getElementById('dj-track-t').textContent = tr ? tr.t : '—';
  document.getElementById('dj-track-a').textContent = tr ? tr.a : '—';
  const cover = document.getElementById('dj-cover');
  if(tr && tr.cover){ cover.style.backgroundImage = `url(${tr.cover})`; }
  else{ cover.style.backgroundImage = ''; cover.style.background = 'var(--grad-envol)'; }
  const idx = djQueue.findIndex(t=>t.t===tr?.t);
  const next = djQueue[(idx+1) % djQueue.length];
  document.getElementById('dj-next-label').textContent = next ? next.t : '—';
  const remaining = Math.max(0, duration - elapsed);
  document.getElementById('dj-remaining-label').textContent = fmt(remaining);
}
// ---------- Voix du DJ NUNI (synthèse vocale du navigateur, sans API payante) ----------
// 10 phrases d'ambiance, jamais deux fois de suite la même tant que les 10 n'ont pas toutes
// été dites au moins une fois. La musique baisse brièvement pendant l'annonce, comme un vrai
// micro de boîte de nuit qui coupe le son ambiant, puis remonte automatiquement après.
const djVoiceLines = [
  "Yo yo, NUNI DJ dans la place, on lâche rien !",
  "Big up à tout Kin et Brazza ce soir !",
  "Ambiance ya bien, tout le monde bouge !",
  "One love, on garde le good vibe !",
  "La sauce est chaude, restez avec nous !",
  "Jah bless, on monte encore d'un cran !",
  "242, 243, tout le monde répond présent !",
  "Irie ! Le prochain son va faire mal !",
  "On n'arrête rien, NUNI DJ tient le mic !",
  "Respect à tous les vrais, la fête continue !",
];
let djVoiceUsedIndexes = new Set();
// Vraies notes vocales du DJ (hébergées en statique dans Nuni site, assets/dj-voice/) — la
// synthèse vocale du navigateur ne sert plus qu'en repli si ces fichiers ne sont pas encore
// en place (ex: juste après une mise à jour, le temps que le déploiement se termine).
const djVoiceClips = [
  'assets/dj-voice/voice-01.mp3',
  'assets/dj-voice/voice-02.mp3',
  'assets/dj-voice/voice-03.mp3',
  'assets/dj-voice/voice-04.mp3',
  'assets/dj-voice/voice-05.mp3',
  'assets/dj-voice/voice-06.mp3',
  'assets/dj-voice/voice-07.mp3',
  'assets/dj-voice/voice-08.mp3',
];
// Set "hype" catégorisé — découpé aux vraies pauses de silence détectées dans l'enregistrement
// (analyse réelle du signal), la catégorie de chaque morceau est une estimation basée sur le
// texte fourni et l'ordre chronologique, pas une transcription mot-à-mot vérifiée.
const djVoiceCategories = {
  intro: ['assets/dj-voice-hype/intro-01.mp3'],
  hype: ['assets/dj-voice-hype/hype-01.mp3'],
  crowd: ['assets/dj-voice-hype/crowd-01.mp3', 'assets/dj-voice-hype/crowd-02.mp3'],
  drop: ['assets/dj-voice-hype/drop-01.mp3', 'assets/dj-voice-hype/drop-02.mp3'],
  outro: ['assets/dj-voice-hype/outro-01.mp3'],
};
// Ducking musique/voix précis : -8 dB pendant la voix, fondu d'entrée 200ms, fondu de
// sortie 300ms — plutôt qu'une coupure nette de volume.
const DJ_DUCK_DB = -8;
const DJ_DUCK_FACTOR = Math.pow(10, DJ_DUCK_DB / 20); // ≈ 0.398
let djDuckRampTimer = null;
function rampRealAudioVolume(to, ms){
  if(djDuckRampTimer) clearInterval(djDuckRampTimer);
  const from = realAudio.volume;
  const steps = Math.max(4, Math.round(ms / 25));
  let i = 0;
  djDuckRampTimer = setInterval(()=>{
    i++;
    realAudio.volume = from + (to - from) * (i / steps);
    if(i >= steps){ clearInterval(djDuckRampTimer); djDuckRampTimer = null; realAudio.volume = to; }
  }, 25);
}
function duckMusicForVoice(){ if(usingRealAudio) rampRealAudioVolume(userVolume * DJ_DUCK_FACTOR, 200); }
function restoreMusicAfterVoice(){ if(usingRealAudio) rampRealAudioVolume(userVolume, 300); }

let djVoiceClipAudio = null;
let djVoiceClipUsedIndexes = new Set();
function djSpeak(force){
  if(!djMode) return;
  if(!force && Math.random() > 0.4) return; // ne parle pas à chaque morceau, sinon ça devient vite lassant

  // Tout lancement du DJ : une intro dédiée si disponible, plutôt qu'une phrase au hasard.
  if(force && djVoiceCategories.intro.length){
    playDjVoiceClip(djVoiceCategories.intro[0]);
    return;
  }

  // Sinon : tirage dans hype/crowd/drop (catégorisé) + le set générique, sans répéter le
  // même clip tant que le stock n'est pas épuisé.
  const pool = [...djVoiceCategories.hype, ...djVoiceCategories.crowd, ...djVoiceCategories.drop, ...djVoiceClips];
  if(pool.length){
    if(djVoiceClipUsedIndexes.size >= pool.length) djVoiceClipUsedIndexes.clear();
    let idx;
    do { idx = Math.floor(Math.random() * pool.length); } while(djVoiceClipUsedIndexes.has(idx));
    djVoiceClipUsedIndexes.add(idx);
    playDjVoiceClip(pool[idx]);
    return;
  }
  djSpeakFallbackTTS(force);
}
function playDjVoiceClip(src){
  if(!djVoiceClipAudio) djVoiceClipAudio = new Audio();
  djVoiceClipAudio.pause();
  djVoiceClipAudio.src = src;
  djVoiceClipAudio.currentTime = 0;
  djVoiceClipAudio.onplay = duckMusicForVoice;
  djVoiceClipAudio.onended = restoreMusicAfterVoice;
  djVoiceClipAudio.onerror = ()=>{ restoreMusicAfterVoice(); djSpeakFallbackTTS(false); }; // fichier introuvable : repli TTS
  djVoiceClipAudio.play().catch(()=>{ restoreMusicAfterVoice(); djSpeakFallbackTTS(false); });
}
function djSpeakFallbackTTS(force){
  if(!('speechSynthesis' in window)) return;
  if(djVoiceUsedIndexes.size >= djVoiceLines.length) djVoiceUsedIndexes.clear();
  let idx;
  do { idx = Math.floor(Math.random() * djVoiceLines.length); } while(djVoiceUsedIndexes.has(idx));
  djVoiceUsedIndexes.add(idx);

  try{
    window.speechSynthesis.cancel(); // évite d'empiler plusieurs annonces si on parle trop vite
    const utter = new SpeechSynthesisUtterance(djVoiceLines[idx]);
    utter.lang = 'fr-FR';
    utter.pitch = 0.9;
    utter.rate = 1.05;
    utter.onstart = duckMusicForVoice;
    utter.onend = restoreMusicAfterVoice;
    utter.onerror = restoreMusicAfterVoice;
    window.speechSynthesis.speak(utter);
  }catch(e){ /* synthèse vocale indisponible sur ce navigateur : pas bloquant */ }
}

// ---------- Fondu enchaîné (crossfade) façon Apple Music DJ ----------
// Quelques secondes avant la fin du morceau en cours, le morceau suivant démarre en
// parallèle sur un second élément audio dédié, à volume 0. Les deux volumes se croisent
// progressivement, puis on "passe la main" au vrai lecteur (realAudio) exactement à la
// même position — aucune coupure nette, aucun redémarrage audible à 0.
const DJ_CROSSFADE_SECONDS = 4;
let djCrossfadeTriggered = false;
let djFadeAudio = null;
let djFadeTimer = null;
function startDjCrossfade(){
  if(!djMode || djQueue.length < 2) return; // pas de morceau suivant : le 'ended' naturel prendra le relais
  const nextTr = djQueue[(djQueuePos + 1) % djQueue.length];
  if(!nextTr || !nextTr.audioUrl) return; // repli sur le comportement naturel si le suivant n'est pas jouable

  if(!djFadeAudio) djFadeAudio = new Audio();
  djFadeAudio.src = nextTr.audioUrl;
  djFadeAudio.currentTime = 0;
  djFadeAudio.volume = 0;
  djFadeAudio.play().catch(()=>{});

  const steps = 28;
  const stepMs = (DJ_CROSSFADE_SECONDS * 1000) / steps;
  let i = 0;
  djFadeTimer = setInterval(()=>{
    i++;
    const t = i / steps;
    realAudio.volume = Math.max(0, userVolume * (1 - t));
    djFadeAudio.volume = Math.min(userVolume, userVolume * t);
    if(i >= steps){
      clearInterval(djFadeTimer);
      djFadeTimer = null;
      const handoffTime = djFadeAudio.currentTime;
      const tr = djAdvanceQueue(); // fait vraiment avancer la file (mêmes règles anti-répétition qu'ailleurs)
      playTrack(tr); // remet tout en ordre : métadonnées, vrai stream compté, historique, avatar, voix…
      realAudio.currentTime = handoffTime; // reprend exactement où le fondu s'est arrêté, pas de saut à 0
      realAudio.volume = userVolume;
    }
  }, stepMs);
}

// ---------- Ajout d'un son local pendant le DJ ----------
// Insère un fichier audio depuis l'ordinateur directement dans la file du mode DJ en cours,
// juste après le morceau en train de jouer — sans passer par tout le formulaire de
// publication (titre/genre/pochette/droits). Reste purement local à cette session : pas
// envoyé à Cloudinary, pas ajouté au catalogue partagé, pas de vrai stream compté (puisque
// ce n'est pas un vrai morceau publié par un artiste).
function handleDjLocalUpload(e){
  const file = e.target.files[0];
  e.target.value = '';
  if(!file) return;
  if(!djMode || !djPlaying){
    toast('Lancez d\'abord le DJ avant d\'ajouter un son local.');
    return;
  }
  const localTrack = {
    t: file.name.replace(/\.[^/.]+$/, ''),
    a: 'Import local',
    p: 'pal-1',
    genre: djModes.find(x=>x.id===djModeId).name,
    likes: 0,
    streams: '0',
    audioUrl: URL.createObjectURL(file),
    isReal: false, // pas de vrai stream compté : fichier local, non publié
  };
  djQueue.splice(djQueuePos + 1, 0, localTrack);
  toast(`"${localTrack.t}" ajouté à la file — jouera juste après le morceau en cours.`);
}

function djTogglePlay(){
  djPlaying = !djPlaying;
  const btn = document.getElementById('dj-play-btn');
  if(djPlaying){
    btn.textContent = '⏸ DJ en cours';
    startDjPlayback();
    djVoiceUsedIndexes.clear();
    djSpeak(true); // annonce toujours au lancement
    toast('NUNI DJ activé — enchaînement automatique selon le mode ' + djModes.find(x=>x.id===djModeId).name + '.');
  } else {
    btn.textContent = '▶ Lancer le DJ';
    djMode = false;
    clearInterval(djTimer);
    if(djFadeTimer){ clearInterval(djFadeTimer); djFadeTimer = null; }
    if(djFadeAudio) djFadeAudio.pause();
    djCrossfadeTriggered = false;
    if(djAvatarInstance) djAvatarInstance.stop();
    if('speechSynthesis' in window) window.speechSynthesis.cancel();
    if(djVoiceClipAudio) djVoiceClipAudio.pause();
    if(djVoiceCategories.outro.length) playDjVoiceClip(djVoiceCategories.outro[0]); // petit mot de fin, si dispo
    if(djDuckRampTimer){ clearInterval(djDuckRampTimer); djDuckRampTimer = null; }
    realAudio.volume = userVolume; // filet de sécurité : jamais de volume coincé bas si on coupe le DJ en pleine phrase
    if(playing) togglePlay();
    toast('NUNI DJ arrêté.');
  }
}
renderDjModes();
updateDjLabels();

let radioMode = false;
let djMode = false;
let genreRadioActive = null;

/* ============ ARTISTES À SUIVRE ============ */
const suggestedArtists = [
  {n:'Bibi Mwana', g:'Rumba · Afro'},
  {n:'Ndombe Junior', g:'Afro'},
  {n:'Kessy Tina', g:'Gospel'},
  {n:'Mbote System', g:'Hip-Hop'},
  {n:'Tcheza Nation', g:'Rap'},
  {n:'Les Anges du Rythme', g:'Traditionnel'},
];
// artist-suggest-row est maintenant rempli dynamiquement par loadFeaturedArtists() plus bas.

/* ============ PROGRESSION RÉELLE (niveau, XP, badges) ============
   Avant : listenerBadges était un tableau codé en dur, identique pour tout le monde,
   jamais branché à aucune vraie donnée. Ici : tout vient de /api/me/progress, calculé
   en direct côté serveur à partir des vraies écoutes, genres, artistes suivis, etc. */
let lastKnownLevel = null; // sert à détecter un vrai passage de niveau entre deux rafraîchissements
async function loadProgress(){
  const badgesRow = document.getElementById('badges-row');
  const levelWrap = document.getElementById('level-progress-wrap');
  if(!badgesRow && !levelWrap) return;
  if(!realAuthToken) return; // besoin d'être connecté pour avoir une vraie progression
  try{
    const res = await fetch(NUNI_API_BASE + '/api/me/progress', {
      headers:{ 'Authorization':'Bearer ' + realAuthToken }
    });
    if(!res.ok) return;
    const data = await res.json();

    if(badgesRow){
      badgesRow.innerHTML = '';
      data.badges.forEach(b=>{
        const chip = document.createElement('div');
        chip.className = 'badge-chip' + (b.locked ? ' locked' : '');
        chip.innerHTML = `<div class="ic">${b.ic}</div><div class="n">${b.n}</div><div class="d">${b.d}</div>`;
        badgesRow.appendChild(chip);
      });
    }
    if(levelWrap){
      levelWrap.style.display = '';
      levelWrap.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:6px;">
          <span style="font-weight:700; color:var(--text);">Niveau ${data.level} — ${data.name}</span>
          <span style="font-size:12px; color:var(--text-faint);">${data.xp} XP${data.xp_for_next ? ' / ' + data.xp_for_next + ' XP' : ' (niveau max)'}</span>
        </div>
        <div style="height:8px; border-radius:999px; background:rgba(244,238,225,0.1); overflow:hidden;">
          <div style="height:100%; width:${data.progress_pct}%; background:var(--grad-envol); border-radius:999px; transition:width .6s ease;"></div>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
          ${data.next_level_name ? `<p style="font-size:11px; color:var(--text-faint); margin:0;">Prochain niveau : ${data.next_level_name}</p>` : '<span></span>'}
          <span style="font-size:12px; font-weight:700; color:var(--accent,#D4AF6A);">💎 ${data.nuni_points || 0} NUNI Points</span>
        </div>`;
    }
    // Vrai passage de niveau détecté (pas juste au tout premier chargement) — célébration visuelle.
    if(lastKnownLevel !== null && data.level > lastKnownLevel){
      celebrateLevelUp(data.level, data.name);
    }
    lastKnownLevel = data.level;
  }catch(e){ /* pas grave si le serveur est momentanément indisponible */ }
  loadChallenges();
  loadShop();
  loadLeaderboard();
}
loadProgress();

/* Confettis + carte animée au passage de niveau — bien plus marquant qu'un simple toast
   pour le moment le plus gratifiant de la progression. */
function celebrateLevelUp(level, name){
  const overlay = document.getElementById('levelup-overlay');
  if(!overlay) return;
  overlay.innerHTML = `
    <div class="levelup-card">
      <div class="lu-eyebrow">Niveau supérieur</div>
      <div class="lu-title">Niveau ${level} — ${name}</div>
    </div>`;
  const colors = ['#D4AF6A','#1E8449','#C0392B','#8E63C9','#E8C77E'];
  for(let i=0;i<24;i++){
    const c = document.createElement('span');
    c.className = 'levelup-confetti';
    const angle = Math.random()*Math.PI*2;
    const dist = 120 + Math.random()*160;
    c.style.setProperty('--cx', Math.cos(angle)*dist + 'px');
    c.style.setProperty('--cy', Math.sin(angle)*dist + 'px');
    c.style.setProperty('--cr', (Math.random()*720-360) + 'deg');
    c.style.background = colors[Math.floor(Math.random()*colors.length)];
    c.style.animationDelay = (Math.random()*0.15) + 's';
    overlay.appendChild(c);
  }
  overlay.classList.add('show');
  toast(`🎉 Niveau ${level} atteint — ${name} !`);
  hapticPing();
  setTimeout(()=>{ overlay.classList.remove('show'); setTimeout(()=>{ overlay.innerHTML = ''; }, 350); }, 2600);
}

/* ============ CLASSEMENT PUBLIC (XP) ============
   Étape 5 de la gamification. Top 5 affiché sur l'accueil, avec médaille pour le podium.
   Le propre rang de la personne connectée est affiché en dessous si elle n'est pas dans
   le top (pas besoin d'être connecté pour voir le classement, juste pour voir son rang). */
async function loadLeaderboard(){
  const wrap = document.getElementById('shelf-leaderboard');
  const list = document.getElementById('leaderboard-list');
  const myRankEl = document.getElementById('leaderboard-my-rank');
  if(!wrap || !list) return;
  try{
    const headers = realAuthToken ? { 'Authorization':'Bearer ' + realAuthToken } : {};
    const res = await fetch(NUNI_API_BASE + '/api/leaderboard', { headers });
    if(!res.ok) return;
    const data = await res.json();
    if(!data.top || !data.top.length){ wrap.style.display = 'none'; return; }
    wrap.style.display = '';
    const medals = { 1:'🥇', 2:'🥈', 3:'🥉' };
    list.innerHTML = data.top.slice(0, 5).map(r=>{
      const initial = (r.name || '?').charAt(0).toUpperCase();
      const avatar = r.avatar_url
        ? `<img class="lb-avatar" src="${r.avatar_url}" alt="">`
        : `<div class="lb-avatar">${initial}</div>`;
      return `
        <div class="leaderboard-row${r.rank <= 3 ? ' is-medal' : ''}">
          <div class="lb-rank">${medals[r.rank] || '#' + r.rank}</div>
          ${avatar}
          <div class="lb-name">${r.name}</div>
          <div class="lb-xp">${r.xp} XP</div>
        </div>`;
    }).join('');
    if(myRankEl){
      if(data.my_rank){
        myRankEl.style.display = '';
        myRankEl.textContent = `Votre rang : #${data.my_rank.rank} — ${data.my_rank.xp} XP`;
      } else {
        myRankEl.style.display = 'none';
      }
    }
  }catch(e){ /* pas grave si le serveur est momentanément indisponible */ }
}

/* ============ BOUTIQUE NUNI POINTS ============
   Étape 4 de la gamification. Articles cosmétiques achetés avec les points gagnés en
   écoutant, en se connectant et en complétant des défis — jamais convertibles en FCFA. */
async function loadShop(){
  const wrap = document.getElementById('shelf-shop');
  const row = document.getElementById('shop-row');
  if(!wrap || !row) return;
  if(!realAuthToken){ wrap.style.display = 'none'; return; }
  try{
    const res = await fetch(NUNI_API_BASE + '/api/shop/items', {
      headers:{ 'Authorization':'Bearer ' + realAuthToken }
    });
    if(!res.ok) return;
    const data = await res.json();
    wrap.style.display = '';
    row.innerHTML = '';
    data.items.forEach(it=>{
      const icon = it.name.split(' ')[0];
      const label = it.name.replace(/^\S+\s/, '');
      const canAfford = data.points >= it.cost;
      const card = document.createElement('div');
      card.className = 'shop-card' + (it.owned ? ' is-owned' : '');
      card.innerHTML = `
        <div class="sc-ic">${icon}</div>
        <div class="sc-n">${label}</div>
        <div class="sc-cost">${it.owned ? 'Possédé' : '💎 ' + it.cost}</div>
        ${it.owned ? '' : `<button class="sc-buy" ${canAfford ? '' : 'disabled'} onclick="buyShopItem('${it.key}', this)">Acheter</button>`}`;
      row.appendChild(card);
    });
  }catch(e){ /* pas grave si le serveur est momentanément indisponible */ }
}

async function buyShopItem(key, btn){
  if(btn) btn.disabled = true;
  try{
    const res = await fetch(NUNI_API_BASE + '/api/shop/items/' + key + '/buy', {
      method:'POST',
      headers:{ 'Authorization':'Bearer ' + realAuthToken }
    });
    const data = await res.json();
    if(!res.ok){ toast(data.error || 'Achat impossible.'); if(btn) btn.disabled = false; return; }
    toast(data.message || 'Article débloqué !');
    loadProgress();
  }catch(e){ toast('Impossible de contacter le serveur.'); if(btn) btn.disabled = false; }
}

/* ============ DÉFIS QUOTIDIENS / HEBDOMADAIRES ============
   Étape 3 de la gamification. Récompense en XP, cliquée manuellement une fois le défi
   complété (bouton "Récupérer"), pour donner un vrai geste de gratification. */
async function loadChallenges(){
  const wrap = document.getElementById('shelf-challenges');
  const row = document.getElementById('challenges-row');
  if(!wrap || !row) return;
  if(!realAuthToken){ wrap.style.display = 'none'; return; }
  try{
    const res = await fetch(NUNI_API_BASE + '/api/me/challenges', {
      headers:{ 'Authorization':'Bearer ' + realAuthToken }
    });
    if(!res.ok) return;
    const data = await res.json();
    wrap.style.display = '';
    row.innerHTML = '';
    data.challenges.forEach(c=>{
      const pct = Math.min(100, Math.round((c.progress / c.target) * 100));
      const card = document.createElement('div');
      card.className = 'challenge-card' + (c.claimed ? ' is-claimed' : '');
      card.innerHTML = `
        <div class="cc-top">
          <span class="cc-tag">${c.period === 'weekly' ? 'Hebdo' : 'Quotidien'}</span>
          <span class="cc-xp">+${c.xp} XP</span>
        </div>
        <div class="cc-title">${c.title}</div>
        <div class="cc-bar-track"><div class="cc-bar-fill" style="width:${pct}%;"></div></div>
        <div class="cc-foot">
          <span>${c.progress}/${c.target}</span>
          ${c.claimed
            ? '<span>✓ Récupéré</span>'
            : c.completed
              ? `<button class="cc-claim" onclick="claimChallenge('${c.key}', this)">Récupérer</button>`
              : '<span>En cours</span>'}
        </div>`;
      row.appendChild(card);
    });
  }catch(e){ /* pas grave si le serveur est momentanément indisponible */ }
}

async function claimChallenge(key, btn){
  if(btn) btn.disabled = true;
  try{
    const res = await fetch(NUNI_API_BASE + '/api/me/challenges/' + key + '/claim', {
      method:'POST',
      headers:{ 'Authorization':'Bearer ' + realAuthToken }
    });
    const data = await res.json();
    if(!res.ok){ toast(data.error || 'Impossible de récupérer la récompense.'); if(btn) btn.disabled = false; return; }
    toast(data.message || 'Récompense récupérée !');
    loadProgress();
  }catch(e){ toast('Impossible de contacter le serveur.'); if(btn) btn.disabled = false; }
}
async function loadFeaturedArtists(){
  const row = document.getElementById('artist-suggest-row');
  if(!row) return;
  try{
    const res = await fetch(NUNI_API_BASE + '/api/artists/featured');
    const data = await res.json();
    const list = data.artists || [];
    row.innerHTML = '';
    if(!list.length){
      row.innerHTML = `<p style="font-size:12.5px; color:var(--text-faint);">Aucun artiste avec un Pass actif pour le moment — revenez bientôt !</p>`;
      return;
    }
    list.forEach(a=>{
      const name = a.artist_name || a.first_name;
      const initials = name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
      const avatarStyle = a.avatar_url ? `background-image:url(${a.avatar_url}); background-size:cover; background-position:center;` : '';
      const card = document.createElement('div');
      card.className = 'artist-suggest-card';
      card.innerHTML = `
        <div class="av" style="${avatarStyle}">${a.avatar_url ? '' : initials}</div>
        <div class="n">${name}${a.is_verified ? ' ✅' : ''}</div>
        <div class="g">${a.top_genre || 'Artiste NUNI'}</div>
        <button>Suivre</button>`;
      card.querySelector('.av').onclick = ()=> openArtistPage(name);
      card.querySelector('.n').onclick = ()=> openArtistPage(name);
      card.querySelector('.n').style.cursor = 'pointer';
      card.querySelector('.av').style.cursor = 'pointer';
      const followBtn = card.querySelector('button');
      // Vrai suivi, envoyé au serveur — avant, ce bouton ne faisait que basculer un texte
      // localement, sans jamais toucher la base de données.
      followBtn.onclick = async ()=>{
        if(!realAuthToken){ toast('Connectez-vous pour suivre un artiste et le soutenir.'); return; }
        followBtn.disabled = true;
        try{
          const res2 = await fetch(NUNI_API_BASE + '/api/follow', {
            method:'POST', headers:{'Content-Type':'application/json', 'Authorization':'Bearer ' + realAuthToken},
            body: JSON.stringify({ artistId: a.id })
          });
          const data2 = await res2.json();
          followBtn.disabled = false;
          if(!res2.ok){ toast('❌ ' + (data2.error || 'Erreur.')); return; }
          followBtn.classList.toggle('is-following', data2.following);
          followBtn.textContent = data2.following ? 'Suivi ✓' : 'Suivre';
          toast(data2.following ? `Vous suivez maintenant ${name}.` : `Vous ne suivez plus ${name}.`);
        }catch(e){ followBtn.disabled = false; toast('❌ Impossible de contacter le serveur NUNI.'); }
      };
      row.appendChild(card);
    });
  }catch(e){
    row.innerHTML = `<p style="font-size:12.5px; color:var(--text-faint);">Suggestions momentanément indisponibles.</p>`;
  }
}
loadFeaturedArtists();
// Le serveur change déjà sa sélection tout seul toutes les 30 min (basé sur l'heure) —
// ce setInterval sert juste à rafraîchir l'affichage pour quelqu'un qui reste longtemps
// sur la page sans la recharger.
setInterval(loadFeaturedArtists, 30*60*1000);

/* ============ MOBILE TAB BAR ============ */
function tabNav(view){
  enterApp(view);
  document.querySelectorAll('.tab-btn').forEach(b=> b.classList.toggle('is-active', b.dataset.tab===view));
}

/* ============ RECHERCHE ============ */
function runSearch(q){
  const box = document.getElementById('search-results');
  box.classList.add('open');
  const query = q.trim().toLowerCase();
  if(!query){ box.innerHTML = '<div class="sr-empty">Tapez pour rechercher un titre, un artiste, un album ou un clip.</div>'; return; }

  // artistes uniques correspondants (résultat prioritaire pour retrouver vite un artiste)
  const artistNames = [...new Set(tracks.map(t=>t.a))];
  const artistMatches = artistNames.filter(a => a.toLowerCase().includes(query)).slice(0, 4);

  const trackMatches = tracks.filter(t =>
    t.t.toLowerCase().includes(query) || t.a.toLowerCase().includes(query) || (t.album||'').toLowerCase().includes(query)
  ).slice(0, 6);

  // Clips — avant, la recherche ne portait que sur les morceaux/albums/artistes, les clips
  // n'apparaissaient jamais, même quand le titre ou l'artiste correspondait exactement.
  const clipMatches = clips.filter(c =>
    (c.title||'').toLowerCase().includes(query) || (c.artist||'').toLowerCase().includes(query)
  ).slice(0, 4);

  if(!artistMatches.length && !trackMatches.length && !clipMatches.length){
    box.innerHTML = '<div class="sr-empty">Aucun résultat pour "' + q + '".</div>'; return;
  }
  box.innerHTML = '';

  artistMatches.forEach(name=>{
    const topTrack = tracks.find(t=>t.a===name);
    const item = document.createElement('div');
    item.className = 'sr-item sr-artist-item';
    const initials = name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    item.innerHTML = `<div class="sr-cover" style="background:var(--grad-envol); display:flex; align-items:center; justify-content:center; border-radius:50%; font-family:var(--font-data); font-weight:700; color:#0A0A10; font-size:12px;">${initials}</div>
      <div><div class="sr-t">${name}</div><div class="sr-a">Artiste — écouter maintenant</div></div>`;
    item.onclick = ()=>{
      openArtistPage(name);
      if(topTrack) playTrack(topTrack);
      box.classList.remove('open');
      document.getElementById('app-search-input').value='';
      toast(`Direction la page de ${name}.`);
    };
    box.appendChild(item);
  });

  trackMatches.forEach(tr=>{
    const item = document.createElement('div');
    item.className = 'sr-item';
    const coverStyle = tr.cover ? `background-image:url(${tr.cover})` : '';
    const badge = (tr.releaseType && tr.releaseType !== 'Single') ? `<span style="display:inline-block; margin-left:6px; padding:1px 7px; border-radius:10px; background:rgba(212,175,106,0.15); color:var(--accent, #D4AF6A); font-size:10px; font-weight:700; letter-spacing:0.5px; vertical-align:middle;">${tr.releaseType}</span>` : '';
    item.innerHTML = `<div class="sr-cover ${tr.cover ? '' : tr.p}" style="${coverStyle}"></div>
      <div><div class="sr-t">${tr.t}${badge}</div><div class="sr-a">${tr.a}${tr.album ? ' · ' + tr.album : ''}</div></div>`;
    item.onclick = ()=>{ enterApp('catalog'); handleTrackCardClick(tr); box.classList.remove('open'); document.getElementById('app-search-input').value=''; };
    box.appendChild(item);
  });

  clipMatches.forEach(c=>{
    const item = document.createElement('div');
    item.className = 'sr-item';
    const coverStyle = c.thumb ? `background-image:url(${c.thumb}); background-size:cover; background-position:center;` : '';
    const clipBadge = `<span style="display:inline-block; margin-left:6px; padding:1px 7px; border-radius:10px; background:rgba(212,175,106,0.15); color:var(--accent, #D4AF6A); font-size:10px; font-weight:700; letter-spacing:0.5px; vertical-align:middle;">🎬 Clip</span>`;
    item.innerHTML = `<div class="sr-cover ${c.thumb ? '' : (c.pal||'pal-1')}" style="${coverStyle}"></div>
      <div><div class="sr-t">${c.title}${clipBadge}</div><div class="sr-a">${c.artist}</div></div>`;
    item.onclick = ()=>{ enterApp('clips'); openClipWatchPage(c); box.classList.remove('open'); document.getElementById('app-search-input').value=''; };
    box.appendChild(item);
  });
}
document.addEventListener('click', (e)=>{
  const wrap = document.querySelector('.app-search-wrap');
  if(wrap && !wrap.contains(e.target)) document.getElementById('search-results').classList.remove('open');
});

/* ============ SÉPARATION INTERFACE CONSOMMATEUR / ARTISTE ============ */
let accountType = 'artist'; // 'artist' ou 'consumer' — démo : on part en vue Artiste (Bibi Mwana)
let demoOverride = false; // true = le bouton démo a été utilisé manuellement, on ignore le vrai compte
function applyAccountType(){
  if(!demoOverride && currentUser){ accountType = currentUser.account_type; }
  const isArtist = accountType === 'artist';
  const hasActivePass = currentUser ? (currentUser.subscription_status === 'active') : true; // true en mode démo
  document.querySelectorAll('.nav-artist-only').forEach(el=> el.style.display = isArtist ? '' : 'none');
  document.querySelectorAll('.nav-consumer-only').forEach(el=> el.style.display = isArtist ? 'none' : '');
  document.querySelectorAll('.tab-artist-only').forEach(el=> el.style.display = isArtist ? '' : 'none');
  document.querySelectorAll('.tab-consumer-only').forEach(el=> el.style.display = isArtist ? 'none' : '');
  const chipLabel = document.querySelector('.user-chip span');
  if(chipLabel) chipLabel.textContent = currentUser ? (currentUser.first_name + ' ' + currentUser.last_name.charAt(0) + '.') : (isArtist ? 'Bibi M.' : 'Auditeur');
  if(currentUser && currentUser.avatar_url){ applyAvatarEverywhere(currentUser.avatar_url); }
  const artistMenuItem = document.getElementById('profile-menu-artist-space');
  if(artistMenuItem) artistMenuItem.style.display = isArtist ? '' : 'none';
  const switchBtn = document.getElementById('account-switch-btn');
  if(switchBtn) switchBtn.textContent = isArtist ? '🎧 Passer en vue Consommateur' : '🎤 Passer en vue Artiste';
  // si l'écran courant n'existe pas côté consommateur, on revient au catalogue
  if(!isArtist){
    const activeLink = document.querySelector('.app-nav-link.is-active');
    if(activeLink && ['artist','dashboard','admin'].includes(activeLink.dataset.appLink)) enterApp('catalog');
  }
}
function switchAccountType(){
  demoOverride = true;
  accountType = accountType === 'artist' ? 'consumer' : 'artist';
  applyAccountType();
  closeProfileMenu();
  toast(accountType === 'artist' ? 'Vue Pass Artiste activée — menu Catalogue, Publicité, Artiste, Dashboard.' : 'Vue Pass Consommateur activée — menu Catalogue, Publicité, Clips, Bibliothèque.');
  if(accountType === 'consumer') enterApp('catalog');
}
function renderLibrary(){
  const plWrap = document.getElementById('library-playlists');
  const hiWrap = document.getElementById('library-history');
  if(plWrap){
    plWrap.innerHTML = '';
    if(!favoritesPlaylist.length){
      plWrap.innerHTML = `<div class="pi-empty">Aucune playlist pour l'instant.<br>Appuyez sur ❤️ sur un titre pour créer votre playlist <b>Favoris</b>.</div>`;
    } else {
      favoritesPlaylist.forEach(tr=>{
        const item = document.createElement('div'); item.className = 'pi-item';
        const covStyle = tr.cover ? `background-image:url(${tr.cover})` : '';
        item.innerHTML = `<div class="cov ${tr.cover?'':tr.p}" style="${covStyle}"></div><div><div class="t">${tr.t}</div><div class="s">${tr.a}</div></div>`;
        item.onclick = ()=> playTrack(tr);
        plWrap.appendChild(item);
      });
    }
  }
  if(hiWrap){
    hiWrap.innerHTML = '';
    const cutoff = Date.now() - 30*60*1000;
    const recent = listeningHistory.filter(h => h.at >= cutoff);
    if(!recent.length){
      hiWrap.innerHTML = `<div class="pi-empty">Rien écouté dans les 30 dernières minutes.</div>`;
    } else {
      recent.forEach(h=>{
        const tr = h.track;
        const mins = Math.max(0, Math.round((Date.now()-h.at)/60000));
        const item = document.createElement('div'); item.className = 'pi-item';
        const covStyle = tr.cover ? `background-image:url(${tr.cover})` : '';
        item.innerHTML = `<div class="cov ${tr.cover?'':tr.p}" style="${covStyle}"></div><div><div class="t">${tr.t}</div><div class="s">${tr.a} · il y a ${mins==0?'moins d\'1 min':mins+' min'}</div></div>`;
        item.onclick = ()=> playTrack(tr);
        hiWrap.appendChild(item);
      });
    }
  }
}

/* ============ MENU PROFIL ============ */
function toggleProfileMenu(){
  document.getElementById('profile-menu').classList.toggle('open');
}
function closeProfileMenu(){
  document.getElementById('profile-menu').classList.remove('open');
}
document.addEventListener('click', (e)=>{
  const wrap = document.querySelector('.profile-menu-wrap');
  if(wrap && !wrap.contains(e.target)) closeProfileMenu();
});
applyAccountType();
sessionRestorePromise = restoreSession();

/* ============ CONTENU DU MENU PROFIL ============ */
let currentLanguage = 'fr';
const languages = [
  { code:'fr', name:'Français', native:'Français' },
  { code:'ln', name:'Lingala', native:'Lingála' },
  { code:'kg', name:'Kikongo', native:'Kikongo' },
  { code:'lr', name:'Lari', native:'Lari' },
];
const homeTranslations = {
  fr: { eyebrow:"La plateforme qui finance directement la musique congolaise", title:"La musique congolaise", em:"mérite son envol." },
  ln: { eyebrow:"Plateforme oyo ezali kofuta directement miziki ya Kongo", title:"Miziki ya Kongo", em:"esengeli kopumbwa." },
  kg: { eyebrow:"Kimvuka kina kefutaka bansiki ya Kongo mu mbote", title:"Nsiki ya Kongo", em:"yifwete kubaka nzila." },
  lr: { eyebrow:"Kimvuka kina kefutaka bansiki ya Kongo mu mbote", title:"Nsiki ya Kongo", em:"yifwete kubaka nzila." },
};
function applyLanguage(code){
  currentLanguage = code;
  const t = homeTranslations[code];
  const eyebrow = document.querySelector('.home-eyebrow');
  const titleEm = document.querySelector('.home-title em');
  const titleText = document.querySelector('.home-title');
  if(eyebrow) eyebrow.textContent = t.eyebrow;
  if(titleText && titleEm){
    titleText.childNodes[0].textContent = t.title + ' ';
    titleEm.textContent = t.em;
  }
}

function openProfileInfo(type){
  const icon = document.getElementById('profile-info-icon');
  const title = document.getElementById('profile-info-title');
  const body = document.getElementById('profile-info-body');
  body.innerHTML = '';

  if(type === 'playlists'){
    icon.textContent = '🎵'; title.textContent = 'Mes playlists';
    if(!favoritesPlaylist.length){
      body.innerHTML = `<div class="pi-empty">Aucune playlist pour l'instant.<br>Appuyez sur ❤️ sur un titre pour créer votre playlist <b>Favoris</b>.</div>`;
    } else {
      const list = document.createElement('div'); list.className = 'pi-list';
      list.innerHTML = `<div style="font-size:11.5px; color:var(--text-faint); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">Favoris — ${favoritesPlaylist.length} titre(s)</div>`;
      favoritesPlaylist.forEach(tr=>{
        const item = document.createElement('div'); item.className = 'pi-item';
        const covStyle = tr.cover ? `background-image:url(${tr.cover})` : '';
        item.innerHTML = `<div class="cov ${tr.cover?'':tr.p}" style="${covStyle}"></div><div><div class="t">${tr.t}</div><div class="s">${tr.a}</div></div>`;
        item.onclick = ()=>{ playTrack(tr); closeProfileInfo(); };
        list.appendChild(item);
      });
      body.appendChild(list);
    }
  }

  else if(type === 'history'){
    icon.textContent = '🕘'; title.textContent = 'Historique';
    const cutoff = Date.now() - 30*60*1000;
    const recent = listeningHistory.filter(h => h.at >= cutoff);
    if(!recent.length){
      body.innerHTML = `<div class="pi-empty">Rien écouté dans les 30 dernières minutes.<br>Lancez un titre pour qu'il apparaisse ici.</div>`;
    } else {
      const list = document.createElement('div'); list.className = 'pi-list';
      list.innerHTML = `<div style="font-size:11.5px; color:var(--text-faint); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">Dans les 30 dernières minutes</div>`;
      recent.forEach(h=>{
        const tr = h.track;
        const mins = Math.max(0, Math.round((Date.now()-h.at)/60000));
        const item = document.createElement('div'); item.className = 'pi-item';
        const covStyle = tr.cover ? `background-image:url(${tr.cover})` : '';
        item.innerHTML = `<div class="cov ${tr.cover?'':tr.p}" style="${covStyle}"></div><div><div class="t">${tr.t}</div><div class="s">${tr.a} · il y a ${mins==0?'moins d\'1 min':mins+' min'}</div></div>`;
        item.onclick = ()=>{ playTrack(tr); closeProfileInfo(); };
        list.appendChild(item);
      });
      body.appendChild(list);
    }
  }

  else if(type === 'subscription'){
    icon.textContent = '💳'; title.textContent = 'Mon abonnement';
    const start = new Date('2026-05-01');
    const expiry = new Date('2026-08-01');
    const fmtDate = d => d.toLocaleDateString('fr-FR', {day:'2-digit', month:'long', year:'numeric'});
    const daysLeft = Math.max(0, Math.ceil((expiry - new Date('2026-07-01')) / 86400000));
    body.innerHTML = `
      <div class="pi-sub-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
          <b>Pass Consommateur</b><span class="pi-status-badge">● Actif</span>
        </div>
        <div class="pi-sub-row"><span>Formule</span><b>Trimestriel — 650 FCFA</b></div>
        <div class="pi-sub-row"><span>Début de l'abonnement</span><b>${fmtDate(start)}</b></div>
        <div class="pi-sub-row"><span>Prochain paiement / expiration</span><b>${fmtDate(expiry)}</b></div>
        <div class="pi-sub-row"><span>Jours restants</span><b>${daysLeft} jours</b></div>
      </div>
      <button class="btn btn-primary" style="width:100%; margin-top:16px;" onclick="closeProfileInfo(); goTo('plans');">Renouveler / changer de Pass</button>`;
  }

  else if(type === 'payments'){
    icon.textContent = '💰'; title.textContent = 'Paiements';
    body.innerHTML = `
      <div class="pi-sub-card" style="margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <b>🎧 Pass Consommateur</b>
        </div>
        <div class="pi-sub-row"><span>Mensuel</span><b>650 FCFA</b></div>
        <div class="pi-sub-row"><span>Trimestriel</span><b>650 FCFA</b></div>
        <div class="pi-sub-row"><span>Annuel</span><b>1 500 FCFA</b></div>
      </div>
      <div class="pi-sub-card">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <b>🎤 Pass Artiste</b>
        </div>
        <div class="pi-sub-row"><span>Trimestriel</span><b>5 000 FCFA</b></div>
        <div class="pi-sub-row"><span>Annuel</span><b>10 000 FCFA</b></div>
      </div>
      <button class="btn btn-primary" style="width:100%; margin-top:16px;" onclick="closeProfileInfo(); goTo('plans');">Voir les Pass</button>`;
  }

  else if(type === 'promo'){
    icon.textContent = '🎁'; title.textContent = 'Codes promo';
    const claimed = 18, total = 30;
    body.innerHTML = `
      <div class="pi-promo-counter">
        <div class="n">${claimed} / ${total}</div>
        <div class="l">codes déjà attribués aux 30 premiers inscrits</div>
      </div>
      <p style="font-size:12.5px; color:var(--text-dim); line-height:1.6; margin-bottom:14px;">Le code <b style="color:var(--accent)">NUNI30</b> offre une réduction exclusive et n'est réservé qu'aux <b>30 premiers utilisateurs</b> connectés sur la plateforme. Il reste <b style="color:var(--accent)">${total-claimed} places</b>.</p>
      <button class="btn btn-primary" style="width:100%;" onclick="closeProfileInfo(); goTo('plans');">Utiliser mon code sur un Pass</button>`;
  }

  else if(type === 'language'){
    icon.textContent = '🌍'; title.textContent = 'Langue';
    const wrap = document.createElement('div'); wrap.className = 'pi-lang-row';
    languages.forEach(l=>{
      const opt = document.createElement('div');
      opt.className = 'pi-lang-opt' + (l.code===currentLanguage ? ' is-active' : '');
      opt.innerHTML = `<div><div class="name">${l.name}</div><div class="native">${l.native}</div></div>${l.code===currentLanguage ? '✅' : ''}`;
      opt.onclick = ()=>{
        applyLanguage(l.code);
        toast(`Langue changée : ${l.name}`);
        openProfileInfo('language');
      };
      wrap.appendChild(opt);
    });
    body.appendChild(wrap);
    const note = document.createElement('p');
    note.style.cssText = 'font-size:11.5px; color:var(--text-faint); margin-top:14px; line-height:1.5;';
    note.textContent = "La traduction complète de l'application arrive progressivement — l'accueil est déjà disponible dans ces 4 langues.";
    body.appendChild(note);
  }

  else if(type === 'contact'){
    icon.textContent = '📩'; title.textContent = 'Nous contacter';
    body.innerHTML = `
      <a class="pi-contact-row" href="mailto:nunimisiki@gmail.com"><span class="ic">📧</span><div><div class="t">nunimisiki@gmail.com</div><div class="s">Réponse sous 48h</div></div></a>
      <a class="pi-contact-row" href="https://wa.me/242068951600" target="_blank"><span class="ic">💬</span><div><div class="t">+242 06 895 16 00</div><div class="s">WhatsApp — service client</div></div></a>
      <a class="pi-contact-row" href="#" onclick="event.preventDefault(); toast('Instagram NUNI — bientôt en ligne.')"><span class="ic">📷</span><div><div class="t">Instagram</div><div class="s">@nunimusic</div></div></a>
      <a class="pi-contact-row" href="#" onclick="event.preventDefault(); toast('Facebook NUNI — bientôt en ligne.')"><span class="ic">👍</span><div><div class="t">Facebook</div><div class="s">NUNI Music</div></div></a>
      <a class="pi-contact-row" href="#" onclick="event.preventDefault(); toast('TikTok NUNI — bientôt en ligne.')"><span class="ic">🎬</span><div><div class="t">TikTok</div><div class="s">@nunimusic</div></div></a>`;
  }

  document.getElementById('profile-info-overlay').classList.add('show');
}
function closeProfileInfo(){
  document.getElementById('profile-info-overlay').classList.remove('show');
}

/* ============ NOTIFICATIONS ============ */
function toggleNotifPanel(){
  const panel = document.getElementById('notif-panel');
  panel.classList.toggle('open');
  if(panel.classList.contains('open')){
    document.getElementById('notif-dot').dataset.zero = '1';
    document.getElementById('notif-dot').style.display = 'none';
  }
}
document.addEventListener('click', (e)=>{
  const wrap = document.querySelector('.notif-wrap');
  if(wrap && !wrap.contains(e.target)) document.getElementById('notif-panel').classList.remove('open');
});

/* ============ FULL-SCREEN PLAYER INIT ============ */
const fpViz = document.getElementById('fp-visualizer');
if(fpViz){
  for(let i=0;i<28;i++){
    const bar = document.createElement('i');
    bar.style.animationDelay = (i*0.05) + 's';
    fpViz.appendChild(bar);
  }
}
const fpCircEq = document.getElementById('fp-circular-eq');
if(fpCircEq){
  const n = 32;
  for(let i=0;i<n;i++){
    const bar = document.createElement('i');
    const deg = (360/n)*i;
    bar.style.transform = `rotate(${deg}deg)`;
    bar.style.animationDelay = (i*0.03) + 's';
    fpCircEq.appendChild(bar);
  }
}

/* ============ MODE VIBE NUNI ============ */
let vibeMode = false, vibeParticleTimer = null;
const vibeEmojis = ['♪','♫','✦','✧'];
function toggleVibeMode(){
  vibeMode = !vibeMode;
  document.getElementById('full-player').classList.toggle('vibe-mode', vibeMode);
  const hint = document.getElementById('fp-vibe-hint');
  hint.textContent = vibeMode ? '✨ Mode Vibe NUNI activé — touchez pour quitter' : '✨ Touchez la pochette pour le Mode Vibe NUNI';
  if(vibeMode){
    toast('Mode Vibe NUNI activé 🌊');
    spawnVibeParticle();
    vibeParticleTimer = setInterval(spawnVibeParticle, 700);
  } else {
    clearInterval(vibeParticleTimer);
  }
}
function spawnVibeParticle(){
  const layer = document.getElementById('fp-vibe-particles');
  if(!layer || !vibeMode) return;
  const p = document.createElement('span');
  p.className = 'vibe-particle';
  p.textContent = vibeEmojis[Math.floor(Math.random()*vibeEmojis.length)];
  p.style.left = (18 + Math.random()*64) + '%';
  p.style.setProperty('--drift', (Math.random()*80-40) + 'px');
  p.style.setProperty('--spin', (Math.random()*50-25) + 'deg');
  p.style.fontSize = (12 + Math.random()*9) + 'px';
  p.style.color = Math.random() > 0.5 ? 'var(--accent)' : 'var(--violet-soft)';
  layer.appendChild(p);
  setTimeout(()=> p.remove(), 3600);
}

syncFullPlayer();

/* ============ PWA — enregistrement du service worker ============ */
if('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  });
}
