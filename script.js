// ================================================================
//  CONFIGURACIÓN GENERAL
// ================================================================
const WEBHOOK_URL  = 'https://script.google.com/macros/s/AKfycbygQ48ZOiIA6abGu0L9fwGLhLkPxapSQd0e2wXis07ZWjL263v42qEoCGEx7CXczirC/exec';
const REDIRECT_URL = 'https://diegogaona117.github.io/curso-de-solidworks-modulo-pieza-diego-gaona/mis-cursos.html';
const SESSION_KEY  = 'dg_sesion';
const SESSION_DAYS = 30;


// ================================================================
//  REFERENCIAS AL HTML
// ================================================================
const btnLogin    = document.getElementById('btnLogin');
const emailEl     = document.getElementById('email');
const passEl      = document.getElementById('password');
const errorMsg    = document.getElementById('errorMsg');
const errorText   = document.getElementById('errorText');
const successMsg  = document.getElementById('successMsg');
const spinner     = document.getElementById('spinner');
const btnText     = document.getElementById('btnText');
const togglePass  = document.getElementById('togglePass');
const eyeIcon     = document.getElementById('eyeIcon');


// ================================================================
//  VERIFICAR SESIÓN AL CARGAR
// ================================================================
window.addEventListener('load', () => {
  emailEl.value = '';
  passEl.value  = '';

  // Bloqueo agresivo de autofill
  emailEl.setAttribute('readonly', true);
  passEl.setAttribute('readonly', true);
  setTimeout(() => {
    emailEl.removeAttribute('readonly');
    passEl.removeAttribute('readonly');
    emailEl.value = '';
    passEl.value  = '';
  }, 300);

  const sesion = localStorage.getItem(SESSION_KEY);
  if (sesion) {
    try {
      const { expira } = JSON.parse(sesion);
      if (expira && Date.now() < expira) {
        successMsg.classList.add('show');
        btnLogin.disabled   = true;
        btnText.textContent = 'Sesión activa...';
        setTimeout(() => { window.location.href = REDIRECT_URL; }, 600);
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
  }
});


// ================================================================
//  BOTÓN OJO — MOSTRAR / OCULTAR CONTRASEÑA
// ================================================================
togglePass.addEventListener('click', () => {
  const visible     = passEl.type === 'text';
  passEl.type       = visible ? 'password' : 'text';
  eyeIcon.className = visible ? 'ti ti-eye' : 'ti ti-eye-off';
  togglePass.setAttribute('aria-label', visible ? 'Mostrar contraseña' : 'Ocultar contraseña');
});


// ================================================================
//  FUNCIONES DE MENSAJES Y ESTADO DEL BOTÓN
// ================================================================
function showError(msg) {
  errorText.textContent = msg;
  errorMsg.classList.add('show');
  successMsg.classList.remove('show');
}

function hideMessages() {
  errorMsg.classList.remove('show');
  successMsg.classList.remove('show');
}

function setLoading(loading) {
  btnLogin.disabled     = loading;
  spinner.style.display = loading ? 'block' : 'none';
  btnText.textContent   = loading ? 'Verificando...' : 'Entrar';
}


// ================================================================
//  FUNCIÓN PRINCIPAL DE LOGIN
// ================================================================
async function handleLogin() {
  hideMessages();

  const email    = emailEl.value.trim().toLowerCase();
  const password = passEl.value;

  if (!email)    { showError('Ingresa tu correo electrónico.'); emailEl.focus(); return; }
  if (!password) { showError('Ingresa tu contraseña.');         passEl.focus();  return; }

  setLoading(true);

  try {
    const url = WEBHOOK_URL
      + '?action=login'
      + '&email='    + encodeURIComponent(email)
      + '&password=' + encodeURIComponent(password);

    const response = await fetch(url, { method: 'GET', redirect: 'follow' });
    const text     = await response.text();
    let data;
    try { data = JSON.parse(text); }
    catch { throw new Error('Respuesta inesperada del servidor.'); }

    if (data.ok) {
      // ✅ Guardar sesión con estado (prueba / completo)
      const expira = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        email,
        password,
        estado: data.estado,  // "prueba" o "completo"
        expira
      }));
      successMsg.classList.add('show');
      setTimeout(() => { window.location.href = REDIRECT_URL; }, 800);
    } else {
      showError(data.mensaje || 'Correo o contraseña incorrectos.');
      passEl.value = '';
      passEl.focus();
    }

  } catch (err) {
    showError('No se pudo conectar con el servidor. Intenta de nuevo.');
    console.error(err);
  } finally {
    setLoading(false);
  }
}


// ================================================================
//  EVENTOS DE DISPARO DEL LOGIN
// ================================================================
btnLogin.addEventListener('click', handleLogin);
[emailEl, passEl].forEach(el => {
  el.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
});
