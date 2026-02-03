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
                // Future: Sync templates automatically
                console.log(`User Logged In: ${user.email}`);
            }
        });
    }
} catch (error) {
    console.warn("Firebase Init Failed (Keys likely missing):", error);
}

// --- AUTH ACTIONS ---

window.loginWithGoogle = function () {
    if (!auth) {
        alert("Firebase no está configurado. Por favor edita firebase-service.js con tus keys.");
        return;
    }
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then((result) => {
            showToast(`Bienvenido ${result.user.displayName}`, "success");
        }).catch((error) => {
            console.error(error);
            showToast("Error de autenticación", "error");
        });
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
    const userStatus = document.getElementById('userStatus');
    const userEmail = document.getElementById('userEmail');

    if (!btnLogin) return;

    if (user) {
        // Logged In State
        userStatus.textContent = user.displayName || "Usuario";
        userEmail.textContent = user.email;
        userEmail.classList.remove('hidden');
        btnLogin.onclick = null; // Disable login click on profile
        btnLogin.classList.add('cursor-default');

        // Show Logout
        if (btnLogout) btnLogout.classList.remove('hidden');

    } else {
        // Logged Out State
        userStatus.textContent = "Iniciar Sesión";
        userEmail.textContent = "";
        userEmail.classList.add('hidden');
        btnLogin.onclick = window.loginWithGoogle;
        btnLogin.classList.remove('cursor-default');

        if (btnLogout) btnLogout.classList.add('hidden');
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
