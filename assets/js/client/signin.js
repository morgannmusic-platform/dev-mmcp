import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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

const signinForm = document.getElementById('signin-form');
const errorDiv = document.getElementById('auth-error');

if (signinForm) {
    signinForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorDiv.style.display = 'none';

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            window.location.href = 'espace/index.html';
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                errorDiv.textContent = "Cette adresse email est déjà associée à un compte Morgann Music Platforms.";
            } else if (error.code === 'auth/weak-password') {
                errorDiv.textContent = "Le mot de passe doit contenir au moins 6 caractères.";
            } else {
                errorDiv.textContent = "Erreur lors de la création du compte : " + error.message;
            }
            errorDiv.style.display = 'block';
        }
    });
}