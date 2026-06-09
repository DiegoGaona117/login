// ================================================================
//  CONFIGURACIÓN GENERAL
//  Variables principales que puedes cambiar sin tocar el resto
// ================================================================
const WEBHOOK_URL  = 'https://script.google.com/macros/s/AKfycbzTz11_mDjZ0_JoBh2x9z2lAzww9Y2bEdKaVbcw0JQF0XFcvVbNQTz5ZXMGivLLc42GoQ/exec';
const REDIRECT_URL = 'https://diegogaona117.github.io/curso-de-solidworks-modulo-pieza-diego-gaona/mis-cursos.html';
const SESSION_KEY  = 'dg_sesion'; // nombre con el que se guarda en localStorage
const SESSION_DAYS = 30;          // días que dura la sesión antes de pedir login de nuevo


// ================================================================
//  REFERENCIAS AL HTML
//  Captura cada elemento de la página para usarlo en el código
// ================================================================
const btnLogin   = document.getElementById('btnLogin');
const emailEl    = document.getElementById('email');
const passEl     = document.getElementById('password');
const errorMsg   = document.getElementById('errorMsg');
const errorText  = document.getElementById('errorText');
const successMsg = document.getElementById('successMsg');
const spinner    = document.getElementById('spinner');
const btnText    = document.getElementById('btnText');
const togglePass = document.getElementById('togglePass');
const eyeIcon    = document.getElementById('eyeIcon');


// ================================================================
//  VERIFICAR SESIÓN AL CARGAR LA PÁGINA
//  Si el alumno ya inició sesión antes y no ha expirado,
//  lo manda directo al curso sin pedirle datos de nuevo
// ================================================================
window.addEventListener('load', () => {

  // Limpiar campos para evitar que el navegador los rellene solo
  emailEl.value = '';
  passEl.value  = '';
  setTimeout(() => { emailEl.value = ''; passEl.value = ''; }, 200);

  // Buscar sesión guardada en localStorage
  const sesion = localStorage.getItem(SESSION_KEY);
  if (sesion) {
    try {
      const { expira } = JSON.parse(sesion);

      if (expira && Date.now() < expira) {
        // Sesión vigente → mostrar mensaje y redirigir al curso
        successMsg.classList.add('show');
        btnLogin.disabled   = true;
        btnText.textContent = 'Sesión activa...';
        setTimeout(() => { window.location.href = REDIRECT_URL; }, 600);

      } else {
        // Sesión expirada → borrarla para que pida login de nuevo
        localStorage.removeItem(SESSION_KEY);
      }

    } catch {
      // Si el dato guardado está corrupto, borrarlo
      localStorage.removeItem(SESSION_KEY);
    }
  }
});


// ================================================================
//  BOTÓN OJO — MOSTRAR / OCULTAR CONTRASEÑA
//  Cambia el tipo del input entre password y texto visible
// ================================================================
togglePass.addEventListener('click', () => {
  const visible   = passEl.type === 'text';
  passEl.type     = visible ? 'password' : 'text';
  eyeIcon.className = visible ? 'ti ti-eye' : 'ti ti-eye-off';
  togglePass.setAttribute('aria-label', visible ? 'Mostrar contraseña' : 'Ocultar contraseña');
});


// ================================================================
//  FUNCIONES DE MENSAJES Y ESTADO DEL BOTÓN
// ================================================================

// Muestra el mensaje de error con el texto indicado
function showError(msg) {
  errorText.textContent = msg;
  errorMsg.classList.add('show');
  successMsg.classList.remove('show');
}

// Oculta todos los mensajes
function hideMessages() {
  errorMsg.classList.remove('show');
  successMsg.classList.remove('show');
}

// Activa o desactiva el estado de carga del botón (spinner + texto)
function setLoading(loading) {
  btnLogin.disabled     = loading;
  spinner.style.display = loading ? 'block' : 'none';
  btnText.textContent   = loading ? 'Verificando...' : 'Entrar';
}


// ================================================================
//  FUNCIÓN PRINCIPAL DE LOGIN
//  Se ejecuta al dar clic en "Entrar" o presionar Enter
// ================================================================
async function handleLogin() {
  hideMessages();

  const email    = emailEl.value.trim().toLowerCase();
  const password = passEl.value;

  // -- Validaciones locales antes de llamar al servidor --
  if (!email)    { showError('Ingresa tu correo electrónico.'); emailEl.focus(); return; }
  if (!password) { showError('Ingresa tu contraseña.');         passEl.focus();  return; }

  setLoading(true);

  try {
    // -- Armar la URL con los datos y consultar el webhook --
    const url = WEBHOOK_URL
      + '?email='    + encodeURIComponent(email)
      + '&password=' + encodeURIComponent(password);

    const response = await fetch(url, { method: 'GET', redirect: 'follow' });

    // -- Leer y parsear la respuesta JSON del Apps Script --
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); }
    catch { throw new Error('Respuesta inesperada del servidor.'); }

    // -- Evaluar resultado --
    if (data.ok) {
      // ✅ Credenciales correctas:
      // Guardar sesión en localStorage con fecha de expiración
      const expira = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
      localStorage.setItem(SESSION_KEY, JSON.stringify({ email, password, expira }));

      // Mostrar mensaje de éxito y redirigir al curso
      successMsg.classList.add('show');
      setTimeout(() => { window.location.href = REDIRECT_URL; }, 800);

    } else {
      // ❌ Credenciales incorrectas: mostrar error y limpiar contraseña
      showError(data.mensaje || 'Correo o contraseña incorrectos.');
      passEl.value = '';
      passEl.focus();
    }

  } catch (err) {
    // ❌ Error de red o respuesta inválida
    showError('No se pudo conectar con el servidor. Intenta de nuevo.');
    console.error(err);

  } finally {
    // Siempre quitar el estado de carga al terminar
    setLoading(false);
  }
}


// ================================================================
//  EVENTOS DE DISPARO DEL LOGIN
//  Clic en el botón o presionar Enter en cualquier campo
// ================================================================
btnLogin.addEventListener('click', handleLogin);

[emailEl, passEl].forEach(el => {
  el.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
});
