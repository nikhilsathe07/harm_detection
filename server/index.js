const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
const BASE_PORT = 5000; // Try 5000 first
let PORT = BASE_PORT;

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Database setup
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Failed to connect to SQLite:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database');
});

// Initialize tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )`, (err) => {
    if (err) console.error('Error creating users table:', err.message);
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      input TEXT,
      score INTEGER,
      message TEXT,
      sentiment TEXT,
      sentimentScore INTEGER,
      threshold INTEGER,
      timestamp TEXT,
      FOREIGN KEY(userId) REFERENCES users(id)
    )`, (err) => {
    if (err) console.error('Error creating history table:', err.message);
  });
});

// Register endpoint
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  console.log('Register attempt:', { username });

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], function(err) {
      if (err) {
        console.error('Register error:', err.message);
        return res.status(400).json({ error: 'Username already exists' });
      }
      const userData = { userId: this.lastID, username };
      console.log('User registered:', userData);
      res.json(userData);
    });
  } catch (err) {
    console.error('Hashing error:', err.message);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  console.log('Login attempt:', { username });

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({ error: 'Server error' });
    }
    if (!user) {
      console.log('User not found:', username);
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    try {
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        console.log('Password mismatch for:', username);
        return res.status(400).json({ error: 'Invalid credentials' });
      }
      console.log('Login successful:', { userId: user.id, username });
      res.json({ userId: user.id, username });
    } catch (err) {
      console.error('Compare error:', err.message);
      res.status(500).json({ error: 'Server error' });
    }
  });
});

// Save history endpoint
app.post('/history', (req, res) => {
  const { userId, history } = req.body;
  console.log('Saving history for user:', userId);

  if (!userId || !history || !Array.isArray(history)) {
    return res.status(400).json({ error: 'Invalid request: userId and history array required' });
  }

  const stmt = db.prepare('INSERT INTO history (userId, input, score, message, sentiment, sentimentScore, threshold, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  try {
    history.forEach((entry) => {
      stmt.run(userId, entry.input, entry.score, entry.message, entry.sentiment, entry.sentimentScore, entry.threshold, entry.timestamp);
    });
    stmt.finalize((err) => {
      if (err) {
        console.error('Finalize error:', err.message);
        return res.status(500).json({ error: 'Failed to save history' });
      }
      res.json({ message: 'History saved' });
    });
  } catch (err) {
    console.error('History save error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get history endpoint
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

// Dynamic port handling
const startServer = (port) => {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} in use, trying ${port + 1}...`);
      PORT = port + 1;
      startServer(PORT);
    } else {
      console.error('Server error:', err.message);
      process.exit(1);
    }
  });
};

startServer(PORT);