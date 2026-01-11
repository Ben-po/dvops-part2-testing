const loginForm = document.querySelector('#loginForm');
const loginStatus = document.querySelector('#loginStatus');
const loginSubmitButton = loginForm?.querySelector('button[type="submit"]');

const clearLoginStatus = () => {
  if (!loginStatus) return;
  loginStatus.textContent = '';
  loginStatus.hidden = true;
  loginStatus.className = 'status-message';
  delete loginStatus.dataset.tone;
};

const setLoginStatus = (message, tone = 'info') => {
  if (!loginStatus) return;
  loginStatus.textContent = message;
  loginStatus.dataset.tone = tone;
  loginStatus.hidden = false;
  loginStatus.className = `status-message status-${tone}`;
};

if (loginSubmitButton) {
  loginSubmitButton.addEventListener('click', () => {
    const username = document.querySelector('#login_username').value;
    const password = document.querySelector('#login_password').value;
    if (!username || !password) {
      setLoginStatus('Username and password are required', 'error');
    }
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearLoginStatus();
    const username = document.querySelector('#login_username').value;
    const password = document.querySelector('#login_password').value;
    if (!username || !password) {
      setLoginStatus('Username and password are required', 'error');
      alert('Username and password are required');
      return;
    }

    setLoginStatus('Signing you in...', 'info');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.message || 'Login failed');
        setLoginStatus(data.message || 'Login failed', 'error');
        return;
      }

      setLoginStatus(`Logged in as ${data?.user?.username || username}`, 'success');
    } catch (err) {
      alert('Login failed');
      setLoginStatus('Login failed', 'error');
    }
  });
}

const registerForm = document.querySelector('#registerForm');
// coverage:ignore-start
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.querySelector('#register_username').value;
    const password = document.querySelector('#register_password').value;
    if (!username || !password) {
      alert('Username and password are required');
      return;
    }

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.message || 'Register failed');
    }
  });
}
// coverage:ignore-end
