const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.resolve(__dirname, 'public')));

const db = new sqlite3.Database('./database.db', (err) => {
    if (err) console.error(err.message);
    console.log('Connected to target persistent SQLite schema configuration.');
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT, semester TEXT, department TEXT,
        email TEXT UNIQUE, password TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS predictions (
        user_id INTEGER PRIMARY KEY,
        qf1 TEXT, final_winner TEXT, golden_boot TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
});

app.post('/api/signup', async (req, res) => {
    const { name, semester, department, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(`INSERT INTO users (name, semester, department, email, password) VALUES (?, ?, ?, ?, ?)`, 
            [name, semester, department, email, hashedPassword], function(err) {
            if (err) return res.status(400).json({ error: 'This destination registry signature already exists.' });
            res.json({ success: true, userId: this.lastID });
        });
    } catch (e) {
        res.status(500).json({ error: 'Server dataset layout allocation failure.' });
    }
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
        if (err || !user) return res.status(400).json({ error: 'Identity credentials profile not found.' });
        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return res.status(400).json({ error: 'Security authentication mismatched password payload.' });
        res.json({ success: true, userId: user.id });
    });
});

app.post('/api/predictions', (req, res) => {
    const { userId, qf1, final_winner, golden_boot } = req.body;
    db.run(`INSERT OR REPLACE INTO predictions (user_id, qf1, final_winner, golden_boot) VALUES (?, ?, ?, ?)`, 
            [userId, qf1, final_winner, golden_boot], (err) => {
        if (err) return res.status(500).json({ error: 'Failed to commit selection metrics rows to filesystem.' });
        res.json({ success: true });
    });
});

app.get('/api/admin/users', (req, res) => {
    db.all(`SELECT users.name, users.semester, users.department, users.email, predictions.qf1, predictions.final_winner 
            FROM users LEFT JOIN predictions ON users.id = predictions.user_id`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server actively running on port ${PORT}`));