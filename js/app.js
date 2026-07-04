console.log('🎵 NUNI app.js chargé — version F4 (Vraie fenêtre Connexion email + mot de passe)');
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

/* ============ SYSTÈME DE CODES PROMO ============ */
const promoCodes = {
  'NUNI5': { pct: 5, plan: 'trimestre', expires: '2026-12-31', maxUses: 500, uses: 128, newUsersOnly: false, active: true, desc: 'Campagne de lancement -5% trimestre' },
  'WELCOME5': { pct: 5, plan: 'trimestre', expires: '2026-12-31', maxUses: 1000, uses: 340, newUsersOnly: true, active: true, desc: 'Bienvenue nouveaux utilisateurs' },
  'CONGO2026': { pct: 10, plan: 'trimestre', expires: '2026-08-31', maxUses: 300, uses: 300, newUsersOnly: false, active: true, desc: 'Campagne fête nationale (épuisé)' },
};
const BASE_PRICE_TRIM = 1200;
let appliedPromo = null;

function applyPromoCode(){
  const input = document.getElementById('promo-input');
  const code = input.value.trim().toUpperCase();
  const feedback = document.getElementById('promo-feedback');
  feedback.className = '';
  feedback.innerHTML = '';

  if(!code){ feedback.className='error'; feedback.textContent='Entrez un code promotionnel.'; return; }

  const promo = promoCodes[code];
  const today = new Date('2026-07-01');
  const isExpired = promo && new Date(promo.expires) < today;
  const isExhausted = promo && promo.uses >= promo.maxUses;

  if(!promo || !promo.active || isExpired || isExhausted){
    feedback.className = 'error';
    feedback.textContent = 'Code promotionnel invalide ou expiré.';
    document.getElementById('promo-price-trim').textContent = '1 200 FCFA';
    appliedPromo = null;
    return;
  }

  appliedPromo = { code, ...promo };
  const discount = Math.round(BASE_PRICE_TRIM * promo.pct / 100);
  const newPrice = BASE_PRICE_TRIM - discount;
  document.getElementById('promo-price-trim').innerHTML = `<span class="old-price">1 200 FCFA</span> <span class="new-price">${newPrice.toLocaleString('fr-FR')} FCFA</span>`;

  feedback.className = 'success';
  feedback.innerHTML = `
    <span class="promo-badge">🎉 -${promo.pct}% appliqué</span>
    <div class="promo-breakdown">
      Prix initial : 1 200 FCFA<br>
      Réduction : -${promo.pct}%<br>
      Total : <b>${newPrice.toLocaleString('fr-FR')} FCFA</b> / trimestre
    </div>`;
  toast(`Code ${code} appliqué — ${promo.pct}% de réduction sur le trimestre.`);
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
    if(!res.ok){ clearSession(); return; }
    const data = await res.json();
    realAuthToken = stored.token;
    realUserId = stored.userId;
    currentUser = data.user;
    applyAccountType();
    enterApp('catalog');
    toast(`Bon retour, ${currentUser.first_name} 👋`);
  }catch(e){ /* pas de réseau : on laisse l'écran d'accueil, l'utilisateur pourra réessayer */ }
}
function logoutUser(){
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
  document.getElementById('login-overlay').classList.add('show');
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
    const res = await fetch(NUNI_API_BASE + '/api/login', {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if(!res.ok){
      feedback.style.color = 'var(--rose-braise)';
      feedback.textContent = '❌ ' + data.error;
      btn.disabled = false;
      return;
    }
    realAuthToken = data.token;
    realUserId = data.user.id;
    currentUser = data.user;
    const rememberBox = document.getElementById('login-remember');
    saveSession(data.token, data.user, !rememberBox || rememberBox.checked);

    feedback.style.color = '#7FC79A';
    feedback.textContent = '✅ Connexion réussie — bon retour ' + currentUser.first_name + ' !';
    btn.disabled = false;
    applyAccountType();
    setTimeout(()=>{ closeLoginModal(); enterApp('catalog'); }, 600);
  }catch(e){
    feedback.style.color = 'var(--rose-braise)';
    feedback.textContent = '❌ Impossible de contacter le serveur NUNI.';
    btn.disabled = false;
  }
}

function choosePlan(type){
  pendingPlanType = type;
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
  toast('Compte créé — une fois votre paiement confirmé, vous recevrez un code à saisir ci-dessous.');
  openRedeemModal();
}
function closeWhatsAppModal(){
  document.getElementById('whatsapp-modal-overlay').classList.remove('show');
}

function openRedeemModal(){
  document.getElementById('redeem-feedback').innerHTML = '';
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
async function submitRedeem(){
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
      const loginRes = await fetch(NUNI_API_BASE + '/api/login', {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email, password})
      });
      const loginData = await loginRes.json();
      if(!loginRes.ok){
        feedback.style.color = 'var(--rose-braise)';
        feedback.textContent = '❌ ' + loginData.error;
        btn.disabled = false;
        return;
      }
      realAuthToken = loginData.token;
      realUserId = loginData.user.id;
      currentUser = loginData.user;
      const rememberBox = document.getElementById('redeem-remember');
      saveSession(loginData.token, loginData.user, !rememberBox || rememberBox.checked);
    }

    const res = await fetch(NUNI_API_BASE + '/api/subscribe/redeem', {
      method:'POST',
      headers:{'Content-Type':'application/json', 'Authorization':'Bearer ' + realAuthToken},
      body: JSON.stringify({code})
    });
    const data = await res.json();
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
function toggleMimi(){
  document.getElementById('mimi-widget').classList.toggle('open');
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

function enterApp(view){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('app-shell').classList.add('active');
  document.getElementById('player-bar').style.display = 'flex';
  document.getElementById('mobile-tabbar').style.removeProperty('display');
  document.getElementById('demo-nav').classList.remove('no-player');
  document.getElementById('mimi-widget').classList.remove('no-player');
  if(view === 'catalog') updateGreeting();
  if(view === 'clips') renderClips();
  if(view === 'library') renderLibrary();
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
  document.getElementById('artist-page-avatar').textContent = name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  document.getElementById('artist-page-support-btn').setAttribute('onclick', `toast('Merci pour votre soutien à ${name} 🕊️')`);
  document.getElementById('artist-page-calendar-title').textContent = 'Calendrier des sorties — ' + name;
  renderCertificationButton(isOwnArtistPage, reallyVerified);

  const artistTracks = tracks.filter(t=>t.a===name);
  const realTrackOfArtist = artistTracks.find(t=>t.artistId);
  currentArtistPageRealId = realTrackOfArtist ? realTrackOfArtist.artistId : null;
  ['shelf-artist','shelf-artist-trending','shelf-artist-albums'].forEach(id=>{
    const row = document.getElementById(id);
    if(row) row.innerHTML = '';
  });
  fillShelf('shelf-artist', artistTracks.length ? artistTracks : tracks.slice(0,4));
  fillShelf('shelf-artist-trending', [...artistTracks].sort((a,b)=>(b.likes||0)-(a.likes||0)));
  fillShelf('shelf-artist-albums', artistTracks);

  const releaseRow = document.getElementById('artist-release-row');
  if(releaseRow) releaseRow.innerHTML = '';
  fillReleaseRow('artist-release-row', artistReleases);

  renderArtistClips(name);

  enterApp('artist');
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

const genres = [
  {n:'Tout', grad:'linear-gradient(135deg,#6E45A8,#D4AF6A)'},
  {n:'Nouveautés', grad:'linear-gradient(135deg,#C9667A,#3A1530)'},
  {n:'Top Congo', grad:'linear-gradient(135deg,#D4AF6A,#7A4E2A)'},
  {n:'Rap', grad:'linear-gradient(135deg,#1D2550,#0A0A10)'},
  {n:'Rumba', grad:'linear-gradient(135deg,#C0392B,#D4AF6A)'},
  {n:'Gospel', grad:'linear-gradient(135deg,#141A38,#8E63C9)'},
  {n:'Afro', grad:'linear-gradient(135deg,#1E8449,#D4AF6A)'},
  {n:'Hip-Hop', grad:'linear-gradient(135deg,#6E45A8,#0A0A10)'},
  {n:'Traditionnel', grad:'linear-gradient(135deg,#1E8449,#C0392B)'},
];
const genreGrid = document.getElementById('genre-grid');
genres.forEach((g,i)=>{
  const tile = document.createElement('div');
  tile.className = 'genre-tile' + (i===0 ? ' is-active' : '');
  tile.style.background = g.grad;
  const inputId = 'genre-file-' + i;
  tile.innerHTML = `
    <span class="gname">${g.n}</span>
    <label class="gupload" for="${inputId}" title="Changer l'image du genre" onclick="event.stopPropagation()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h3l2-3h6l2 3h3v13H4z"/><circle cx="12" cy="13" r="4"/></svg>
    </label>
    <input type="file" id="${inputId}" accept="image/*" onclick="event.stopPropagation()" onchange="setGenreImage(event, this.closest('.genre-tile'))">`;
  tile.addEventListener('click', ()=>{
    document.querySelectorAll('.genre-tile').forEach(t=>t.classList.remove('is-active'));
    tile.classList.add('is-active');
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
    filtered = [...tracks].slice(0, 8);
    heading = 'Nouveautés';
  } else if(genreName === 'Top Congo'){
    filtered = [...tracks].sort((a,b)=> (b.likes||0) - (a.likes||0)).slice(0, 8);
    heading = 'Top Congo';
  } else {
    filtered = tracks.filter(t => t.genre === genreName);
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
function setGenreImage(e, tile){
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{ tile.style.backgroundImage = `url(${reader.result})`; toast('Image du genre mise à jour.'); };
  reader.readAsDataURL(file);
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
function formatLikes(n){ return n >= 1000 ? (n/1000).toFixed(1).replace('.0','') + 'K' : n; }
const lyricLines = [
  {time:0,   text:"Ce soir la ville respire au rythme du tambour"},
  {time:26,  text:"Chaque voix qui s'élève trouve enfin son retour"},
  {time:52,  text:"Nos rêves prennent racine dans la terre et le son"},
  {time:78,  text:"Mokili ya sika, un monde en chanson"},
  {time:104, text:"On se lève ensemble quand la musique appelle"},
  {time:130, text:"Le Congo dans le cœur, l'envol sous nos ailes"},
  {time:156, text:"Écoute, soutiens, fais grandir notre histoire"},
  {time:180, text:"Nuni nous rassemble, longue vie à la mémoire"},
];
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
function trackCard(tr){
  const card = document.createElement('div');
  card.className = 'track-card';
  const coverInner = tr.cover
    ? `<div class="cover" style="background-image:url(${tr.cover}); background-size:cover; background-position:center;">`
    : `<div class="cover ${tr.p}"><div class="cover-glyph pal-pattern"></div>`;
  const isMultiTrack = tr.releaseType && tr.releaseType !== 'Single';
  card.innerHTML = `
    ${coverInner}
      ${tr.audioUrl ? '<span class="imported-badge" title="Votre import">Vous</span>' : ''}
      ${isMultiTrack ? `<span class="nuni-type-badge" title="${tr.releaseType}">💿 ${tr.releaseType}</span>` : ''}
      <div class="play-fab"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
    </div>
    <div class="ttl">${tr.t}</div>
    <div class="art" style="cursor:pointer;">${tr.a}</div>
    <div class="likes">♥ <span>${formatLikes(tr.likes||0)}</span></div>`;
  card.querySelector('.cover').onclick = ()=> handleTrackCardClick(tr);
  card.querySelector('.ttl').onclick = ()=> handleTrackCardClick(tr);
  card.querySelector('.art').onclick = (e)=>{ e.stopPropagation(); openArtistPage(tr.a); };
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
fillShelf('shelf-new', tracks.slice(0,5));
fillShelf('shelf-top', [...tracks].reverse().slice(0,5));
fillShelf('shelf-playlists', tracks.slice(2,7));
fillShelf('shelf-artist', tracks.filter(t=>t.a==='Bibi Mwana').concat(tracks.slice(0,4)));
fillShelf('shelf-artist-trending', [...tracks.filter(t=>t.a==='Bibi Mwana')].sort((a,b)=> b.likes - a.likes));
fillShelf('shelf-artist-albums', tracks.filter(t=>t.a==='Bibi Mwana'));

/* ============ VRAIS MORCEAUX PUBLIÉS (serveur NUNI) ============ */
function refreshMainShelves(){
  ['shelf-new','shelf-top','shelf-playlists'].forEach(id=>{
    const row = document.getElementById(id);
    if(row) row.innerHTML = '';
  });
  fillShelf('shelf-new', tracks.slice(0,5));
  fillShelf('shelf-top', [...tracks].reverse().slice(0,5));
  fillShelf('shelf-playlists', tracks.slice(2,7));
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
      release: new Date(r.created_at).toLocaleDateString('fr-FR', {day:'2-digit', month:'short', year:'numeric'}),
      verified: !!r.is_verified, likes: r.likes || 0,
      cover: r.cover_url || null, audioUrl: r.audio_url || null, isReal: true,
      releaseType: r.release_type || 'Single',
      artistId: r.artist_id,
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
const artistReleases = [
  {d:'04', m:'Juil', t:'Nzela ya Sika', a:'Single inédit', c:'Dans 4 jours'},
  {d:'18', m:'Août', t:'Envol (Deluxe)', a:'Réédition album', c:'Dans 49 jours'},
  {d:'02', m:'Oct', t:'Tournée Kinshasa', a:'Annonce de dates', c:'Dans 94 jours'},
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
fillReleaseRow('artist-release-row', artistReleases);

/* ============ PLAYER LOGIC ============ */
let playing = false, progressTimer, elapsed = 0, duration = 204; // 3:24
let currentTrack = tracks[0];
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
  currentTrack = tr;
  document.getElementById('player-title').textContent = tr.t;
  document.getElementById('player-artist').textContent = tr.a;
  applyCoverTo(document.getElementById('player-cover'), tr);

  listeningHistory.unshift({ track: tr, at: Date.now() });
  listeningHistory = listeningHistory.slice(0, 60);

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
}
function seek(e){
  const rect = e.currentTarget.getBoundingClientRect();
  const pct = (e.clientX - rect.left) / rect.width;
  elapsed = Math.max(0, Math.min(duration, pct*duration));
  if(usingRealAudio) realAudio.currentTime = elapsed;
  updateProgress();
}
function setVolume(e){
  const rect = e.currentTarget.getBoundingClientRect();
  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  document.querySelectorAll('#volume-fill, #volume-fill-fp').forEach(v=> v.style.width = (pct*100) + '%');
  realAudio.volume = pct;
}
let genreRadioFilter = null;
function nextTrack(){
  const pool = genreRadioFilter ? tracks.filter(t=>t.genre===genreRadioFilter) : tracks;
  const i = pool.findIndex(t=>t.t===currentTrack.t);
  playTrack(pool[(i+1) % pool.length] || pool[0]);
}
function prevTrack(){
  const pool = genreRadioFilter ? tracks.filter(t=>t.genre===genreRadioFilter) : tracks;
  const i = pool.findIndex(t=>t.t===currentTrack.t);
  playTrack(pool[(i-1+pool.length) % pool.length] || pool[0]);
}
function toggleLike(btn){
  btn.classList.toggle('liked');
  document.querySelectorAll('#player-like-btn, #fp-like-btn').forEach(b=> b.classList.toggle('liked', btn.classList.contains('liked')));
  const liked = btn.classList.contains('liked');
  if(liked){
    if(!favoritesPlaylist.find(t=>t.t===currentTrack.t)) favoritesPlaylist.unshift(currentTrack);
  } else {
    favoritesPlaylist = favoritesPlaylist.filter(t=>t.t!==currentTrack.t);
  }
  toast(liked ? 'Ajouté à votre playlist Favoris.' : 'Retiré de votre playlist Favoris.');
}
function shuffleToggle(btn){ btn.style.color = btn.style.color ? '' : 'var(--accent)'; }
function repeatToggle(btn){ btn.style.color = btn.style.color ? '' : 'var(--accent)'; }
function toggleFollow(btn){
  const following = btn.textContent.trim() === 'Suivi ✓';
  if(currentArtistPageRealId && realAuthToken){
    btn.disabled = true;
    fetch(NUNI_API_BASE + '/api/follow', {
      method:'POST', headers:{'Content-Type':'application/json', 'Authorization':'Bearer ' + realAuthToken},
      body: JSON.stringify({ artistId: currentArtistPageRealId })
    }).then(r=>r.json()).then(data=>{
      btn.disabled = false;
      if(data.error){ toast('❌ ' + data.error); return; }
      btn.textContent = data.following ? 'Suivi ✓' : 'Suivre';
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
function handleReleaseCover(e){
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    const preview = document.getElementById('release-cover-preview');
    preview.style.backgroundImage = `url(${reader.result})`;
    preview.innerHTML = '';
    toast(`Pochette sélectionnée pour votre ${currentReleaseType.toLowerCase()}.`);
  };
  reader.readAsDataURL(file);
  e.target.value = '';
}

/* ============ CLIPS — publication + système aléatoire ============ */
let clips = [];
let pendingClipVideoFile = null;
function handleClipThumb(e){
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    const preview = document.getElementById('clip-thumb-preview');
    preview.style.backgroundImage = `url(${reader.result})`;
    preview.innerHTML = '';
  };
  reader.readAsDataURL(file);
  e.target.value = '';
}
function handleClipVideo(e){
  const file = e.target.files[0];
  if(!file) return;
  pendingClipVideoFile = file;
  const status = document.getElementById('clip-upload-status');
  status.innerHTML = `<div class="upload-item"><div class="ui-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 10l5-3v10l-5-3M4 6h11a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"/></svg></div><div class="ui-info"><div class="ui-name">${file.name}</div></div><div class="ui-status" style="color:var(--accent)">Prêt à publier</div></div>`;
  if(!document.getElementById('clip-title-input').value) document.getElementById('clip-title-input').value = file.name.replace(/\.[^/.]+$/, '');
}
function publishClip(){
  const title = document.getElementById('clip-title-input').value.trim();
  const thumbPreview = document.getElementById('clip-thumb-preview');
  const thumbData = thumbPreview.style.backgroundImage;
  const hasThumb = thumbData && thumbData !== '';
  if(!pendingClipVideoFile){ toast('Importez un fichier vidéo avant de publier.'); return; }
  if(!title){ toast('Donnez un titre à votre clip avant de publier.'); return; }
  if(!hasThumb){ toast('Choisissez une miniature avant de publier.'); return; }

  const thumbUrl = thumbData.slice(5, -2);
  const newClip = {
    id: 'clip_' + Date.now(), title, artist:'Bibi Mwana', thumb: thumbUrl,
    videoUrl: URL.createObjectURL(pendingClipVideoFile), views: 0,
    likes: 0, date: new Date().toLocaleDateString('fr-FR', {day:'2-digit', month:'short'}), dur:'—:—'
  };
  clips.unshift(newClip);
  renderClips();
  renderArtistClips('Bibi Mwana');
  toast(`Clip "${title}" publié — visible dans Clips et sur votre page artiste.`);

  document.getElementById('clip-title-input').value = '';
  document.getElementById('clip-upload-status').innerHTML = '';
  pendingClipVideoFile = null;
  thumbPreview.style.backgroundImage = '';
  thumbPreview.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 16l4.5-4.5a2 2 0 0 1 2.8 0L16 16M14 14l1.5-1.5a2 2 0 0 1 2.8 0L20 14M4 6h16v12H4z"/></svg>';
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
    .cw-wrap{max-width:900px; margin:0 auto; padding:60px 24px 80px;}
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
    .cw-related-title{color:#fff; font-size:15px; font-weight:700; margin:26px 0 14px;}
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
  clip.views = (clip.views || 0) + 1;
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
  const videoInner = clip.videoUrl
    ? `<video src="${clip.videoUrl}" controls autoplay></video>`
    : `<div class="cw-video-placeholder">🎬 Aperçu vidéo non fourni pour ce clip de démonstration.</div>`;

  overlay.innerHTML = `
    <button class="cw-close" title="Fermer">✕</button>
    <div class="cw-wrap">
      <div class="cw-video-wrap">${videoInner}</div>
      <div class="cw-title">${clip.title}</div>
      <div class="cw-meta">${formatLikes(clip.views)} vues · ${clip.date || "aujourd'hui"}</div>
      <div class="cw-subrow">
        <div class="cw-artist-block">
          <div class="cw-avatar">${initials}</div>
          <div class="cw-artist-name">${clip.artist}</div>
          <button class="cw-follow-btn">Suivre</button>
        </div>
        <div class="cw-actions">
          <button class="av-icon-btn cw-like-btn" title="J'aime"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg></button>
          <button class="av-icon-btn cw-share-btn" title="Partager"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.5l6.8-3.9M8.6 13.5l6.8 3.9"/></svg></button>
        </div>
      </div>
      <div class="cw-related-title">À suivre</div>
      <div class="cw-related-list"></div>
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
  likeBtn.onclick = ()=>{
    const liked = likeBtn.classList.toggle('is-active');
    clip.likes += liked ? 1 : -1;
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
  const thumbStyle = clip.thumb ? `background-image:url(${clip.thumb}); background-size:cover; background-position:center;` : '';
  const palClass = clip.thumb ? '' : (clip.pal || 'pal-1');
  card.innerHTML = `
    <div class="clip-thumb ${palClass}" style="${thumbStyle}">
      <div class="play-fab"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
      <span class="dur">${clip.dur||'—:—'}</span>
    </div>
    <div class="clip-info">
      <div class="t">${clip.title}</div>
      <div class="a">${clip.artist}</div>
      <div class="meta"><span>👁️ ${formatLikes(clip.views)} vues</span><span>❤️ ${formatLikes(clip.likes)}</span></div>
    </div>`;
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
function seedClips(){
  const artistList = ['Bibi Mwana','Ndombe Junior','Kessy Tina','Mbote System','Les Anges du Rythme','Tcheza Nation'];
  const pals = ['pal-1','pal-2','pal-3','pal-4','pal-5','pal-6'];
  const titles = ['Clip officiel','Session live','Behind the scenes','Freestyle'];
  artistList.forEach((a,i)=>{
    clips.push({
      id:'seed_'+i, title:`${titles[i%titles.length]} — ${a}`, artist:a, thumb:null, pal:pals[i%pals.length],
      videoUrl:null, views: 8000+Math.floor(Math.random()*90000), likes: 300+Math.floor(Math.random()*4000),
      date:'2026', dur: (2+Math.floor(Math.random()*3))+':'+String(10+Math.floor(Math.random()*49)).padStart(2,'0')
    });
  });
  renderClips();
}
seedClips();

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
function toggleClipLike(btn){
  if(!currentClip) return;
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

  const coverUrl = coverData.slice(5, -2); // strip url("...")
  const genre = document.getElementById('rf-genre').value;
  const dateVal = document.getElementById('rf-date').value;
  const releaseLabel = dateVal ? new Date(dateVal).toLocaleDateString('fr-FR', {day:'2-digit', month:'short', year:'numeric'}) : "aujourd'hui";

  const artistDisplayName = (currentUser && currentUser.artist_name) ? currentUser.artist_name : 'Bibi Mwana';
  const filesForUpload = [...uploadedFiles];
  const newTracks = filesForUpload.map((file, i)=>{
    const trackTitle = filesForUpload.length > 1 ? `${titre} · Piste ${i+1}` : titre;
    return {
      t: trackTitle, a: artistDisplayName, p: 'pal-1', album: titre, genre: genre, year: new Date().getFullYear(),
      streams: '0', release: releaseLabel, verified: true, likes: 0,
      cover: coverUrl, audioUrl: URL.createObjectURL(file), releaseType: currentReleaseType
    };
  });
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

  // Envoi réel au serveur NUNI, pour que le morceau soit visible par tous les auditeurs
  if(realAuthToken){
    (async ()=>{
      for(const file of filesForUpload){
        try{
          const audioDataUrl = await fileToDataURL(file);
          await fetch(NUNI_API_BASE + '/api/tracks', {
            method:'POST',
            headers:{'Content-Type':'application/json', 'Authorization':'Bearer ' + realAuthToken},
            body: JSON.stringify({
              title: titre, album: titre, genre: genre, releaseType: currentReleaseType,
              coverUrl: coverUrl, audioUrl: audioDataUrl,
            })
          });
        }catch(e){ toast('⚠️ Un fichier n\'a pas pu être envoyé au serveur (trop volumineux ?). Il reste visible uniquement dans votre navigateur.'); }
      }
      toast('Vos morceaux ont bien été envoyés sur le serveur NUNI — visibles par tous les auditeurs.');
      currentUser.track_count = (currentUser.track_count || 0) + filesForUpload.length;
      loadRealTracks();
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
  coverPreview.style.backgroundImage = '';
  coverPreview.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 16l4.5-4.5a2 2 0 0 1 2.8 0L16 16M14 14l1.5-1.5a2 2 0 0 1 2.8 0L20 14M4 6h16v12H4z"/></svg>';

  // lire immédiatement le son importé pour vérifier qu'il tourne bien
  playTrack(newTracks[0]);
  openFullPlayer();
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
function handlePhotoUpload(e, kind){
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    const url = `url(${reader.result})`;
    if(kind === 'avatar'){
      const dash = document.getElementById('avatar-preview-dash');
      dash.style.backgroundImage = url; dash.textContent = '';
      document.querySelectorAll('.artist-avatar').forEach(el=>{ el.style.backgroundImage = url; el.textContent = ''; });
    } else {
      const dash = document.getElementById('cover-preview-dash');
      dash.style.backgroundImage = url;
      const cover = document.querySelector('.artist-cover');
      if(cover) cover.style.backgroundImage = url;
    }
    toast('Photo mise à jour — visible sur votre profil artiste.');
  };
  reader.readAsDataURL(file);
  e.target.value = '';
}
function handleProfileAvatarUpload(e){
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    document.querySelectorAll('.user-chip .avatar').forEach(el=>{ el.style.backgroundImage = `url(${reader.result})`; el.textContent=''; });
    toast('Photo de profil mise à jour.');
  };
  reader.readAsDataURL(file);
  e.target.value = '';
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
function renderLyrics(){
  const box = document.getElementById('fp-lyrics-lines');
  if(!box) return;
  box.innerHTML = '';
  lyricLines.forEach((l,i)=>{
    const p = document.createElement('p');
    p.textContent = l.text;
    p.dataset.time = l.time;
    p.onclick = ()=>{ elapsed = l.time; updateProgress(); };
    box.appendChild(p);
  });
}
function updateLyricsHighlight(){
  const box = document.getElementById('fp-lyrics-lines');
  if(!box) return;
  const lines = box.querySelectorAll('p');
  let current = 0;
  lyricLines.forEach((l,i)=>{ if(elapsed >= l.time) current = i; });
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
function syncFullPlayer(){
  const tr = currentTrack;
  document.getElementById('fp-title').textContent = tr.t;
  document.getElementById('fp-artist').textContent = tr.a;
  document.getElementById('fp-meta').textContent = `${tr.album} · ${tr.genre} · ${tr.year}`;
  document.getElementById('fp-meta2').textContent = `${tr.streams} écoutes · Sorti le ${tr.release}`;
  document.getElementById('fp-verified').style.display = tr.verified ? 'inline-flex' : 'none';
  const cover = document.getElementById('fp-cover');
  if(tr.cover){
    cover.className = 'cover fp-cover';
    cover.style.backgroundImage = `url(${tr.cover})`;
    cover.innerHTML = '';
    document.getElementById('fp-bg').style.background = `linear-gradient(135deg, var(--violet), var(--bleu-nuit))`;
  } else {
    cover.style.backgroundImage = '';
    cover.className = 'cover fp-cover ' + tr.p;
    cover.innerHTML = '<div class="cover-glyph pal-pattern"></div>';
    document.getElementById('fp-bg').style.background = palGradients[tr.p] || palGradients['pal-1'];
  }
  document.getElementById('fp-bio-avatar').textContent = tr.a.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  document.getElementById('fp-artist-stat').style.display = (tr.a === 'Bibi Mwana') ? 'flex' : 'none';
  renderLyrics();
  updateLyricsHighlight();
  renderFanWall();
  // suggestions
  const similar = document.getElementById('fp-suggest-similar');
  const sameArtist = document.getElementById('fp-suggest-artist');
  if(similar){ similar.innerHTML=''; tracks.filter(t=>t.genre===tr.genre && t.t!==tr.t).slice(0,5).forEach(t=> similar.appendChild(trackCard(t))); if(!similar.children.length) tracks.filter(t=>t.t!==tr.t).slice(0,5).forEach(t=> similar.appendChild(trackCard(t))); }
  if(sameArtist){ sameArtist.innerHTML=''; tracks.filter(t=>t.a===tr.a && t.t!==tr.t).forEach(t=> sameArtist.appendChild(trackCard(t))); if(!sameArtist.children.length) tracks.filter(t=>t.t!==tr.t).slice(0,4).forEach(t=> sameArtist.appendChild(trackCard(t))); }
}

/* ============ DASHBOARD CHART ============ */
const monthly = [
  {m:'Jan', v:31},{m:'Fév', v:38},{m:'Mar', v:42},{m:'Avr', v:36},{m:'Mai', v:44},{m:'Juin', v:48}
];
const max = Math.max(...monthly.map(m=>m.v));
const chart = document.getElementById('bar-chart');
monthly.forEach(m=>{
  const col = document.createElement('div');
  col.className = 'bar-col';
  col.innerHTML = `<div class="bar-fill" style="height:0%" data-h="${(m.v/max*100)}"></div><div class="m-lbl">${m.m}</div>`;
  chart.appendChild(col);
});
setTimeout(()=>{
  document.querySelectorAll('.bar-fill').forEach(b=> b.style.height = b.dataset.h + '%');
}, 300);

updateProgress();

/* ============ LIVE LISTENERS COUNTER (home) ============ */
let impactValue = 184320;
const impactEl = document.getElementById('impact-value');
function formatFCFA(n){ return Math.round(n).toLocaleString('fr-FR'); }
setInterval(()=>{
  impactValue += Math.floor(Math.random()*9) + 1;
  if(impactEl) impactEl.textContent = formatFCFA(impactValue);
}, 2200);

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
const djModes = [
  { id:'club', name:'Club', bpm:126, transition:'Beat Sync', filter: ()=>[...tracks].sort(()=>Math.random()-0.5) },
  { id:'festival', name:'Festival', bpm:132, transition:'Drop enchaîné', filter: ()=>[...tracks].sort((a,b)=>(b.likes||0)-(a.likes||0)) },
  { id:'chill', name:'Chill', bpm:92, transition:'Fondu doux', filter: ()=> tracks.filter(t=>t.genre==='Gospel' || t.genre==='Traditionnel').concat(tracks) },
  { id:'afro', name:'Afro Party', bpm:118, transition:'Crossfade rythmé', filter: ()=> tracks.filter(t=>['Afro','Traditionnel'].includes(t.genre)).concat(tracks) },
  { id:'rapcongo', name:'Rap Congo', bpm:96, transition:'Cut sec', filter: ()=> tracks.filter(t=>t.genre==='Rap') },
  { id:'rumba', name:'Rumba Lounge', bpm:100, transition:'Mix très doux', filter: ()=> tracks.filter(t=>t.genre==='Rumba') },
];
let djModeId = 'club';
let djPlaying = false;
let djQueue = [];
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
function updateDjLabels(){
  const m = djModes.find(x=>x.id===djModeId);
  document.getElementById('dj-mode-label').textContent = m.name;
  document.getElementById('dj-transition-label').textContent = m.transition;
  document.getElementById('dj-bpm-label').textContent = m.bpm;
}
function startDjPlayback(){
  const m = djModes.find(x=>x.id===djModeId);
  djQueue = m.filter();
  if(!djQueue.length){ toast('Aucun titre disponible pour ce mode pour le moment.'); return; }
  radioMode = false; genreRadioActive = null; djMode = true;
  usingRealAudio = false;
  playTrack(djQueue[0]);
  updateDjNowPlaying();
  clearInterval(djTimer);
  djTimer = setInterval(updateDjNowPlaying, 1000);
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
function djTogglePlay(){
  djPlaying = !djPlaying;
  const btn = document.getElementById('dj-play-btn');
  if(djPlaying){
    btn.textContent = '⏸ DJ en cours';
    startDjPlayback();
    toast('NUNI DJ activé — enchaînement automatique selon le mode ' + djModes.find(x=>x.id===djModeId).name + '.');
  } else {
    btn.textContent = '▶ Lancer le DJ';
    djMode = false;
    clearInterval(djTimer);
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
const artistSuggestRow = document.getElementById('artist-suggest-row');

/* ============ BADGES D'AUDITEUR ============ */
const listenerBadges = [
  {ic:'🕊️', n:"Fan de la première heure", d:'Compte créé', locked:false},
  {ic:'🎧', n:'100 titres découverts', d:'62/100', locked:false},
  {ic:'🔥', n:'7 jours d\'écoute d\'affilée', d:'Série en cours', locked:false},
  {ic:'🌍', n:'5 genres explorés', d:'3/5', locked:true},
  {ic:'💛', n:'10 artistes soutenus', d:'4/10', locked:true},
  {ic:'🏆', n:'Top auditeur du mois', d:'Verrouillé', locked:true},
];
const badgesRow = document.getElementById('badges-row');
if(badgesRow){
  listenerBadges.forEach(b=>{
    const chip = document.createElement('div');
    chip.className = 'badge-chip' + (b.locked ? ' locked' : '');
    chip.innerHTML = `<div class="ic">${b.ic}</div><div class="n">${b.n}</div><div class="d">${b.d}</div>`;
    badgesRow.appendChild(chip);
  });
}
if(artistSuggestRow){
  suggestedArtists.forEach(a=>{
    const card = document.createElement('div');
    card.className = 'artist-suggest-card';
    const initials = a.n.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    card.innerHTML = `
      <div class="av">${initials}</div>
      <div class="n">${a.n}</div>
      <div class="g">${a.g}</div>
      <button>Suivre</button>`;
    card.querySelector('.av').onclick = ()=> openArtistPage(a.n);
    card.querySelector('.n').onclick = ()=> openArtistPage(a.n);
    card.querySelector('.n').style.cursor = 'pointer';
    card.querySelector('.av').style.cursor = 'pointer';
    card.querySelector('button').onclick = (e)=>{
      const b = e.currentTarget;
      const now = b.classList.toggle('is-following');
      b.textContent = now ? 'Suivi ✓' : 'Suivre';
      toast(now ? `Vous suivez maintenant ${a.n}.` : `Vous ne suivez plus ${a.n}.`);
    };
    artistSuggestRow.appendChild(card);
  });
}

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
  if(!query){ box.innerHTML = '<div class="sr-empty">Tapez pour rechercher un titre, un artiste ou un album.</div>'; return; }

  // artistes uniques correspondants (résultat prioritaire pour retrouver vite un artiste)
  const artistNames = [...new Set(tracks.map(t=>t.a))];
  const artistMatches = artistNames.filter(a => a.toLowerCase().includes(query)).slice(0, 4);

  const trackMatches = tracks.filter(t =>
    t.t.toLowerCase().includes(query) || t.a.toLowerCase().includes(query) || (t.album||'').toLowerCase().includes(query)
  ).slice(0, 6);

  if(!artistMatches.length && !trackMatches.length){ box.innerHTML = '<div class="sr-empty">Aucun résultat pour "' + q + '".</div>'; return; }
  box.innerHTML = '';

  artistMatches.forEach(name=>{
    const topTrack = tracks.find(t=>t.a===name);
    const item = document.createElement('div');
    item.className = 'sr-item sr-artist-item';
    const initials = name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    item.innerHTML = `<div class="sr-cover" style="background:var(--grad-envol); display:flex; align-items:center; justify-content:center; border-radius:50%; font-family:var(--font-data); font-weight:700; color:#0A0A10; font-size:12px;">${initials}</div>
      <div><div class="sr-t">${name}</div><div class="sr-a">Artiste — écouter maintenant</div></div>`;
    item.onclick = ()=>{
      enterApp('artist');
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
  const artistMenuItem = document.getElementById('profile-menu-artist-space');
  if(artistMenuItem) artistMenuItem.style.display = isArtist ? '' : 'none';
  const switchBtn = document.getElementById('account-switch-btn');
  if(switchBtn) switchBtn.textContent = isArtist ? '🎧 Passer en vue Consommateur' : '🎤 Passer en vue Artiste';
  // si l'écran courant n'existe pas côté consommateur, on revient au catalogue
  if(!isArtist){
    const activeLink = document.querySelector('.app-nav-link.is-active');
    if(activeLink && ['artist','dashboard','admin'].includes(activeLink.dataset.appLink)) enterApp('catalog');
  }
  // si le Pass n'est pas encore actif, on redirige vers l'écran des Pass
  if(currentUser && !hasActivePass && document.getElementById('app-shell').classList.contains('active')){
    goTo('plans');
    toast('Activez votre Pass pour accéder à NUNI — finalisez le paiement sur WhatsApp.');
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
restoreSession();

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
        <div class="pi-sub-row"><span>Formule</span><b>Trimestriel — 1 000 FCFA</b></div>
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
        <div class="pi-sub-row"><span>Trimestriel</span><b>1 000 FCFA</b></div>
        <div class="pi-sub-row"><span>Annuel</span><b>3 500 FCFA</b></div>
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
  p.style.left = (20 + Math.random()*60) + '%';
  p.style.setProperty('--drift', (Math.random()*60-30) + 'px');
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
