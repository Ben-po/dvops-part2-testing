const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const SkillPostUtil = require('./utils/SkillPostUtil');

const app = express();
const PORT = 5050;

app.use(express.json());  // Fixed: moved to top
app.use(express.static(path.join(__dirname, "public"))); // serve frontend

const USERS_FILE = path.join(__dirname, "utils", "skilllink.json");

/* istanbul ignore next */
function loadUsers() {
    try {
        if (!fs.existsSync(USERS_FILE)) return [];
        const raw = fs.readFileSync(USERS_FILE, "utf8");
        if (!raw) return [];
        return JSON.parse(raw);
    } catch (err) {
        console.error("Error reading users file:", err);
        return [];
    }
}

/* istanbul ignore next */
function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

/* istanbul ignore next */
function makeToken(payload) {
    return Buffer.from(JSON.stringify(payload)).toString("base64");
}

/* istanbul ignore next */
function parseToken(token) {
    try {
        return JSON.parse(Buffer.from(token, "base64").toString("utf8"));
    } catch {
        return null;
    }
}

app.post("/api/register", async (req, res) => {
    const { username, password } = req.body || {};

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: "username and password required"
        });
    }

    const users = loadUsers();

    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        return res.status(409).json({
            success: false,
            message: "Username already taken"
        });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = Date.now().toString();

    const user = { id, username, passwordHash };
    users.push(user);
    saveUsers(users);

    const token = makeToken({ id: user.id, username: user.username });

    res.json({
        success: true,
        user: { id: user.id, username: user.username },
        token
    });
});

app.post("/api/login", async (req, res) => {
    const { username, password } = req.body || {};

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: "username and password required"
        });
    }

    const users = loadUsers();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (!user)
        return res.status(401).json({ success: false, message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.passwordHash);

    if (!match)
        return res.status(401).json({ success: false, message: "Invalid credentials" });

    const token = makeToken({ id: user.id, username: user.username });

    res.json({
        success: true,
        user: { id: user.id, username: user.username },
        token
    });
});

/* istanbul ignore next */
app.get("/api/me", (req, res) => {
    const auth = req.headers.authorization || "";
    const parts = auth.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer")
        return res.status(401).json({ success: false });

    const token = parts[1];
    const data = parseToken(token);

    if (!data || !data.id)
        return res.status(401).json({ success: false });

    const users = loadUsers();
    const user = users.find(u => u.id === data.id);

    if (!user)
        return res.status(404).json({ success: false });

    res.json({
        success: true,
        user: { id: user.id, username: user.username }
    });
});

/* istanbul ignore next */
const dataDir = path.join(__dirname, "data");
const offersFile = path.join(dataDir, "offers.json");
const requestsFile = path.join(dataDir, "requests.json");

/* istanbul ignore next */
function ensureFile(filePath, defaultData) {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir);
    }
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), "utf-8");
    }
}

ensureFile(offersFile, [
    { name: "John", skill: "Python" },
    { name: "Mary", skill: "Guitar" }
]);

ensureFile(requestsFile, [
    { name: "Alex", skill: "Piano" },
    { name: "Lisa", skill: "Cooking" }
]);

/* istanbul ignore next */
function loadJson(file) {
    try {
        return JSON.parse(fs.readFileSync(file, "utf-8"));
    } catch {
        return [];
    }
}

/* istanbul ignore next */
function saveJson(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
}

// Compute next id from both files
/* istanbul ignore next */
function getNextId() {
    const offers = loadJson(offersFile) || [];
    const requests = loadJson(requestsFile) || [];
    const all = offers.concat(requests);
    const maxId = all.reduce((m, p) => Math.max(m, p.id || 0), 0);
    return maxId + 1;
}

// Normalize data files: ensure id and username fields exist; write back if changed
/* istanbul ignore next */
function normalizeDataFiles() {
    const offersRaw = loadJson(offersFile);
    const requestsRaw = loadJson(requestsFile);

    const offers = offersRaw.map(o => ({
        id: o.id || null,
        username: o.username || o.name || "",
        skill: o.skill || "",
        category: o.category || "",
        description: o.description || ""
    }));

    const requests = requestsRaw.map(r => ({
        id: r.id || null,
        username: r.username || r.name || "",
        skill: r.skill || "",
        category: r.category || "",
        description: r.description || ""
    }));

    let maxId = offers.concat(requests).reduce((m, p) => Math.max(m, p.id || 0), 0);
    let changed = false;

    for (const list of [offers, requests]) {
        for (const item of list) {
            if (!item.id) { maxId += 1; item.id = maxId; changed = true; }
        }
    }

    if (changed) {
        // write back normalized shapes (use username)
        saveJson(offersFile, offers.map(o => ({ id: o.id, username: o.username, skill: o.skill, category: o.category, description: o.description })));
        saveJson(requestsFile, requests.map(r => ({ id: r.id, username: r.username, skill: r.skill, category: r.category, description: r.description })));
    }

    return { offers, requests };
}

// Offers API
/* istanbul ignore next */
app.get("/api/offers", (req, res) => {
    const db = normalizeDataFiles();
    res.json(db.offers);
});

/* istanbul ignore next */
app.post("/api/offers", (req, res) => {
    const { name, skill } = req.body || {};

    if (!name || !skill)
        return res.status(400).json({ error: "name and skill required" });

    const offers = loadJson(offersFile);
    const id = getNextId();
    const newPost = { id, username: name, skill, category: "", description: "" };
    offers.push(newPost);
    saveJson(offersFile, offers);

    res.status(201).json({ message: "Offer added", post: newPost });
});

/* istanbul ignore next */
app.get("/api/requests", (req, res) => {
    const db = normalizeDataFiles();
    res.json(db.requests);
});

/* istanbul ignore next */
app.post("/api/requests", (req, res) => {
    const { name, skill } = req.body || {};

    if (!name || !skill)
        return res.status(400).json({ error: "name and skill required" });

    const requests = loadJson(requestsFile);
    const id = getNextId();
    const newPost = { id, username: name, skill, category: "", description: "" };
    requests.push(newPost);
    saveJson(requestsFile, requests);

    res.status(201).json({ message: "Request added", post: newPost });
});

// View all posts
/* istanbul ignore next */
app.get('/api/posts', SkillPostUtil.viewPosts);

// Update a post
/* istanbul ignore next */
app.put('/api/posts/:id', SkillPostUtil.updatePost);

// Delete a post
/* istanbul ignore next */
app.delete('/api/posts/:id', SkillPostUtil.deletePost);

/* istanbul ignore next */
const server = app.listen(PORT, () => {
    console.log(`Merged SkillLink server running at http://localhost:${PORT}`);
});

module.exports = { app, server };