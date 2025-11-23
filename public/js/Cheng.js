document.addEventListener("DOMContentLoaded", function () {
  // current editing post for modal
  let currentEditing = null;

  function getCurrentUser() {
    return localStorage.getItem('loggedInUser');
  }

  const offerModal = document.getElementById("offerModal");
  const requestModal = document.getElementById("requestModal");

  const addOfferBtn = document.getElementById("addOfferBtn");
  const addRequestBtn = document.getElementById("addRequestBtn");

  const closeOffer = document.getElementById("closeOffer");
  const closeRequest = document.getElementById("closeRequest");

  const offerForm = document.getElementById("offerForm");
  const requestForm = document.getElementById("requestForm");

  const offersList = document.getElementById("offersList");
  const requestsList = document.getElementById("requestsList");

  function addOfferToDOM(name, skill) {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${name}:</strong> I can teach ${skill}`;
    offersList.appendChild(li);
  }

  function addRequestToDOM(name, skill) {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${name}:</strong> I want to learn ${skill}`;
    requestsList.appendChild(li);
  }

  async function loadData() {
    try {
      const [offersRes, requestsRes] = await Promise.all([
        fetch("/api/offers"),
        fetch("/api/requests"),
      ]);

      const offers = await offersRes.json();
      const requests = await requestsRes.json();

      offersList.innerHTML = "";
      requestsList.innerHTML = "";

      const currentUser = getCurrentUser();

      // render offers with buttons
      offers.forEach(o => {
        const li = document.createElement('li');
        const username = o.username || o.name || '';
        // show 'I can teach' before the skill
        li.innerHTML = `<strong>${username}:</strong> I can teach ${o.skill}${o.category ? ' • ' + o.category : ''}` +
                 `<br><small>${o.description || ''}</small>`;
        if (currentUser && username && username.toLowerCase() === currentUser.toLowerCase()) {
          const br = document.createElement('br');
          const editBtn = document.createElement('button');
          editBtn.textContent = 'Edit';
          editBtn.className = 'action-btn edit-btn';
          editBtn.dataset.id = o.id;
          editBtn.addEventListener('click', () => handleEdit(o));

          const delBtn = document.createElement('button');
          delBtn.textContent = 'Delete';
          delBtn.className = 'action-btn delete-btn';
          delBtn.dataset.id = o.id;
          delBtn.addEventListener('click', () => handleDelete(o));

          li.appendChild(br);
          li.appendChild(editBtn);
          li.appendChild(delBtn);
        }
        offersList.appendChild(li);
      });

      // render requests with buttons
      requests.forEach(r => {
        const li = document.createElement('li');
        const username = r.username || r.name || '';
        // show 'I want to learn' before the skill
        li.innerHTML = `<strong>${username}:</strong> I want to learn ${r.skill}${r.category ? ' • ' + r.category : ''}` +
                 `<br><small>${r.description || ''}</small>`;
        if (currentUser && username && username.toLowerCase() === currentUser.toLowerCase()) {
          const br = document.createElement('br');
          const editBtn = document.createElement('button');
          editBtn.textContent = 'Edit';
          editBtn.className = 'action-btn edit-btn';
          editBtn.dataset.id = r.id;
          editBtn.addEventListener('click', () => handleEdit(r));

          const delBtn = document.createElement('button');
          delBtn.textContent = 'Delete';
          delBtn.className = 'action-btn delete-btn';
          delBtn.dataset.id = r.id;
          delBtn.addEventListener('click', () => handleDelete(r));

          li.appendChild(br);
          li.appendChild(editBtn);
          li.appendChild(delBtn);
        }
        requestsList.appendChild(li);
      });
    } catch (err) {
      console.error("Error loading data from server:", err);
    }
  }
  // expose reload function so other modules (Pavian.js) can request a refresh
  window.reloadPosts = loadData;

  loadData();

  addOfferBtn.onclick = () => offerModal.style.display = "block";
  addRequestBtn.onclick = () => requestModal.style.display = "block";

  closeOffer.onclick = () => offerModal.style.display = "none";
  closeRequest.onclick = () => requestModal.style.display = "none";

  window.onclick = function(e) {
    if (e.target === offerModal) offerModal.style.display = "none";
    if (e.target === requestModal) requestModal.style.display = "none";
  };

  offerForm.addEventListener("submit", async function(e) {
    e.preventDefault();

    const name = document.getElementById("offerName").value.trim();
    const skill = document.getElementById("offerSkill").value.trim();
    if (!name || !skill) return;

    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, skill }),
      });

      if (!res.ok) {
        console.error("Failed to save offer");
        return;
      }

      const payload = await res.json();
      const post = payload.post || { id: null, username: name, skill };
      // reload lists to get normalized data
      await loadData();
      offerModal.style.display = "none";
      offerForm.reset();
    } catch (err) {
      console.error("Error submitting offer:", err);
    }
  });

  requestForm.addEventListener("submit", async function(e) {
    e.preventDefault();

    const name = document.getElementById("requestName").value.trim();
    const skill = document.getElementById("requestSkill").value.trim();
    if (!name || !skill) return;

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, skill }),
      });

      if (!res.ok) {
        console.error("Failed to save request");
        return;
      }

      const payload = await res.json();
      const post = payload.post || { id: null, username: name, skill };
      await loadData();
      requestModal.style.display = "none";
      requestForm.reset();
    } catch (err) {
      console.error("Error submitting request:", err);
    }
  });

  // Edit/Delete handled by `Pavian.js` (this file only renders posts)
});
