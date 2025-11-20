// Frontend logic for simple register/login UI

const $ = (sel) => document.querySelector(sel);

function showLoggedIn(user) { // Show logout button with username
  $('#loginBtn').style.display = 'none';
  $('#registerBtn').style.display = 'none';
  const logout = $('#logoutBtn');
  logout.style.display = 'inline-block';
  logout.textContent = `Logout (${user.username})`;
}

function showLoggedOut() { // Show login/register buttons
  $('#loginBtn').style.display = 'inline-block';
  $('#registerBtn').style.display = 'inline-block';
  $('#logoutBtn').style.display = 'none';
}

function saveToken(token) { localStorage.setItem('sl_token', token); } // Simple Login token
function getToken() { return localStorage.getItem('sl_token'); } // Simple Login token
function clearToken() { localStorage.removeItem('sl_token'); } // Simple Login token

async function fetchMe() { // Fetch current user using saved token
  const token = getToken();
  if (!token) return null;
  try {
    const res = await fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) { clearToken(); return null; }
    const data = await res.json();
    return data.success ? data.user : null;
  } catch (e) { return null; }
}

document.addEventListener('DOMContentLoaded', async () => { // Setup event listeners for login, register, logout
  const loginForm = $('#loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => { // Handle login form submission
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
    registerForm.addEventListener('submit', async (event) => { // Handle register form submission
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
        window.location.href = '/FirstSkillSelection.html';
      } catch (e) { alert('Network error'); }
    });
  }

  const logoutBtn = $('#logoutBtn'); // Handle logout button click
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

  // Logic for the skill selection page
  if (window.location.pathname === '/FirstSkillSelection.html') {
    populateSkills();
    setupSkillSelection();
  }
});

function populateSkills() { // Populate skill cards dynamically
  const skills = [
    "Python", "JavaScript", "Java", "C++", "C#", "Ruby", "Go", "Swift", "Kotlin",
    "HTML", "CSS", "React", "Angular", "Vue.js", "Node.js", "Django", "Flask",
    "SQL", "MongoDB", "Firebase", "AWS", "Azure", "Google Cloud", "Docker",
    "SQL", "Transformer", "Git", "Jira", "Agile", "Scrum", "CI/CD",
    "Machine Learning", "Data Science", "Deep Learning", "NLP", "Computer Vision",
    "Graphic Design", "UI/UX Design", "Figma", "Sketch", "Adobe XD", "Photoshop",
    "Illustrator", "Video Editing", "Blender", "3D Modeling", "Game Development",
    "Unity", "Unreal Engine", "Mobile App Development", "Rock climbing", "Bouldering",
    "Project Management", "Product Management", "Marketing", "SEO", "Content Writing",
    "Public Speaking", "Negotiation", "Swimming", "Cooking", "Baking", "Guitar",
    "Piano", "Singing", "Dancing", "Photography", "Yoga", "Meditation", "Fitness"
  ];

  const container = $('#skill-card-container');
  if (container) {
    skills.forEach(skill => {
      const card = document.createElement('div');
      card.classList.add('skill-card');
      card.textContent = skill;
      card.dataset.skill = skill;
      container.appendChild(card);
    });
  }
}

function setupSkillSelection() { // Setup skill card selection logic
  const container = $('#skill-card-container');
  const submitBtn = $('#submitSkillsBtn');
  let selectedSkills = [];

  if (container) {
    container.addEventListener('click', (event) => {
      const card = event.target.closest('.skill-card');
      if (card) {
        const skill = card.dataset.skill;
        if (selectedSkills.includes(skill)) {
          // Deselect
          selectedSkills = selectedSkills.filter(s => s !== skill);
          card.classList.remove('selected');
        } else {
          // Select
          if (selectedSkills.length < 3) {
            selectedSkills.push(skill);
            card.classList.add('selected');
          } else {
            alert('You can only select up to 3 skills.');
          }
        }
        submitBtn.disabled = selectedSkills.length === 0;
      }
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      if (selectedSkills.length > 0) {
        alert(`You have selected: ${selectedSkills.join(', ')}`);
        // Here you would typically send the selected skills to the server
        // For now, we'll just redirect to the homepage
        window.location.href = '/';
      } else {
        alert('Please select at least one skill.');
      }
    });
  }
}
