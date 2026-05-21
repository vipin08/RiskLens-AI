const express = require('express');
const router = express.Router();
const jsondb = require('../config/jsondb');
const auth = require('../middleware/auth');

// Create or Update a startup (for Founder)
router.post('/', auth, async (req, res) => {
  try {
    const { name, industry, stage, description, publicMetrics, confidentialMetrics } = req.body;
    const user = jsondb.findUserById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update startup info in user profile
    const updates = {
      startupName: name || user.startupName,
      industry: industry || user.industry,
      stage: stage || user.stage,
      startupDescription: description || user.startupDescription
    };

    const updatedUser = jsondb.updateUser(req.user.id, updates);

    const startup = {
      founderId: user.id,
      name: updatedUser.startupName,
      industry: updatedUser.industry,
      stage: updatedUser.stage,
      description: updatedUser.startupDescription,
      publicMetrics: publicMetrics || {},
      confidentialMetrics: confidentialMetrics || {},
      createdAt: user.createdAt
    };

    res.json(startup);
  } catch (error) {
    console.error('Startup Create/Update Error:', error);
    res.status(500).json({ error: 'Server error while saving startup data' });
  }
});

// Get founder's own startup (Includes confidential data)
router.get('/mine', auth, async (req, res) => {
  try {
    const user = jsondb.findUserById(req.user.id);
    if (!user || user.role !== 'founder') {
      return res.status(404).json({ error: 'No startup found for this user' });
    }

    const startup = {
      founderId: user.id,
      name: user.startupName,
      industry: user.industry,
      stage: user.stage,
      description: user.startupDescription || '',
      createdAt: user.createdAt
    };

    res.json(startup);
  } catch (error) {
    console.error('Fetch My Startup Error:', error);
    res.status(500).json({ error: 'Server error while fetching your startup' });
  }
});

// Get founder analytics: investor list, total raised, platform stats
router.get('/mine/analytics', auth, async (req, res) => {
  try {
    const user = jsondb.findUserById(req.user.id);
    if (!user || user.role !== 'founder') {
      return res.status(404).json({ error: 'No startup found for this user' });
    }

    const allUsers = jsondb.readUsers();
    const startupName = user.startupName;

    // Find all investors who invested in this startup
    const investorRows = allUsers
      .filter(u => u.role === 'investor' && u.companyInvestments)
      .map(investor => {
        const relevant = investor.companyInvestments.filter(ci =>
          ci.companyName.toLowerCase().includes(startupName.toLowerCase())
        );
        const totalByThisInvestor = relevant.reduce((sum, ci) => sum + (ci.amount || 0), 0);
        const latestDate = relevant.sort((a, b) => 
          new Date(b.date) - new Date(a.date)
        )[0]?.date;
        
        return {
          name: investor.name,
          email: investor.email,
          profileImage: investor.profileImage || '',
          totalInvested: totalByThisInvestor,
          latestDate,
          rounds: relevant.length
        };
      })
      .filter(inv => inv.totalInvested > 0);

    const totalRaised = investorRows.reduce((sum, r) => sum + r.totalInvested, 0);

    // Platform stats
    const totalInvestorCount = allUsers.filter(u => u.role === 'investor').length;
    const totalFounderCount = allUsers.filter(u => u.role === 'founder').length;
    const totalUsers = allUsers.length;

    res.json({
      startup: {
        name: user.startupName,
        industry: user.industry,
        stage: user.stage,
        description: user.startupDescription || '',
        createdAt: user.createdAt
      },
      totalRaised,
      investorCount: investorRows.length,
      investors: investorRows,
      platformStats: { totalUsers, totalInvestorCount, totalFounderCount }
    });
  } catch (error) {
    console.error('Founder Analytics Error:', error);
    res.status(500).json({ error: 'Server error while fetching founder analytics' });
  }
});

// Get all startups (For Investors / Public)
router.get('/', auth, async (req, res) => {
  try {
    const allUsers = jsondb.readUsers();
    const startups = allUsers
      .filter(u => u.role === 'founder')
      .map(u => ({
        founderId: u.id,
        name: u.startupName,
        industry: u.industry,
        stage: u.stage,
        createdAt: u.createdAt
      }));

    res.json(startups);
  } catch (error) {
    console.error('Fetch All Startups Error:', error);
    res.status(500).json({ error: 'Server error while fetching startups' });
  }
});

// Get single startup by founder ID
router.get('/:founderId', auth, async (req, res) => {
  try {
    const user = jsondb.findUserById(req.params.founderId);
    if (!user || user.role !== 'founder') {
      return res.status(404).json({ error: 'Startup not found' });
    }

    const startup = {
      founderId: user.id,
      name: user.startupName,
      industry: user.industry,
      stage: user.stage,
      description: user.startupDescription || '',
      createdAt: user.createdAt
    };

    res.json(startup);
  } catch (error) {
    console.error('Fetch Startup by ID Error:', error);
    res.status(500).json({ error: 'Server error while fetching startup details' });
  }
});

module.exports = router;
