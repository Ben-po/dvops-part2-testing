const fs = require("fs");
const path = require("path");

const POSTS_FILE = path.join(__dirname, "skillposts.json");

// Helper: read posts
function readPosts() {
  const raw = fs.readFileSync(POSTS_FILE, "utf8");
  return JSON.parse(raw);
}

// Helper: write posts
function writePosts(data) {
  fs.writeFileSync(POSTS_FILE, JSON.stringify(data, null, 2), "utf8");
}

// GET /api/posts  (view all)
function viewPosts(req, res) {
  try {
    const db = readPosts();
    res.json({
      success: true,
      offers: db.offers || [],
      requests: db.requests || []
    });
  } catch (err) {
    console.error("Error in viewPosts:", err);
    res.status(500).json({
      success: false,
      message: "Server error while loading posts."
    });
  }
}

// PUT /api/posts/:id
function updatePost(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { skill, category, description, username } = req.body || {};

    if (!skill || !category || !description) {
      return res.status(400).json({
        success: false,
        message: "Skill, category and description are required."
      });
    }

    const db = readPosts();
    const collections = ["offers", "requests"];
    let found = false;

    for (const key of collections) {
      if (!Array.isArray(db[key])) continue;
      const index = db[key].findIndex((p) => p.id === id);
      if (index !== -1) {
        if (username && db[key][index].username !== username) {
          return res.status(403).json({
            success: false,
            message: "You are not allowed to edit this post."
          });
        }

        db[key][index].skill = skill;
        db[key][index].category = category;
        db[key][index].description = description;
        found = true;
        break;
      }
    }

    if (!found) {
      return res.status(404).json({
        success: false,
        message: "Post not found."
      });
    }

    writePosts(db);

    res.json({
      success: true,
      message: "Post updated successfully."
    });
  } catch (err) {
    console.error("Error in updatePost:", err);
    res.status(500).json({
      success: false,
      message: "Server error while updating post."
    });
  }
}

function deletePost(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { username } = req.body || {};
    const db = readPosts();
    const collections = ["offers", "requests"];
    let found = false;

    for (const key of collections) {
      if (!Array.isArray(db[key])) continue;
      const index = db[key].findIndex((p) => p.id === id);
      if (index !== -1) {
        // Optional: ownership check
        if (username && db[key][index].username !== username) {
          return res.status(403).json({
            success: false,
            message: "You are not allowed to delete this post."
          });
        }

        db[key].splice(index, 1);
        found = true;
        break;
      }
    }

    if (!found) {
      return res.status(404).json({
        success: false,
        message: "Post not found."
      });
    }

    writePosts(db);

    res.json({
      success: true,
      message: "Post deleted successfully."
    });
  } catch (err) {
    console.error("Error in deletePost:", err);
    res.status(500).json({
      success: false,
      message: "Server error while deleting post."
    });
  }
}

module.exports = {
  viewPosts,
  updatePost,
  deletePost
};
