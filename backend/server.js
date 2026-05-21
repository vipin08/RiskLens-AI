const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: __dirname + '/.env' });

connectDB = require('./config/db');

const app = express();


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/stocks', require('./routes/stocks'));
app.use('/api/watchlist', require('./routes/watchlist'));
app.use('/api/analysis', require('./routes/analysis'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/news', require('./routes/news'));
app.use('/api/assistant', require('./routes/assistant'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/startups', require('./routes/startups'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

const START_PORT = Number(process.env.PORT) || 5000;

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`Local:  http://localhost:${port}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.warn(`Port ${port} is already in use, trying ${port + 1}...`);
      server.close(() => startServer(port + 1));
      return;
    }

    console.error('Server failed to start.');
    console.error(error);
    process.exit(1);
  });

  return server;
};

// Initialize storage then start server
connectDB()
  .then(() => {
    startServer(START_PORT);
  })
  .catch(error => {
    console.error('Failed to initialize storage. Server not started.');
    console.error(error);
    process.exit(1);
  });
