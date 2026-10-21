/* ===== Panel del dueño: estadísticas =====
   Con Firebase conectado muestra los datos de TODOS los clientes (solo para cuentas
   administradoras). Sin Firebase muestra los datos guardados en este navegador (demo). */
(() => {
  const $ = (id) => document.getElementById(id);
  const cfg = (typeof FIREBASE_CONFIG !== 'undefined' && FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey) ? FIREBASE_CONFIG : null;
  let fb = null;
  let uidActual = null;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtFecha = (d) => d ? d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '–';
  const claveDia = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

  function mostrar(cual) {
    ['adminLogin', 'adminDenied', 'adminDash'].forEach((id) => $(id).classList.toggle('hidden', id !== cual));
    $('adminActions').classList.toggle('hidden', cual === 'adminLogin' || !cual);
  }
  function msg(texto) {
    const m = $('adminMsg');
    m.textContent = texto || '';
    m.classList.toggle('hidden', !texto);
  }

  /* ---------- Cálculo de estadísticas ---------- */
  function calcular({ usuarios, favoritos, votos }) {
    const porProducto = productos.map((p) => ({ p, n: 0, suma: 0, favs: 0 }));
    const idx = {};
    porProducto.forEach((x) => { idx[x.p.id] = x; });
    votos.forEach((v) => { const x = idx[v.productoId]; if (x) { x.n++; x.suma += v.n; } });
    let totalFavs = 0;
    favoritos.forEach((f) => (f.ids || []).forEach((id) => { const x = idx[id]; if (x) { x.favs++; totalFavs++; } }));

    const totalVotos = votos.length;
    const promGeneral = totalVotos ? votos.reduce((a, v) => a + v.n, 0) / totalVotos : 0;

    const dias = [];
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    for (let i = 13; i >= 0; i--) { const d = new Date(hoy); d.setDate(d.getDate() - i); dias.push({ d, k: claveDia(d), n: 0 }); }
    usuarios.forEach((u) => { if (u.fecha) { const x = dias.find((y) => y.k === claveDia(u.fecha)); if (x) x.n++; } });

    const ultimos = usuarios.slice().sort((a, b) => (b.fecha || 0) - (a.fecha || 0)).slice(0, 8);
    return { porProducto, totalVotos, promGeneral, totalFavs, dias, ultimos, totalClientes: usuarios.length };
  }

  /* ---------- Dibujo ---------- */
  function barras(filas, textoFn, max) {
    if (!filas.length) return '<p class="admin-empty">Todavía no hay datos.</p>';
    return filas.map((f) => `
      <div class="rank-row">
        <div class="rank-name">${esc(f.p.nombre)}</div>
        <div class="bar"><span style="width:${max ? Math.max(4, Math.round(f.valor / max * 100)) : 0}%"></span></div>
        <div class="rank-val">${textoFn(f)}</div>
      </div>`).join('');
  }

  function dibujar(s) {
    $('kClientes').textContent = s.totalClientes;
    $('kVotos').textContent = s.totalVotos;
    $('kProm').textContent = s.totalVotos ? s.promGeneral.toFixed(1) + ' ★' : '–';
    $('kFavs').textContent = s.totalFavs;

    const conVotos = s.porProducto.filter((x) => x.n > 0)
      .map((x) => ({ ...x, valor: x.suma / x.n }))
      .sort((a, b) => b.valor - a.valor || b.n - a.n).slice(0, 8);
    $('rankRating').innerHTML = barras(conVotos, (f) => `${f.valor.toFixed(1)} ★ <small>(${f.n})</small>`, 5);

    const conFavs = s.porProducto.filter((x) => x.favs > 0)
      .map((x) => ({ ...x, valor: x.favs })).sort((a, b) => b.valor - a.valor).slice(0, 8);
    $('rankFavs').innerHTML = barras(conFavs, (f) => String(f.favs), conFavs.length ? conFavs[0].valor : 0);

    const maxDia = Math.max(1, ...s.dias.map((x) => x.n));
    $('daysChart').innerHTML = s.dias.map((x) => `
      <div class="day" title="${fmtFecha(x.d)}: ${x.n}">
        <span class="day-n">${x.n || ''}</span>
        <span class="day-bar" style="height:${x.n ? Math.max(6, Math.round(x.n / maxDia * 100)) : 2}%"></span>
        <span class="day-l">${x.d.getDate()}/${x.d.getMonth() + 1}</span>
      </div>`).join('');

    $('clientList').innerHTML = s.ultimos.length
      ? s.ultimos.map((u) => `<li><strong>${esc(u.nombre)}</strong><span>${esc(u.email)}</span><em>${fmtFecha(u.fecha)}</em></li>`).join('')
      : '<li class="admin-empty">Todavía no hay clientes registrados.</li>';

    $('updatedAt').textContent = 'Actualizado: ' + new Date().toLocaleString('es-AR');
    mostrar('adminDash');
  }

  /* ---------- Datos: demo (navegador) ---------- */
  function datosLocales() {
    const leer = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) || def; } catch (e) { return def; } };
    const d = leer('bm_datos', { favoritos: {}, puntajes: {} });
    const us = leer('bm_usuarios', {});
    const votos = [];
    Object.keys(d.puntajes).forEach((pid) => Object.keys(d.puntajes[pid]).forEach((em) =>
      votos.push({ productoId: Number(pid), uid: em, n: d.puntajes[pid][em] })));
    return {
      usuarios: Object.keys(us).map((em) => ({ nombre: us[em].nombre, email: em, fecha: null })),
      favoritos: Object.keys(d.favoritos).map((em) => ({ uid: em, ids: d.favoritos[em] })),
      votos,
    };
  }

  /* ---------- Datos: nube (Firebase) ---------- */
  async function iniciarNube() {
    const base = 'https://www.gstatic.com/firebasejs/10.12.2/';
    const [appM, authM, fsM] = await Promise.all([
      import(base + 'firebase-app.js'), import(base + 'firebase-auth.js'), import(base + 'firebase-firestore.js'),
    ]);
    const app = appM.initializeApp(cfg);
    fb = { auth: authM.getAuth(app), db: fsM.getFirestore(app), authM, fsM };
  }

  async function leerColeccion(nombre) {
    const snap = await fb.fsM.getDocs(fb.fsM.collection(fb.db, nombre));
    const out = [];
    snap.forEach((d) => out.push({ id: d.id, ...d.data() }));
    return out;
  }

  async function cargarNube() {
    try {
      const [us, favs, vts] = await Promise.all([leerColeccion('usuarios'), leerColeccion('favoritos'), leerColeccion('votos')]);
      dibujar(calcular({
        usuarios: us.map((u) => ({ nombre: u.nombre, email: u.email, fecha: u.fecha && u.fecha.toDate ? u.fecha.toDate() : null })),
        favoritos: favs.map((f) => ({ uid: f.id, ids: f.ids || [] })),
        votos: vts.map((v) => ({ productoId: Number(v.productoId), uid: v.uid, n: Number(v.n) })),
      }));
    } catch (e) {
      if (e && (e.code === 'permission-denied' || /permission/i.test(e.message || ''))) {
        $('adminUid').textContent = uidActual || '';
        mostrar('adminDenied');
      } else {
        console.error(e);
        mostrar('adminLogin');
        msg('No se pudieron cargar los datos. Revisá tu conexión y probá de nuevo.');
      }
    }
  }

  function errorLogin(e) {
    switch (e && e.code) {
      case 'auth/invalid-email': return 'El email no es válido.';
      case 'auth/too-many-requests': return 'Demasiados intentos. Esperá unos minutos.';
      case 'auth/network-request-failed': return 'Sin conexión. Revisá tu internet.';
      default: return 'Email o contraseña incorrectos.';
    }
  }

  /* ---------- Arranque ---------- */
  async function arrancar() {
    if (!cfg) {
      $('demoBanner').classList.remove('hidden');
      $('adminActions').classList.remove('hidden');
      $('adminLogout').classList.add('hidden');
      $('adminUser').textContent = 'Demo';
      $('refreshBtn').addEventListener('click', () => dibujar(calcular(datosLocales())));
      dibujar(calcular(datosLocales()));
      return;
    }
    try { await iniciarNube(); } catch (e) {
      console.error(e); mostrar('adminLogin'); msg('No se pudo conectar con Firebase.'); return;
    }
    fb.authM.onAuthStateChanged(fb.auth, (u) => {
      if (u) {
        uidActual = u.uid;
        $('adminUser').textContent = u.email;
        cargarNube();
      } else {
        uidActual = null;
        mostrar('adminLogin');
      }
    });
    $('adminLoginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      msg('');
      try {
        await fb.authM.signInWithEmailAndPassword(fb.auth, $('aEmail').value.trim().toLowerCase(), $('aPass').value);
        $('adminLoginForm').reset();
      } catch (err) { msg(errorLogin(err)); }
    });
    const salir = () => fb.authM.signOut(fb.auth);
    $('adminLogout').addEventListener('click', salir);
    $('deniedLogout').addEventListener('click', salir);
    $('refreshBtn').addEventListener('click', cargarNube);
    $('deniedRetry').addEventListener('click', cargarNube);
  }

  arrancar();
})();
