/**
 * CONSTRUMETRIX - FIREBASE SERVICE v1.0
 * Handles Authentication and Cloud Persistence
 */

// --- CONFIGURATION ---
// IMPORTANT: Replace these values with your actual Firebase Project keys.
// Get them from: Firebase Console > Project Settings > General > Your Apps
const firebaseConfig = {
    apiKey: "AIzaSyAksh0w8PWqAgd_jLJDZfuId971xJjYE78",
    authDomain: "construmetrix.firebaseapp.com",
    projectId: "construmetrix",
    storageBucket: "construmetrix.firebasestorage.app",
    messagingSenderId: "1065701924260",
    appId: "1:1065701924260:web:da908ee2cfcf6b2fd8b531",
    measurementId: "G-Q3MBKXB1C4"
};

// --- INITIALIZATION ---
let app, auth, db;
let currentUser = null;

try {
    if (firebase && firebase.initializeApp) {
        app = firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
        console.log('🔥 Firebase Initialized');

        // Auth State Listener
        auth.onAuthStateChanged(user => {
            currentUser = user;
            updateAuthUI(user);
            if (user) {
                console.log(`User Logged In: ${user.email}`);
            } else {
                // Inject Live Stats into Welcome Screen
                updateWelcomeStats();
            }
        });
    }
} catch (error) {
    console.warn("Firebase Init Failed (Keys likely missing):", error);
}

// --- AUTH ACTIONS ---

window.loginWithGoogle = function () {
    if (!auth) return;
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then((result) => {
            showToast(`Bienvenido ${result.user.displayName}`, "success");
        }).catch((error) => {
            console.error(error);
            showToast("Error Google: " + error.code, "error");
        });
};

window.loginWithMicrosoft = function () {
    if (!auth) return;
    const provider = new firebase.auth.OAuthProvider('microsoft.com');

    // Multi-tenant configuration
    provider.setCustomParameters({
        prompt: 'select_account'
    });

    auth.signInWithPopup(provider)
        .then((result) => {
            showToast(`Azure AD: ${result.user.displayName}`, "success");
        }).catch((error) => {
            console.error("Microsoft Auth Error:", error);
            if (error.code === 'auth/unauthorized-domain') {
                showToast("Dominio no autorizado en Firebase Console", "error");
            } else {
                showToast("Error Microsoft: " + error.code, "error");
            }
        });
};

function updateWelcomeStats() {
    setTimeout(() => {
        const statsEl = document.getElementById('liveStatsCount');
        if (statsEl && window.OFFICIAL_SOURCES) {
            const count = window.OFFICIAL_SOURCES.length || 12;
            statsEl.textContent = count;
            statsEl.parentElement.classList.remove('opacity-0');
        }
    }, 1000);
}

window.loginWithEmail = function () {
    const email = document.getElementById('authEmail').value;
    const pass = document.getElementById('authPass').value;

    if (!email || !pass) {
        showToast("Ingresa correo y contraseña", "warning");
        return;
    }

    auth.signInWithEmailAndPassword(email, pass)
        .then((userCredential) => {
            showToast("Acceso Técnico Exitoso", "success");
        })
        .catch((error) => {
            console.error(error);
            showToast("Credenciales inválidas", "error");
        });
};

window.registerWithEmail = function () {
    const email = document.getElementById('authEmail').value;
    const pass = document.getElementById('authPass').value;

    if (!email || !pass) {
        showToast("Completa todos los campos", "warning");
        return;
    }
    if (pass.length < 6) {
        showToast("Mínimo 6 caracteres", "warning");
        return;
    }

    auth.createUserWithEmailAndPassword(email, pass)
        .then((userCredential) => {
            showToast("Cuenta PRO Creada", "success");
        })
        .catch((error) => {
            console.error(error);
            showToast(error.message, "error");
        });
};

window.toggleAuthMode = function () {
    const title = document.querySelector('#authOverlay h2 span');
    const subtitle = document.querySelector('#authOverlay p.uppercase');
    const mainBtn = document.querySelector('#authOverlay button[onclick^="loginWithEmail"], #authOverlay button[onclick^="registerWithEmail"]');
    const toggleBtn = document.getElementById('toggleAuthBtn');

    if (mainBtn.getAttribute('onclick').includes('loginWithEmail')) {
        title.textContent = "REGISTRO";
        subtitle.textContent = "Crea tu Cuenta Profesional";
        mainBtn.textContent = "Crear Cuenta PRO";
        mainBtn.setAttribute('onclick', 'registerWithEmail()');
        toggleBtn.textContent = "¿Ya tienes cuenta? Entrar";
    } else {
        title.textContent = "TÉCNICO";
        subtitle.textContent = "Seguridad Grado Industrial";
        mainBtn.textContent = "Ingresar al Sistema";
        mainBtn.setAttribute('onclick', 'loginWithEmail()');
        toggleBtn.textContent = "Crear Cuenta PRO";
    }
};

window.logout = function () {
    if (!auth) return;
    auth.signOut().then(() => {
        showToast("Sesión cerrada", "info");
    });
};

function updateAuthUI(user) {
    const btnLogin = document.getElementById('btnLogin');
    const btnLogout = document.getElementById('btnLogout');
    const authOverlay = document.getElementById('authOverlay');

    if (user) {
        // Logged In: Hide Overlay, Update Status
        if (authOverlay) authOverlay.classList.add('hidden');

        if (btnLogin) {
            btnLogin.innerHTML = `<img src="${user.photoURL || 'https://ui-avatars.com/api/?name=' + user.displayName}" class="w-6 h-6 rounded-lg border border-brand/50">`;
            btnLogin.title = `Conectado como: ${user.displayName}`;
            btnLogin.onclick = () => {
                if (confirm('¿Cerrar sesión?')) window.logout();
            };
        }
    } else {
        // Logged Out: Show Overlay
        if (authOverlay) {
            authOverlay.classList.remove('hidden');
            authOverlay.classList.add('flex');
        }

        if (btnLogin) {
            btnLogin.innerHTML = `<i data-lucide="user" class="w-4 h-4 text-gray-400 group-hover:text-brand"></i>`;
            btnLogin.onclick = window.loginWithGoogle;
            if (window.lucide) lucide.createIcons();
        }
    }
}

// --- DATABASE ACTIONS (Future Use) ---
// --- DATABASE ACTIONS ---
window.saveBudgetToCloud = async function (budgetData) {
    const user = firebase.auth().currentUser;
    if (!user || !db) return false;
    try {
        await db.collection('users').doc(user.uid).collection('budgets').add({
            ...budgetData,
            source: 'cloud',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return true;
    } catch (e) {
        console.error("Cloud Save Error", e);
        return false;
    }
};

window.getCloudBudgets = async function () {
    const user = firebase.auth().currentUser;
    if (!user || !db) return [];
    try {
        const snapshot = await db.collection('users').doc(user.uid).collection('budgets')
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Ensure date compatibility with local templates
            date: doc.data().createdAt ? doc.data().createdAt.toDate().toISOString() : new Date().toISOString()
        }));
    } catch (e) {
        console.error("Cloud Fetch Error", e);
        return [];
    }
};
