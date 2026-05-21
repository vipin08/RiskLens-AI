const express = require('express');
const router = express.Router();
const jsondb = require('../config/jsondb');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

router.use(auth, admin);

router.get('/stats', async (req, res) => {
  try {
    const users = jsondb.readUsers();
    const totalUsers = users.length;
    const admins = users.filter(u => u.role === 'admin').length;
    const standardUsers = totalUsers - admins;

    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 7);
    const recentSignups = users.filter(u => {
      const createdAt = new Date(u.createdAt);
      return createdAt >= recentDate;
    }).length;

    res.json({
      totalUsers,
      admins,
      standardUsers,
      recentSignups
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve stats' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = jsondb.readUsers();
    const safeUsers = users
      .map(u => {
        const { password, ...userWithoutPassword } = u;
        return userWithoutPassword;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(safeUsers);
  } catch (error) {
    console.error('Admin users fetch error:', error);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own admin account.' });
    }

    const user = jsondb.findUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    jsondb.deleteUser(req.params.id);
    res.json({ message: 'User successfully deleted' });
  } catch (error) {
    console.error('Admin user deletion error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
