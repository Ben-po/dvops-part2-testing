document.addEventListener("DOMContentLoaded", function () {

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

  // Helper: render list items
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

  // Load from backend (JSON files via Node)
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

      offers.forEach(o => addOfferToDOM(o.name, o.skill));
      requests.forEach(r => addRequestToDOM(r.name, r.skill));
    } catch (err) {
      console.error("Error loading data from server:", err);
    }
  }

  loadData();

  // Open modals
  addOfferBtn.onclick = () => offerModal.style.display = "block";
  addRequestBtn.onclick = () => requestModal.style.display = "block";

  // Close modals
  closeOffer.onclick = () => offerModal.style.display = "none";
  closeRequest.onclick = () => requestModal.style.display = "none";

  // Click outside = close
  window.onclick = function(e) {
    if (e.target === offerModal) offerModal.style.display = "none";
    if (e.target === requestModal) requestModal.style.display = "none";
  };

  // Submit Offer (save to backend)
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

      addOfferToDOM(name, skill);
      offerModal.style.display = "none";
      offerForm.reset();
    } catch (err) {
      console.error("Error submitting offer:", err);
    }
  });

  // Submit Request (save to backend)
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

      addRequestToDOM(name, skill);
      requestModal.style.display = "none";
      requestForm.reset();
    } catch (err) {
      console.error("Error submitting request:", err);
    }
  });

});
