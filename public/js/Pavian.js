// managePosts.js

// Global state
let currentEditingPost = null;

// Helpers
function getCurrentUser() {
  // Returns logged-in username or null
  return localStorage.getItem("loggedInUser");
}

// Init
window.addEventListener("DOMContentLoaded", () => {
  loadPosts();
  setupEditModal();
});

// Modal setup
function setupEditModal() {
  const modal = document.getElementById("editModal");
  const saveBtn = document.getElementById("editSaveBtn");
  const cancelBtn = document.getElementById("editCancelBtn");

  if (!modal || !saveBtn || !cancelBtn) return;

  cancelBtn.addEventListener("click", () => {
    modal.style.display = "none";
    currentEditingPost = null;
  });

  // Close when clicking outside the modal content
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
      currentEditingPost = null;
    }
  });
  // Save button calls handleEditSave
  saveBtn.addEventListener("click", handleEditSave);
}

// Load posts
function loadPosts() {
  fetch("/api/posts")
    .then((res) => res.json())
    .then((data) => {
      if (!data.success) {
        alert(data.message || "Failed to load posts.");
        return;
      }

      const offersList = document.getElementById("offersList");
      const requestsList = document.getElementById("requestsList");
      const currentUser = getCurrentUser();

      if (!offersList || !requestsList) {
        console.error("Missing offersList or requestsList element");
        return;
      }

      offersList.innerHTML = "";
      requestsList.innerHTML = "";

      // Render offers
      (data.offers || []).forEach((post) => {
        const li = document.createElement("li");
        li.innerHTML = `
          <strong>${post.username}:</strong> ${post.description}
          <br><small>${post.skill} • ${post.category}</small>
        `;

        if (currentUser && post.username === currentUser) {
          const editBtn = document.createElement("button");
          editBtn.textContent = "Edit";
          editBtn.className = "action-btn edit-btn";
          editBtn.addEventListener("click", () => handleEdit(post));

          const delBtn = document.createElement("button");
          delBtn.textContent = "Delete";
          delBtn.className = "action-btn delete-btn";
          delBtn.addEventListener("click", () => handleDelete(post));

          li.appendChild(document.createElement("br"));
          li.appendChild(editBtn);
          li.appendChild(delBtn);
        }

        offersList.appendChild(li);
      });

      // Render requests
      (data.requests || []).forEach((post) => {
        const li = document.createElement("li");
        li.innerHTML = `
          <strong>${post.username}:</strong> ${post.description}
          <br><small>${post.skill} • ${post.category}</small>
        `;

        if (currentUser && post.username === currentUser) {
          const editBtn = document.createElement("button");
          editBtn.textContent = "Edit";
          editBtn.className = "action-btn edit-btn";
          editBtn.addEventListener("click", () => handleEdit(post));

          const delBtn = document.createElement("button");
          delBtn.textContent = "Delete";
          delBtn.className = "action-btn delete-btn";
          delBtn.addEventListener("click", () => handleDelete(post));

          li.appendChild(document.createElement("br"));
          li.appendChild(editBtn);
          li.appendChild(delBtn);
        }

        requestsList.appendChild(li);
      });
    })
    .catch((err) => {
      console.error(err);
      alert("Error loading posts.");
    });
}

// Open edit modal
function handleEdit(post) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    alert("Please log in to edit posts.");
    return;
  }

  currentEditingPost = post;

  const modal = document.getElementById("editModal");
  const skillInput = document.getElementById("editSkillInput");
  const categoryInput = document.getElementById("editCategoryInput");
  const descriptionInput = document.getElementById("editDescriptionInput");

  if (!modal || !skillInput || !categoryInput || !descriptionInput) {
    console.error("Edit modal elements not found");
    return;
  }

  // Prefill with existing values
  skillInput.value = post.skill || "";
  categoryInput.value = post.category || "";
  descriptionInput.value = post.description || "";

  modal.style.display = "flex"; // show modal
}

// Save edits
function handleEditSave() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    alert("Please log in to edit posts.");
    return;
  }
  if (!currentEditingPost) {
    alert("No post selected to edit.");
    return;
  }

  const modal = document.getElementById("editModal");
  const skillInput = document.getElementById("editSkillInput");
  const categoryInput = document.getElementById("editCategoryInput");
  const descriptionInput = document.getElementById("editDescriptionInput");

  const skill = skillInput.value.trim();
  const category = categoryInput.value.trim();
  const description = descriptionInput.value.trim();

  if (!skill || !category || !description) {
    alert("All fields are required.");
    return;
  }

  fetch(`/api/posts/${currentEditingPost.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ skill, category, description, username: currentUser }),
  })
    .then((res) => res.json())
    .then((data) => {
      alert(data.message || "Updated.");
      if (data.success) {
        modal.style.display = "none";
        currentEditingPost = null;
        loadPosts(); // refresh list
      }
    })
    .catch((err) => {
      console.error(err);
      alert("Error updating post.");
    });
}

// ===== DELETE – supporting feature + confirmation =====
function handleDelete(post) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    alert("Please log in to delete posts.");
    return;
  }

  if (!confirm("Are you sure you want to delete this post?")) {
    return;
  }

  fetch(`/api/posts/${post.id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: currentUser }),
  })
    .then((res) => res.json())
    .then((data) => {
      alert(data.message);
      if (data.success) {
        loadPosts();
      }
    })
    .catch((err) => {
      console.error(err);
      alert("Error deleting post.");
    });
}
