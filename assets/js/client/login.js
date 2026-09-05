import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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

const loginForm = document.getElementById('login-form');
const errorDiv = document.getElementById('auth-error');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorDiv.style.display = 'none';

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = 'espace/compte.html';
    } catch (error) {
        errorDiv.textContent = "Identifiants incorrects ou compte inexistant sur Morgann Music Platforms.";
        errorDiv.style.display = 'block';
    }
});