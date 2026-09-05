import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const WORKER_URL = "https://api.d1.dev.mm-cp.uk"; // Ou l'URL workers.dev

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

// Initialisation de l'Auth
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = '../login.html';
    } else {
        currentUser = user;
        await fetchUserProfile(user.uid);
        updateGreeting();
        handleRoute();
    }
});

// Récupérer le profil utilisateur depuis le Worker D1
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
        console.error("Erreur chargement utilisateur D1", e);
    }
}

function updateGreeting() {
    const greetingEl = document.getElementById('user-greeting');
    const name = userProfile?.displayName || currentUser?.email?.split('@')[0] || 'Client';
    greetingEl.textContent = `Bonjour ${name}`;
}

// -------------------------------------------------------------
// ROUTEUR SPA (Gère la navigation et le rafraîchissement)
// -------------------------------------------------------------

function navigateTo(url) {
    history.pushState(null, null, url);
    handleRoute();
}

function handleRoute() {
    const path = window.location.pathname;
    const appView = document.getElementById('app-view');

    // Mise à jour des classes 'active' dans la sidebar
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.toggle('active', item.getAttribute('href') === path);
    });

    // Routage vers les composants
    if (path.includes('/acces')) {
        renderAcces(appView);
    } else if (path.includes('/compte')) {
        renderCompte(appView);
    } else {
        // Par défaut : Mes Projets
        renderProjets(appView);
    }
}

// Capturer les clics sur les liens du menu pour empêcher le rechargement
document.addEventListener('click', e => {
    const target = e.target.closest('[data-link]');
    if (target) {
        e.preventDefault();
        navigateTo(target.getAttribute('href'));
    }
});

// Gérer le bouton Précédent / Suivant du navigateur
window.addEventListener('popstate', handleRoute);

// Déconnexion
document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = '../login.html';
});

// -------------------------------------------------------------
// VUES & COMPOSANTS HTML DYNAMIQUS
// -------------------------------------------------------------

// 1. Vue : Mes Projets
function renderProjets(container) {
    container.innerHTML = `
    <h1 class="view-title">Mes Projets</h1>
    <div class="cards-grid">
      <div class="project-card">
        <div>
          <h3>Morgann Music Platforms — Application Web</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem;">Projet principal client</p>
        </div>
        <span class="status-badge status-en_cours">En cours</span>
        <a href="#" class="btn-action">Voir l'avancée</a>
      </div>
      <div class="project-card">
        <div>
          <h3>Site Vitrine & SEO</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem;">Optimisation globale</p>
        </div>
        <span class="status-badge status-termine">Terminé</span>
        <a href="#" class="btn-action">Voir l'avancée</a>
      </div>
    </div>
  `;
}

// 2. Vue : Mes Accès
function renderAcces(container) {
    container.innerHTML = `
    <h1 class="view-title">Mes Accès & Dépôts</h1>
    <div class="cards-grid">
      <div class="access-card">
        <div>
          <h3>Dépôt GitHub</h3>
          <p style="color: var(--text-muted);">Code source dev-mmcp</p>
        </div>
        <a href="https://github.com/morgannmusic-platform/dev-mmcp" target="_blank" class="btn-action">Ouvrir GitHub</a>
      </div>
      <div class="access-card">
        <div>
          <h3>Environnement de Staging</h3>
          <p style="color: var(--text-muted);">Sous-domaine de prévisualisation</p>
        </div>
        <a href="https://dev.mm-cp.uk" target="_blank" class="btn-action">Accéder</a>
      </div>
    </div>
  `;
}

// 3. Vue : Mon Compte (intégré directement)
function renderCompte(container) {
    container.innerHTML = `
    <h1 class="view-title">Mon Compte</h1>
    <div style="max-width: 500px; background: rgba(255,255,255,0.03); padding: 1.5rem; border-radius: 10px; border: 1px solid var(--border);">
      <div id="status-msg" style="display:none; padding:0.75rem; margin-bottom:1rem; border-radius:6px;"></div>
      <form id="compte-form" class="auth-form" style="display:flex; flex-direction:column; gap:1rem;">
        <div class="form-group">
          <label>Identifiant (UID)</label>
          <input type="text" value="${currentUser.uid}" disabled style="width:100%; padding:0.6rem; border-radius:6px; border:1px solid #333; background:#222; color:#aaa;">
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="acc-email" value="${currentUser.email || ''}" required style="width:100%; padding:0.6rem; border-radius:6px; border:1px solid #444; background:#111; color:#fff;">
        </div>
        <div class="form-group">
          <label>Nom / Prénom</label>
          <input type="text" id="acc-name" value="${userProfile?.displayName || ''}" placeholder="Morgann..." style="width:100%; padding:0.6rem; border-radius:6px; border:1px solid #444; background:#111; color:#fff;">
        </div>
        <div class="form-group">
          <label>Téléphone</label>
          <input type="tel" id="acc-phone" value="${userProfile?.phone || ''}" placeholder="+33 6 00 00 00 00" style="width:100%; padding:0.6rem; border-radius:6px; border:1px solid #444; background:#111; color:#fff;">
        </div>
        <div class="form-group">
          <label>Entreprise / Projet</label>
          <input type="text" id="acc-company" value="${userProfile?.company || ''}" placeholder="MDCP" style="width:100%; padding:0.6rem; border-radius:6px; border:1px solid #444; background:#111; color:#fff;">
        </div>
        <button type="submit" class="btn-action" style="margin-top:0.5rem; cursor:pointer;">Mettre à jour mon profil</button>
      </form>
    </div>
  `;

    // Gestion du formulaire de mise à jour du profil D1
    document.getElementById('compte-form').addEventListener('submit', async (e) => {
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
                msg.textContent = "Profil mis à jour avec succès !";
                msg.style.display = "block";
                msg.style.background = "rgba(34, 197, 94, 0.2)";
                msg.style.color = "#22c55e";
                await fetchUserProfile(currentUser.uid);
                updateGreeting();
            }
        } catch (err) {
            msg.textContent = "Erreur de mise à jour.";
            msg.style.display = "block";
            msg.style.background = "rgba(239, 68, 68, 0.2)";
            msg.style.color = "#ef4444";
        }
    });
}