// firebase-logic.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. INCOLLA QUI LA TUA CONFIGURAZIONE FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyCRmF9nI86avlQlvFfu_-jCHWfHhBCjyDk",
    authDomain: "guardaroba-ai.firebaseapp.com",
    projectId: "guardaroba-ai",
    storageBucket: "guardaroba-ai.firebasestorage.app",
    messagingSenderId: "225907555459",
    appId: "1:225907555459:web:1e0b04b7cf28fc9975afb6",
    measurementId: "G-Z3VV96LEMS"
  };

// Inizializzazione
const appFirebase = initializeApp(firebaseConfig);
const auth = getAuth(appFirebase);
const db = getFirestore(appFirebase);
let currentUser = null;

// Riferimenti UI
const authSection = document.getElementById('auth-section');
const appContent = document.getElementById('app-content');
const emailInput = document.getElementById('emailInput');
const passInput = document.getElementById('passwordInput');
const authError = document.getElementById('authError');

// Gestione Stato Utente
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Utente Loggato
        currentUser = user;
        authSection.style.display = 'none';
        appContent.style.display = 'block';
        console.log("Utente loggato:", user.email);
        
        // Carica i dati dal database e avvia l'app
        await loadUserData(user.uid);
    } else {
        // Utente non loggato
        currentUser = null;
        authSection.style.display = 'block';
        appContent.style.display = 'none';
    }
});

// Funzioni di Login
document.getElementById('btnLogin').addEventListener('click', async () => {
    try {
        await signInWithEmailAndPassword(auth, emailInput.value, passInput.value);
    } catch (e) {
        authError.textContent = "Errore Login: " + e.message;
    }
});

document.getElementById('btnRegister').addEventListener('click', async () => {
    try {
        await createUserWithEmailAndPassword(auth, emailInput.value, passInput.value);
    } catch (e) {
        authError.textContent = "Errore Registrazione: " + e.message;
    }
});

document.getElementById('btnGoogle').addEventListener('click', async () => {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
    } catch (e) {
        authError.textContent = "Errore Google: " + e.message;
    }
});

document.getElementById('btnLogout').addEventListener('click', () => {
    signOut(auth);
    // Pulisce l'app locale
    window.app.wardrobe = [];
    window.app.displayWardrobe();
});

// --- FUNZIONI DATABASE ---

// Carica dati da Firestore
async function loadUserData(uid) {
    const docRef = doc(db, "utenti", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        // Inietta i dati nell'oggetto 'app' globale esistente
        window.app.wardrobe = data.wardrobe || [];
        window.app.apiKey = data.apiKey || ''; // Opzionale: salva anche la key Gemini
        
        // Aggiorna la UI
        window.app.displayWardrobe();
        window.app.updateStats();
        if(data.apiKey) document.getElementById('apiKeyInput').value = data.apiKey;
        
        console.log("Dati caricati dal Cloud!");
    } else {
        console.log("Nessun dato trovato, nuovo utente.");
        window.app.wardrobe = [];
    }
}

// Esponiamo una funzione globale per salvare i dati
window.saveToFirebase = async function(wardrobeData, apiKeyData) {
    if (!currentUser) return;
    
    try {
        await setDoc(doc(db, "utenti", currentUser.uid), {
            wardrobe: wardrobeData,
            apiKey: apiKeyData
        }, { merge: true }); // merge: true non sovrascrive altri campi se ce ne fossero
        console.log("Dati salvati su Firebase!");
    } catch (e) {
        console.error("Errore salvataggio:", e);
        alert("Errore nel salvataggio online");
    }
};