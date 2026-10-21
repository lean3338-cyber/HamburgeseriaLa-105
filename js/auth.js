/* ===== Cuentas, destacados y puntajes =====
   Dos modos, automáticos:
   - NUBE: si completaste js/firebase-config.js, las cuentas, destacados y puntajes
     se guardan en Firebase (gratis) y los puntajes se suman entre TODOS los clientes.
   - DEMO: si firebase-config.js está vacío, todo se guarda solo en el navegador
     de cada persona (sirve para mostrar el sitio, pero no es compartido). */
const Auth = (() => {
  const cfg = (typeof FIREBASE_CONFIG !== 'undefined' && FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey) ? FIREBASE_CONFIG : null;
  let modo = cfg ? 'nube' : 'local';
  let notificar = () => {};
  let listo = Promise.resolve();

  /* ---------- MODO DEMO (localStorage) ---------- */
  const K_USERS = 'bm_usuarios';
  const K_SES = 'bm_sesion';
  const K_DATA = 'bm_datos';

  const leer = (k, def) => {
    try { return JSON.parse(localStorage.getItem(k)) || def; } catch (e) { return def; }
  };
  const guardar = (k, v) => {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
  };
  async function hash(texto) {
    if (window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    return btoa(unescape(encodeURIComponent(texto)));
  }
  const datos = () => leer(K_DATA, { favoritos: {}, puntajes: {} });

  /* ---------- MODO NUBE (Firebase) ---------- */
  let fb = null;
  let usuarioNube = null;
  let favNube = [];
  let votosNube = {}; // { productoId: { uid: estrellas } }
  let cortarFav = null;

  async function iniciarNube() {
    const V = '10.12.2';
    const base = `https://www.gstatic.com/firebasejs/${V}/`;
    const [appM, authM, fsM] = await Promise.all([
      import(base + 'firebase-app.js'),
      import(base + 'firebase-auth.js'),
      import(base + 'firebase-firestore.js'),
    ]);
    const app = appM.initializeApp(cfg);
    const auth = authM.getAuth(app);
    const db = fsM.getFirestore(app);
    fb = { auth, db, authM, fsM };

    authM.onAuthStateChanged(auth, (u) => {
      if (cortarFav) { cortarFav(); cortarFav = null; }
      favNube = [];
      if (u) {
        usuarioNube = { uid: u.uid, email: u.email, nombre: u.displayName || (u.email || '').split('@')[0] };
        cortarFav = fsM.onSnapshot(fsM.doc(db, 'favoritos', u.uid), (snap) => {
          favNube = snap.exists() ? (snap.data().ids || []) : [];
          notificar();
        }, (e) => console.warn('favoritos:', e));
      } else {
        usuarioNube = null;
      }
      notificar();
    });

    fsM.onSnapshot(fsM.collection(db, 'votos'), (snap) => {
      const v = {};
      snap.forEach((d) => {
        const x = d.data();
        (v[x.productoId] = v[x.productoId] || {})[x.uid] = x.n;
      });
      votosNube = v;
      notificar();
    }, (e) => console.warn('votos:', e));
  }

  function mensajeError(e) {
    switch (e && e.code) {
      case 'auth/email-already-in-use': return 'Ese email ya está registrado. Probá ingresar.';
      case 'auth/weak-password': return 'La contraseña es muy débil (mínimo 6 caracteres).';
      case 'auth/invalid-email': return 'El email no es válido.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential': return 'Email o contraseña incorrectos.';
      case 'auth/too-many-requests': return 'Demasiados intentos. Esperá unos minutos.';
      case 'auth/network-request-failed': return 'Sin conexión. Revisá tu internet.';
      default: return 'Ocurrió un error. Probá de nuevo.';
    }
  }

  /* ---------- API pública ---------- */
  function iniciar(callback) {
    notificar = callback || (() => {});
    if (modo === 'nube') {
      listo = iniciarNube().catch((e) => {
        console.error('No se pudo conectar con Firebase, se usa el modo demo.', e);
        modo = 'local';
        notificar();
      });
    }
    return listo;
  }

  const esNube = () => modo === 'nube';

  function usuario() { return modo === 'nube' ? usuarioNube : leer(K_SES, null); }

  async function registrar(nombre, email, pass) {
    nombre = nombre.trim();
    email = email.trim().toLowerCase();
    if (modo === 'nube') {
      await listo;
      if (modo === 'nube') {
        try {
          const cred = await fb.authM.createUserWithEmailAndPassword(fb.auth, email, pass);
          await fb.authM.updateProfile(cred.user, { displayName: nombre });
          usuarioNube = { uid: cred.user.uid, email, nombre };
          // ficha del cliente (para las estadísticas del dueño)
          fb.fsM.setDoc(fb.fsM.doc(fb.db, 'usuarios', cred.user.uid), { nombre, email, fecha: fb.fsM.serverTimestamp() })
            .catch((e) => console.warn('usuarios:', e));
          notificar();
          return { ok: true };
        } catch (e) { return { ok: false, error: mensajeError(e) }; }
      }
    }
    const usuarios = leer(K_USERS, {});
    if (usuarios[email]) return { ok: false, error: 'Ese email ya está registrado. Probá ingresar.' };
    usuarios[email] = { nombre, pass: await hash(pass) };
    guardar(K_USERS, usuarios);
    guardar(K_SES, { email, nombre });
    return { ok: true };
  }

  async function ingresar(email, pass) {
    email = email.trim().toLowerCase();
    if (modo === 'nube') {
      await listo;
      if (modo === 'nube') {
        try {
          await fb.authM.signInWithEmailAndPassword(fb.auth, email, pass);
          return { ok: true };
        } catch (e) { return { ok: false, error: mensajeError(e) }; }
      }
    }
    const u = leer(K_USERS, {})[email];
    if (!u || u.pass !== (await hash(pass))) return { ok: false, error: 'Email o contraseña incorrectos.' };
    guardar(K_SES, { email, nombre: u.nombre });
    return { ok: true };
  }

  function salir() {
    if (modo === 'nube') { fb && fb.authM.signOut(fb.auth); return; }
    try { localStorage.removeItem(K_SES); } catch (e) {}
  }

  /* Destacados */
  function favoritos() {
    if (modo === 'nube') return usuarioNube ? favNube : [];
    const u = usuario();
    return u ? (datos().favoritos[u.email] || []) : [];
  }
  function esFavorito(id) { return favoritos().includes(id); }
  function toggleFavorito(id) {
    const u = usuario();
    if (!u) return false;
    const actual = favoritos();
    const nueva = actual.includes(id) ? actual.filter((x) => x !== id) : [...actual, id];
    if (modo === 'nube') {
      favNube = nueva; // se ve al instante; Firebase confirma después
      fb.fsM.setDoc(fb.fsM.doc(fb.db, 'favoritos', u.uid), { ids: nueva })
        .catch((e) => { console.error('No se pudo guardar el destacado:', e); notificar(); });
      return true;
    }
    const d = datos();
    d.favoritos[u.email] = nueva;
    guardar(K_DATA, d);
    return true;
  }

  /* Puntajes (1 a 5, un voto por persona por producto) */
  function puntuar(id, estrellas) {
    const u = usuario();
    if (!u) return false;
    if (modo === 'nube') {
      (votosNube[id] = votosNube[id] || {})[u.uid] = estrellas; // se ve al instante
      fb.fsM.setDoc(fb.fsM.doc(fb.db, 'votos', id + '_' + u.uid), { productoId: id, uid: u.uid, n: estrellas })
        .catch((e) => { console.error('No se pudo guardar el puntaje:', e); });
      return true;
    }
    const d = datos();
    d.puntajes[id] = d.puntajes[id] || {};
    d.puntajes[id][u.email] = estrellas;
    guardar(K_DATA, d);
    return true;
  }
  function votosDe(id) {
    return modo === 'nube' ? (votosNube[id] || {}) : (datos().puntajes[id] || {});
  }
  function miPuntaje(id) {
    const u = usuario();
    if (!u) return 0;
    return votosDe(id)[modo === 'nube' ? u.uid : u.email] || 0;
  }
  function promedio(id) {
    const votos = Object.values(votosDe(id));
    if (!votos.length) return { prom: 0, cant: 0 };
    return { prom: votos.reduce((a, b) => a + b, 0) / votos.length, cant: votos.length };
  }

  return { iniciar, esNube, usuario, registrar, ingresar, salir, favoritos, esFavorito, toggleFavorito, puntuar, miPuntaje, promedio };
})();
