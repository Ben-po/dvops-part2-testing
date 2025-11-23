const fs = require("fs");
const path = require("path");

const offersFile = path.join(__dirname, "..", "data", "offers.json");
const requestsFile = path.join(__dirname, "..", "data", "requests.json");

function readJson(file) {
  try {
    const raw = fs.readFileSync(file, "utf8");
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

// Ensure each post has an id and normalized fields. If missing, add ids and write back.
function normalizeAndLoad() {
  const offers = readJson(offersFile).map((o) => ({
    id: o.id || null,
    username: o.username || o.name || "",
    skill: o.skill || "",
    category: o.category || "",
    description: o.description || ""
  }));

  const requests = readJson(requestsFile).map((r) => ({
    id: r.id || null,
    username: r.username || r.name || "",
    skill: r.skill || "",
    category: r.category || "",
    description: r.description || ""
  }));

  // assign ids where missing
  const all = offers.concat(requests);
  let maxId = all.reduce((m, p) => Math.max(m, p.id || 0), 0);
  let changed = false;

  for (const list of [offers, requests]) {
    for (const item of list) {
      if (!item.id) {
        maxId += 1;
        item.id = maxId;
        changed = true;
      }
    }
  }

  if (changed) {
    // persist ids back to files with original shape (name instead of username where appropriate)
    const outOffers = offers.map(o => ({ id: o.id, username: o.username, skill: o.skill, category: o.category, description: o.description }));
    const outRequests = requests.map(r => ({ id: r.id, username: r.username, skill: r.skill, category: r.category, description: r.description }));
    writeJson(offersFile, outOffers);
    writeJson(requestsFile, outRequests);
  }

  return { offers, requests };
}

function viewPosts(req, res) {
  try {
    const db = normalizeAndLoad();
    res.json({ success: true, offers: db.offers || [], requests: db.requests || [] });
  } catch (err) {
    console.error("Error in viewPosts:", err);
    res.status(500).json({ success: false, message: "Server error while loading posts." });
  }
}

function updatePost(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { skill, category, description, username } = req.body || {};

    if (!skill) {
      return res.status(400).json({ success: false, message: "Skill is required." });
    }

    const db = normalizeAndLoad();
    const collections = [ { key: 'offers', file: offersFile }, { key: 'requests', file: requestsFile } ];
    let found = false;

    for (const col of collections) {
      const list = db[col.key];
      const index = list.findIndex(p => p.id === id);
      if (index !== -1) {
        if (username && list[index].username !== username) {
          return res.status(403).json({ success: false, message: "You are not allowed to edit this post." });
        }

        // update only provided fields (support skill-only edits)
        if (skill !== undefined) list[index].skill = skill;
        if (category !== undefined) list[index].category = category;
        if (description !== undefined) list[index].description = description;

        // write back
        writeJson(col.file, list);

        found = true;
        break;
      }
    }

    if (!found) return res.status(404).json({ success: false, message: "Post not found." });

    return res.json({ success: true, message: "Post updated successfully." });
  } catch (err) {
    console.error("Error in updatePost:", err);
    res.status(500).json({ success: false, message: "Server error while updating post." });
  }
}

function deletePost(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { username } = req.body || {};

    const db = normalizeAndLoad();
    const collections = [ { key: 'offers', file: offersFile }, { key: 'requests', file: requestsFile } ];
    let found = false;

    for (const col of collections) {
      const list = db[col.key];
      const index = list.findIndex(p => p.id === id);
      if (index !== -1) {
        if (username && list[index].username !== username) {
          return res.status(403).json({ success: false, message: "You are not allowed to delete this post." });
        }

        list.splice(index, 1);
        writeJson(col.file, list);
        found = true;
        break;
      }
    }

    if (!found) return res.status(404).json({ success: false, message: "Post not found." });

    return res.json({ success: true, message: "Post deleted successfully." });
  } catch (err) {
    console.error("Error in deletePost:", err);
    res.status(500).json({ success: false, message: "Server error while deleting post." });
  }
}

module.exports = { viewPosts, updatePost, deletePost };
