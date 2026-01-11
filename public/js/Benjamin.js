const loginForm = document.querySelector('#loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.querySelector('#login_username').value;
    const password = document.querySelector('#login_password').value;
    if (!username || !password) {
      alert('Username and password are required');
      return;
    }

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.message || 'Login failed');
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
