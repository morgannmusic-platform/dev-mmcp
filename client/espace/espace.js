import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// URL de ton Worker Cloudflare (ajuste si nécessaire)
const WORKER_URL = "https://api.d1.dev.mm-cp.uk";

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDSPUArpApBuK0Cn9VbeMtqk4JC-gqruJc",
  authDomain: "morgann-music-cp.firebaseapp.com",
  projectId: "morgann-music-cp",
  storageBucket: "morgann-music-cp.firebasestorage.app",
  messagingSenderId: "666812685196",
  appId: "1:666812685196:web:d33b0ba0ac444d7d8494a9",
  measurementId: "G-0VNWRZ4XC6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

let currentUser = null;
let userProfile = null;

// 1. Initialisation & Contrôle d'accès Firebase
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // Redirection vers le login si non connecté
    window.location.href = '../login.html';
  } else {
    currentUser = user;
    await fetchUserProfile(user.uid);
    updateGreeting();
    handleRoute(); // Déclenche le rendu de la page courante
  }
});

// Récupération des données du profil en base D1 via le Worker
async function fetchUserProfile(uid) {
  try {
    const res = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'GET_USER', uid })
    });
    const data = await res.json();
    if (data.success && data.user) {
      userProfile = data.user;
    }
  } catch (e) {
    console.error("Erreur lors du chargement des données utilisateur depuis D1 :", e);
  }
}

// Mise à jour du message "Bonjour [prénom/nom]" dans la Navbar
function updateGreeting() {
  const greetingEl = document.getElementById('user-greeting');
  if (greetingEl) {
    const name = userProfile?.displayName || currentUser?.email?.split('@')[0] || 'Client';
    greetingEl.textContent = `Bonjour ${name}`;
  }
}

// -------------------------------------------------------------
// 2. ROUTEUR SPA PAR HASH (#/) — Zéro erreur 404 au rafraîchissement
// -------------------------------------------------------------

function handleRoute() {
  // Récupère la route depuis l'URL (ex: '#/compte' -> '/compte'). Par défaut: '/projets'
  const rawHash = window.location.hash.replace('#', '');
  const path = rawHash || '/projets';
  const appView = document.getElementById('app-view');

  if (!appView) return;

  // Mise à jour de la classe 'active' sur les éléments de la Sidebar
  document.querySelectorAll('.sidebar-item').forEach(item => {
    const itemHref = item.getAttribute('href').replace('#', '');
    item.classList.toggle('active', itemHref === path);
  });

  // Affiche la bonne vue selon le Hash
  if (path.includes('/acces')) {
    renderAcces(appView);
  } else if (path.includes('/compte')) {
    renderCompte(appView);
  } else {
    renderProjets(appView);
  }
}

// Écoute des événements de navigation Hash et du rechargement de la page (F5)
window.addEventListener('hashchange', handleRoute);

// Gestion du bouton de déconnexion
document.addEventListener('click', async (e) => {
  if (e.target && e.target.id === 'logout-btn') {
    await signOut(auth);
    window.location.href = '../login.html';
  }
});

// -------------------------------------------------------------
// 3. VUES ET COMPOSANTS DYNAMIQUES
// -------------------------------------------------------------

// Vue 1 : Mes Projets
function renderProjets(container) {
  container.innerHTML = `
    <h1 class="view-title">Mes Projets</h1>
    <div class="cards-grid">
      <div class="project-card">
        <div>
          <h3 style="margin-bottom: 0.25rem;">Morgann Music Platforms — Application Web</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem;">Plateforme de gestion & services</p>
        </div>
        <span class="status-badge status-en_cours">En cours</span>
        <a href="#" class="btn-action">Voir l'avancée</a>
      </div>
      <div class="project-card">
        <div>
          <h3 style="margin-bottom: 0.25rem;">Site Vitrine & SEO</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem;">Optimisation et référencement</p>
        </div>
        <span class="status-badge status-termine">Terminé</span>
        <a href="#" class="btn-action">Voir l'avancée</a>
      </div>
    </div>
  `;
}

// Vue 2 : Mes Accès
function renderAcces(container) {
  container.innerHTML = `
    <h1 class="view-title">Mes Accès & Dépôts</h1>
    <div class="cards-grid">
      <div class="access-card">
        <div>
          <h3 style="margin-bottom: 0.25rem;">Dépôt GitHub</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem;">Code source dev-mmcp</p>
        </div>
        <a href="https://github.com/morgannmusic-platform/dev-mmcp" target="_blank" rel="noopener noreferrer" class="btn-action">Ouvrir GitHub</a>
      </div>
      <div class="access-card">
        <div>
          <h3 style="margin-bottom: 0.25rem;">Environnement de Staging</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem;">Sous-domaine de prévisualisation</p>
        </div>
        <a href="https://dev.mm-cp.uk" target="_blank" rel="noopener noreferrer" class="btn-action">Accéder</a>
      </div>
    </div>
  `;
}

// Vue 3 : Mon Compte (Formulaire D1 intégré)
function renderCompte(container) {
  container.innerHTML = `
    <h1 class="view-title">Mon Compte</h1>
    <div style="max-width: 520px; background: rgba(255, 255, 255, 0.03); padding: 1.75rem; border-radius: 12px; border: 1px solid var(--border);">
      <div id="status-msg" style="display:none; padding: 0.75rem; margin-bottom: 1.25rem; border-radius: 6px; font-size: 0.9rem; font-weight: 500;"></div>
      <form id="compte-form" class="auth-form" style="display: flex; flex-direction: column; gap: 1.1rem;">
        <div class="form-group">
          <label style="font-size: 0.85rem; color: var(--text-muted);">Identifiant Unique (UID)</label>
          <input type="text" value="${currentUser?.uid || ''}" disabled style="width: 100%; padding: 0.65rem; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.1); background: #1a1e1b; color: #888; cursor: not-allowed;">
        </div>
        <div class="form-group">
          <label style="font-size: 0.85rem; font-weight: 600;">Adresse Email</label>
          <input type="email" id="acc-email" value="${currentUser?.email || ''}" required style="width: 100%; padding: 0.65rem; border-radius: 6px; border: 1px solid var(--border); background: #121513; color: #fff;">
        </div>
        <div class="form-group">
          <label style="font-size: 0.85rem; font-weight: 600;">Nom / Prénom</label>
          <input type="text" id="acc-name" value="${userProfile?.displayName || ''}" placeholder="Ex: Morgann Rachedi" style="width: 100%; padding: 0.65rem; border-radius: 6px; border: 1px solid var(--border); background: #121513; color: #fff;">
        </div>
        <div class="form-group">
          <label style="font-size: 0.85rem; font-weight: 600;">Téléphone</label>
          <input type="tel" id="acc-phone" value="${userProfile?.phone || ''}" placeholder="+33 6 00 00 00 00" style="width: 100%; padding: 0.65rem; border-radius: 6px; border: 1px solid var(--border); background: #121513; color: #fff;">
        </div>
        <div class="form-group">
          <label style="font-size: 0.85rem; font-weight: 600;">Entreprise / Projet</label>
          <input type="text" id="acc-company" value="${userProfile?.company || ''}" placeholder="Ex: MDCP" style="width: 100%; padding: 0.65rem; border-radius: 6px; border: 1px solid var(--border); background: #121513; color: #fff;">
        </div>
        <button type="submit" class="btn-action" style="margin-top: 0.5rem; cursor: pointer; border: none; text-align: center;">Mettre à jour mon profil</button>
      </form>
    </div>
  `;

  // Gestion de la soumission du formulaire vers le Worker D1
  const form = document.getElementById('compte-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('status-msg');

      const payload = {
        action: 'SAVE_USER',
        uid: currentUser.uid,
        email: document.getElementById('acc-email').value,
        displayName: document.getElementById('acc-name').value,
        phone: document.getElementById('acc-phone').value,
        company: document.getElementById('acc-company').value
      };

      try {
        const res = await fetch(WORKER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.success) {
          msg.textContent = "Profil mis à jour avec succès dans la base D1 !";
          msg.style.display = "block";
          msg.style.background = "rgba(34, 197, 94, 0.15)";
          msg.style.border = "1px solid rgba(34, 197, 94, 0.3)";
          msg.style.color = "#22c55e";
          await fetchUserProfile(currentUser.uid);
          updateGreeting();
        } else {
          throw new Error(data.error || "Erreur lors de la sauvegarde");
        }
      } catch (err) {
        msg.textContent = "Erreur de mise à jour : " + err.message;
        msg.style.display = "block";
        msg.style.background = "rgba(239, 68, 68, 0.15)";
        msg.style.border = "1px solid rgba(239, 68, 68, 0.3)";
        msg.style.color = "#ef4444";
      }
    });
  }
}