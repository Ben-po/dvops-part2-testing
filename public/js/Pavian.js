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
// Note: rendering is done in `Cheng.js`. This file handles edit/delete only.

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

  if (!modal || !skillInput) {
    console.error("Edit modal elements not found");
    return;
  }

  // Prefill skill only
  skillInput.value = post.skill || "";

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

  const skill = skillInput.value.trim();

  if (!skill) {
    alert("Skill is required.");
    return;
  }

  fetch(`/api/posts/${currentEditingPost.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ skill, username: currentUser }),
  })
    .then((res) => res.json())
    .then((data) => {
      alert(data.message || "Updated.");
      if (data.success) {
        modal.style.display = "none";
        currentEditingPost = null;
        if (window.reloadPosts) window.reloadPosts();
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
        if (window.reloadPosts) window.reloadPosts();
      }
    })
    .catch((err) => {
      console.error(err);
      alert("Error deleting post.");
    });
}
