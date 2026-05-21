const express = require('express');
const router = express.Router();
const jsondb = require('../config/jsondb');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const user = jsondb.findUserById(req.user.id);
    res.json({ watchlist: user.watchlist || [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { ticker } = req.body;
    if (!ticker) return res.status(400).json({ error: 'Ticker required' });

    const user = jsondb.findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const upperTicker = ticker.toUpperCase();

    if (user.watchlist && user.watchlist.includes(upperTicker)) {
      return res.status(400).json({ error: 'Already in watchlist' });
    }

    if (!user.watchlist) user.watchlist = [];
    user.watchlist.push(upperTicker);
    
    const updatedUser = jsondb.updateUser(req.user.id, { watchlist: user.watchlist });
    res.json({ watchlist: updatedUser.watchlist });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add to watchlist' });
  }
});

router.delete('/:ticker', auth, async (req, res) => {
  try {
    const ticker = req.params.ticker.toUpperCase();
    const user = jsondb.findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const newWatchlist = (user.watchlist || []).filter(t => t !== ticker);
    const updatedUser = jsondb.updateUser(req.user.id, { watchlist: newWatchlist });
    res.json({ watchlist: updatedUser.watchlist });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove from watchlist' });
  }
});

router.post('/portfolio', auth, async (req, res) => {
  try {
    const { ticker, shares, buyPrice } = req.body;
    if (!ticker || !shares || !buyPrice) {
      return res.status(400).json({ error: 'ticker, shares, buyPrice required' });
    }

    const user = jsondb.findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.portfolio) user.portfolio = [];
    
    user.portfolio.push({
      ticker: ticker.toUpperCase(),
      shares: Number(shares),
      buyPrice: Number(buyPrice),
      buyDate: new Date().toISOString()
    });
    
    const updatedUser = jsondb.updateUser(req.user.id, { portfolio: user.portfolio });
    res.json({ portfolio: updatedUser.portfolio });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add to portfolio' });
  }
});

router.get('/portfolio', auth, async (req, res) => {
  try {
    const user = jsondb.findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({ portfolio: user.portfolio || [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

router.delete('/portfolio/:id', auth, async (req, res) => {
  try {
    const user = jsondb.findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const itemIndex = user.portfolio.findIndex(p => p.ticker === req.params.id.toUpperCase());
    if (itemIndex === -1) return res.status(404).json({ error: 'Portfolio item not found' });

    user.portfolio.splice(itemIndex, 1);
    const updatedUser = jsondb.updateUser(req.user.id, { portfolio: user.portfolio });
    res.json({ portfolio: updatedUser.portfolio });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove from portfolio' });
  }
});

module.exports = router;
