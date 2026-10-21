# Guía: activar cuentas, destacados y puntajes reales (gratis)

Hacelo una sola vez. Tarda unos 10 minutos y no pide tarjeta.

## 1. Crear el proyecto
1. Entrá a https://console.firebase.google.com con una cuenta de Google.
2. **Crear un proyecto** → ponele de nombre `la105` → seguí (podés desactivar Google Analytics).

## 2. Activar las cuentas
1. Menú izquierdo: **Compilación → Authentication → Comenzar**.
2. Pestaña **Método de acceso** → **Correo electrónico/contraseña** → activalo → **Guardar**.

## 3. Crear la base de datos
1. **Compilación → Firestore Database → Crear base de datos**.
2. Ubicación: `southamerica-east1` (São Paulo) → **Siguiente**.
3. Elegí **Modo de producción** → **Crear**.

## 4. Pegar las reglas de seguridad
1. En Firestore, pestaña **Reglas**.
2. Borrá todo y pegá el contenido del archivo `firestore.rules` de esta carpeta.
3. Tocá **Publicar**.

## 5. Conectar el sitio
1. Rueda de arriba a la izquierda → **Configuración del proyecto**.
2. Abajo, en **Tus apps**, tocá el ícono web `</>` → nombre `la105` → **Registrar app**.
3. Te muestra un bloque `firebaseConfig = { ... }`. Copiá los valores.
4. Abrí `js/firebase-config.js` y pegá cada valor entre las comillas.
5. Subí los archivos a GitHub reemplazando los viejos.

## 6. Probar
Abrí el sitio, registrate con un email, tocá un ❤️ y puntuá un producto.
En Firebase deberías ver el usuario en Authentication y los datos en Firestore.
Si en el cuadro de ingreso NO aparece el cartel "Modo demostración", está conectado.

## 7. Panel del dueño (estadísticas)
El panel está en `admin.html` (ej: https://TU-USUARIO.github.io/NOMBRE-REPO/admin.html).
Muestra clientes registrados, productos mejor puntuados y más destacados, registros por día y últimos clientes.

Para que el dueño pueda entrar:
1. Que el dueño se registre en el sitio como cliente (con su email) o que lo haga vos con su email.
2. En Firebase: **Authentication → Usuarios**: copiá el **UID** de esa cuenta.
3. **Firestore Database → Iniciar colección** → nombre `admins`.
4. ID del documento: pegá el **UID** → agregá un campo cualquiera (ej: `rol` = `dueno`) → **Guardar**.
5. Abrí `admin.html`, entrá con ese email y contraseña.

Si entrás con otra cuenta, el panel muestra el UID para que lo puedas dar de alta igual.
Solo las cuentas que están en `admins` pueden ver los datos; las reglas del paso 4 lo garantizan.
Los clientes que se registraron antes de activar el panel no aparecen en "Clientes registrados"
(sí se cuentan sus puntajes y destacados).

## Notas
- Los datos de `firebase-config.js` no son secretos. Lo que protege todo son las reglas del paso 4.
- El plan gratis (Spark) alcanza de sobra para un local chico.
- Si algo falla, abrí el sitio, apretá F12 → Console y mirá los mensajes en rojo.
