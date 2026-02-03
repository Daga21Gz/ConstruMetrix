# Guía de Configuración de Firebase para ConstruMetrix

Para habilitar el inicio de sesión con Google y el guardado de presupuestos en la nube, sigue estos pasos:

## Paso 1: Crear Proyecto en Firebase
1. Ve a [Firebase Console](https://console.firebase.google.com/).
2. Haz clic en **"Agregar proyecto"**.
3. Nómbralo `ConstruMetrix` y dale a "Continuar".
4. Desactiva Google Analytics (no es necesario por ahora) y haz clic en **"Crear proyecto"**.

## Paso 2: Registrar la App Web
1. En la pantalla principal de tu nuevo proyecto, haz clic en el ícono de **Web** (el símbolo `</>`).
2. Nombra la app (ej. `ConstruMetrix Web`).
3. **Importante:** Marca la casilla **"Configurar Firebase Hosting"** si quieres desplegarlo ahí futuramente (opcional, ya usamos GitHub Pages).
4. Haz clic en **"Registrar app"**.

## Paso 3: Obtener las Credenciales
Firebase te mostrará un bloque de código `const firebaseConfig = { ... }`.
Copia SOLO el objeto de configuración, que se ve así:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD...",
  authDomain: "construmetrix-xyz.firebaseapp.com",
  projectId: "construmetrix-xyz",
  storageBucket: "construmetrix-xyz.appspot.com",
  messagingSenderId: "12345...",
  appId: "1:12345..."
};
```

Ve a tu archivo `firebase-service.js` en tu código y reemplaza la sección de configuración con esto.

## Paso 4: Activar Autenticación (Login)
1. En el menú izquierdo de Firebase, ve a **Compilación > Authentication**.
2. Haz clic en **"Comenzar"**.
3. En la pestaña **"Sign-in method"**, selecciona **Google**.
4. Haz clic en **Habilitar**.
5. Elige tu correo de soporte y **Guardar**.

## Paso 5: Activar Base de Datos (Firestore)
1. En el menú izquierdo, ve a **Compilación > Firestore Database**.
2. Haz clic en **"Crear base de datos"**.
3. Selecciona la ubicación (ej. `nam5 (us-central)`).
4. En reglas de seguridad, elige **"Comenzar en modo de prueba"** (para desarrollo) y haz clic en **Crear**.

¡Listo! Tu aplicación ahora tiene un Backend potente y gratuito.
