// Frontend logic for simple register/login UI
// This is lightweight demo code that calls the backend endpoints at /api/register and /api/login

const $ = (sel) => document.querySelector(sel);

function showLoggedIn(user) {
  $('#loginBtn').style.display = 'none';
  $('#registerBtn').style.display = 'none';
  const logout = $('#logoutBtn');
  logout.style.display = 'inline-block';
  logout.textContent = `Logout (${user.username})`;
}

function showLoggedOut() {
  $('#loginBtn').style.display = 'inline-block';
  $('#registerBtn').style.display = 'inline-block';
  $('#logoutBtn').style.display = 'none';
}

function saveToken(token) { localStorage.setItem('sl_token', token); }
function getToken() { return localStorage.getItem('sl_token'); }
function clearToken() { localStorage.removeItem('sl_token'); }

async function fetchMe() {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) { clearToken(); return null; }
    const data = await res.json();
    return data.success ? data.user : null;
  } catch (e) { return null; }
}

document.addEventListener('DOMContentLoaded', async () => {
  const loginForm = $('#loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const username = $('#login_username').value;
      const password = $('#login_password').value;
      if (!username || !password) return alert('Username and password are required');

      try {
        const res = await fetch('/api/login', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (!res.ok) return alert(data.message || 'Login failed');
        saveToken(data.token);
        alert('Logged in as ' + data.user.username);
        window.location.href = '/';
      } catch (e) { alert('Network error'); }
    });
  }

  const registerForm = $('#registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const username = $('#register_username').value;
      const password = $('#register_password').value;
      if (!username || !password) return alert('Username and password are required');

      try {
        const res = await fetch('/api/register', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (!res.ok) return alert(data.message || 'Register failed');
        saveToken(data.token);
        alert('Registered and logged in as ' + data.user.username);
        window.location.href = '/';
      } catch (e) { alert('Network error'); }
    });
  }

  const logoutBtn = $('#logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearToken();
      showLoggedOut();
      alert('Logged out');
    });
  }

  // Logic for the main page to show logged in/out status
  if (window.location.pathname === '/') {
    const me = await fetchMe();
    if (me) showLoggedIn(me); else showLoggedOut();
  }
});
