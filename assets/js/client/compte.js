import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Remplacer par l'URL de ton Worker Cloudflare lié à la base D1
const WORKER_URL = "https://api.d1.dev.mm-cp.uk";

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

const profileForm = document.getElementById('profile-form');
const statusMsg = document.getElementById('status-msg');
const logoutBtn = document.getElementById('logout-btn');

let currentUser = null;

// Verification de l'état de connexion de l'utilisateur
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = '../login.html';
    } else {
        currentUser = user;
        document.getElementById('uid').value = user.uid;
        document.getElementById('email').value = user.email;

        // Charger les informations existantes depuis le Worker / D1
        await loadUserProfile(user.uid);
    }
});

// Récupération des infos sauvegardées en base D1
async function loadUserProfile(uid) {
    try {
        const response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'GET_USER', uid })
        });

        const data = await response.json();
        if (data.success && data.user) {
            document.getElementById('displayName').value = data.user.displayName || '';
            document.getElementById('phone').value = data.user.phone || '';
            document.getElementById('company').value = data.user.company || '';
        }
    } catch (error) {
        showStatus('Erreur lors du chargement du profil.', true);
    }
}

// Enregistrement des données dans Cloudflare D1
profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentUser) return;

    const payload = {
        action: 'SAVE_USER',
        uid: currentUser.uid,
        email: document.getElementById('email').value,
        displayName: document.getElementById('displayName').value,
        phone: document.getElementById('phone').value,
        company: document.getElementById('company').value
    };

    try {
        const response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (data.success) {
            showStatus('Profil mis à jour avec succès !', false);
        } else {
            showStatus('Erreur lors de la sauvegarde : ' + data.error, true);
        }
    } catch (error) {
        showStatus('Erreur de connexion au serveur.', true);
    }
});

// Bouton de déconnexion
logoutBtn.addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = '../login.html';
});

function showStatus(text, isError) {
    statusMsg.textContent = text;
    statusMsg.style.display = 'block';
    statusMsg.style.backgroundColor = isError ? '#fef2f2' : '#f0fdf4';
    statusMsg.style.borderColor = isError ? '#fecaca' : '#bbf7d0';
    statusMsg.style.color = isError ? '#991b1b' : '#166534';
}