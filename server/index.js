const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 5001;
const db = new sqlite3.Database('./database.sqlite');

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT)');
  db.run('CREATE TABLE IF NOT EXISTS history (id INTEGER PRIMARY KEY, userId INTEGER, input TEXT, score INTEGER, message TEXT, sentiment TEXT, sentimentScore INTEGER, threshold INTEGER, timestamp TEXT, FOREIGN KEY(userId) REFERENCES users(id))');
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  console.log('Register request:', { username });
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  const hashedPassword = await bcrypt.hash(password, 10);
  db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err) => {
    if (err) {
      console.error('Register error:', err.message);
      return res.status(400).json({ error: 'Username already exists' });
    }
    res.json({ message: 'User registered' });
  });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  console.log('Login request:', { username });
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err || !user) {
      console.error('Login error:', err?.message || 'User not found');
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });
    res.json({ userId: user.id, username: user.username });
  });
});

app.post('/history', (req, res) => {
  const { userId, history } = req.body;
  console.log('Saving history for user:', userId, 'History:', history);
  if (!userId || !history || !Array.isArray(history)) {
    return res.status(400).json({ error: 'Invalid request: userId and history array required' });
  }

  const stmt = db.prepare('INSERT INTO history (userId, input, score, message, sentiment, sentimentScore, threshold, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  try {
    history.forEach((entry) => {
      stmt.run(userId, entry.input, entry.score, entry.message, entry.sentiment, entry.sentimentScore, entry.threshold, entry.timestamp, (err) => {
        if (err) console.error('Insert error:', err.message);
      });
    });
    stmt.finalize();
    res.json({ message: 'History saved' });
  } catch (err) {
    console.error('History save error:', err.message);
    res.status(500).json({ error: 'Failed to save history' });
  }
});

app.get('/history/:userId', (req, res) => {
  const { userId } = req.params;
  console.log('Fetching history for user:', userId);
  db.all('SELECT * FROM history WHERE userId = ?', [userId], (err, rows) => {
    if (err) {
      console.error('History fetch error:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows.map(row => ({
      input: row.input,
      score: row.score,
      message: row.message,
      sentiment: row.sentiment,
      sentimentScore: row.sentimentScore,
      threshold: row.threshold,
      timestamp: row.timestamp,
    })));
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

