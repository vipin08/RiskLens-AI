const express = require('express');
const router = express.Router();
const jsondb = require('../config/jsondb');
const auth = require('../middleware/auth');

// In-memory notifications for demo (would be in separate JSON file in production)
let notifications = [];

// Get all notifications
router.get('/', auth, async (req, res) => {
  try {
    const recentNotifications = notifications
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 20);
    res.json(recentNotifications);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching notifications' });
  }
});

// Post a new notification (founders only)
router.post('/', auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const user = jsondb.findUserById(req.user.id);
    if (!user || user.role !== 'founder') {
      return res.status(403).json({ error: 'Only founders can post notifications' });
    }

    const notification = {
      id: Date.now().toString(),
      founderId: user.id,
      startupName: user.startupName || 'Unknown Startup',
      message,
      createdAt: new Date().toISOString()
    };

    notifications.push(notification);
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ error: 'Server error posting notification' });
  }
});

module.exports = router;
