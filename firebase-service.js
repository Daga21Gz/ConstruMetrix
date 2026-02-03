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

                // Show tour if first time (using local check as fallback for now)
                if (!localStorage.getItem('cm_tour_completed')) {
                    setTimeout(() => {
                        if (window.startGuidedTour) window.startGuidedTour();
                        localStorage.setItem('cm_tour_completed', 'true');
                    }, 2000);
                }
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
        const statsEl = document.getElementById('liveStatsCountLaunch');
        if (statsEl && window.OFFICIAL_SOURCES) {
            const count = window.OFFICIAL_SOURCES.length || 12;
            statsEl.textContent = count;
            // No need to remove opacity-0 here as it's handled by preloader transition
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

let currentAuthMode = 'login';
let currentRegStep = 1;
let registrationData = {};

window.toggleAuthMode = function () {
    const title = document.getElementById('authTitle');
    const subtitle = document.getElementById('authSubtitle');
    const mainBtn = document.getElementById('mainAuthBtn');
    const toggleBtn = document.getElementById('toggleAuthBtn');
    const progress = document.getElementById('regProgress');
    const social = document.getElementById('socialAuth');

    if (currentAuthMode === 'login') {
        currentAuthMode = 'register';
        title.innerHTML = 'REGISTRO <span class="text-brand">PRO</span>';
        subtitle.textContent = 'Crea tu Cuenta Profesional';
        mainBtn.textContent = 'Siguiente: Perfil';
        mainBtn.setAttribute('onclick', 'nextAuthStep()');
        toggleBtn.textContent = '¿Ya tienes cuenta? Entrar';
        social.classList.add('hidden');
        progress.classList.remove('hidden');
        currentRegStep = 1;
        updateRegStepsUI();
    } else {
        currentAuthMode = 'login';
        title.innerHTML = 'ACCESO <span class="text-brand">PRO</span>';
        subtitle.textContent = 'Cifrado Grado Industrial';
        mainBtn.textContent = 'Ingresar al Sistema';
        mainBtn.setAttribute('onclick', 'loginWithEmail()');
        toggleBtn.textContent = 'Crear Cuenta PRO';
        social.classList.remove('hidden');
        progress.classList.add('hidden');
        resetAuthSteps();
    }
};

window.nextAuthStep = function () {
    const email = document.getElementById('authEmail').value;
    const pass = document.getElementById('authPass').value;

    if (currentRegStep === 1) {
        if (!email || !pass || pass.length < 6) {
            showToast("Ingresa email y clave (min 6 carac.)", "warning");
            return;
        }
        registrationData.email = email;
        registrationData.pass = pass;
    }

    currentRegStep++;
    updateRegStepsUI();
};

window.prevAuthStep = function () {
    currentRegStep--;
    updateRegStepsUI();
};

window.setAuthProfile = function (profile) {
    registrationData.profile = profile;
    window.nextAuthStep();
};

window.finalRegister = function () {
    const region = document.getElementById('regRegion').value;
    registrationData.region = region;

    // Firebase Core Action
    auth.createUserWithEmailAndPassword(registrationData.email, registrationData.pass)
        .then((userCredential) => {
            const user = userCredential.user;
            // Update profile displayName
            user.updateProfile({
                displayName: `${registrationData.profile.toUpperCase()} User`
            });

            // Save extra metadata to Firestore
            if (db) {
                db.collection('users').doc(user.uid).set({
                    role: registrationData.profile,
                    region: registrationData.region,
                    onboarded: false,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

            showToast("Cuenta PRO Activada", "success");
            resetAuthSteps();
        })
        .catch((error) => {
            console.error(error);
            showToast(error.message, "error");
        });
};

function updateRegStepsUI() {
    document.querySelectorAll('.auth-step').forEach(s => s.classList.add('hidden'));
    document.getElementById(`step${currentRegStep}`).classList.remove('hidden');

    // Update progress dots
    const dots = document.querySelectorAll('.reg-step-dot');
    dots.forEach((dot, i) => {
        if (i < currentRegStep) {
            dot.className = 'reg-step-dot w-8 h-1 bg-brand rounded-full transition-all duration-500';
        } else {
            dot.className = 'reg-step-dot w-8 h-1 bg-white/10 rounded-full transition-all duration-500';
        }
    });

    if (window.lucide) lucide.createIcons();
}

function resetAuthSteps() {
    currentRegStep = 1;
    document.querySelectorAll('.auth-step').forEach(s => s.classList.add('hidden'));
    document.getElementById('step1').classList.remove('hidden');
    const dots = document.querySelectorAll('.reg-step-dot');
    dots.forEach(d => d.className = 'reg-step-dot w-8 h-1 bg-white/10 rounded-full');
}

window.logout = function () {
    if (!auth) return;
    auth.signOut().then(() => {
        showToast("Sesión técnica cerrada", "info");
    });
};

window.recoverToken = function () {
    const email = document.getElementById('authEmail').value;
    if (!email) {
        showToast("Ingresa tu correo para recuperar acceso", "warning");
        return;
    }

    auth.sendPasswordResetEmail(email)
        .then(() => {
            showToast("🔐 Token de recuperación enviado a " + email, "success");
        })
        .catch(error => {
            console.error(error);
            showToast("Error de recuperación: " + error.code, "error");
        });
};

window.openCheckout = function () {
    showToast("💳 Redirigiendo a Pasarela Bancaria v2.0...", "info");
    setTimeout(() => {
        const confirmPay = confirm("SISTEMA DE PAGOS CONSTRUMETRIX\n\nEstás a punto de activar la Suscripción Enterprise 2026.\n\nCosto: $49.00 USD / mes\n¿Proceder con el pago seguro?");
        if (confirmPay) {
            showToast("✅ Pago Procesado. Nodo Activado.", "success");
            // In a real app, update user status in Firestore
        }
    }, 1500);
};

function updateAuthUI(user) {
    const btnLogin = document.getElementById('btnLogin');
    const btnLogout = document.getElementById('btnLogout');
    const authOverlay = document.getElementById('authOverlay');

    if (user) {
        // Logged In: Hide Overlay, Update Status
        if (authOverlay) {
            authOverlay.classList.remove('flex');
            authOverlay.classList.add('hidden');
        }

        // Fetch Extended Profile from Firestore
        if (db) {
            db.collection('users').doc(user.uid).get().then(doc => {
                if (doc.exists) {
                    const profile = doc.data();
                    if (window.STATE) {
                        window.STATE.userProfile = profile;
                        if (window.adaptDashboardToRole) window.adaptDashboardToRole(profile.role);
                    }
                }
            });
        }

        if (btnLogin) {
            const avatarUrl = user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=4f7aff&color=fff`;
            btnLogin.innerHTML = `<img src="${avatarUrl}" class="w-7 h-7 rounded-xl border border-brand/50">`;
            btnLogin.title = `Conectado como: ${user.email}`;
            btnLogin.onclick = () => {
                if (confirm('¿Cerrar sesión técnica?')) window.logout();
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
