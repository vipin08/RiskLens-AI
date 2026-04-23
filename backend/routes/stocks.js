const express = require('express');
const router = express.Router();
const axios = require('axios');

const PYTHON_AI_URL = process.env.PYTHON_AI_URL || 'http://localhost:5001';

const customAgent = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5'
  }
};
const { getMarkets, getStockQuote, getMarketIndices } = require('../utils/serpapi');
const auth = require('../middleware/auth');

router.get('/markets/:trend?', async (req, res) => {
  try {
    const trend = req.params.trend || 'most-active';
    const data = await getMarkets(trend);
    if (!data) return res.status(503).json({ error: 'Market data unavailable' });
    res.json(data);
  } catch (error) {
    console.error('Markets error:', error);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});

router.get('/indices', async (req, res) => {
  try {
    const data = await getMarketIndices();
    if (!data) return res.status(503).json({ error: 'Index data unavailable' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch indices' });
  }
});

router.get('/quote/:ticker', async (req, res) => {
  try {
    const ticker = req.params.ticker.toUpperCase();
    const data = await getStockQuote(ticker);
    if (!data) return res.status(404).json({ error: 'Ticker not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

router.get('/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Query required' });

    const response = await axios.get(`${PYTHON_AI_URL}/search`, {
      params: { q: query }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

router.get('/history/:ticker', async (req, res) => {
  try {
    let ticker = req.params.ticker.toUpperCase();
    if (ticker.includes(':')) ticker = ticker.split(':')[0];
    const period = req.query.period || '1y';

    try {
      const response = await axios.get(`${PYTHON_AI_URL}/history/${ticker}`, {
        params: { period }
      });
      return res.json(response.data);
    } catch (aiError) {
      console.log('Python AI history failed, using SerpApi fallback...');
      const { getJson } = require('serpapi');
      const windowMap = { '1m': '1M', '3m': '3M', '6m': '6M', '1y': '1Y', '5y': '5Y', 'max': 'MAX' };
      const serpWindow = windowMap[period.toLowerCase()] || '1Y';

      const serpData = await getJson({ engine: 'google_finance', q: req.params.ticker, window: serpWindow, api_key: process.env.SERPAPI_KEY });
      if (!serpData.graph) return res.status(404).json({ error: 'No history found' });

      const history = serpData.graph.map(point => ({
        date: point.date,
        close: point.price,
        volume: point.volume || 0
      }));
      return res.json({ data: history });
    }
  } catch (error) {
    console.error('History error:', error.message);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

router.get('/summary/:ticker', async (req, res) => {
  try {
    let ticker = req.params.ticker.toUpperCase();
    if (ticker.includes(':')) ticker = ticker.split(':')[0];

    try {
      const response = await axios.get(`${PYTHON_AI_URL}/quote/${ticker}`);
      return res.json(response.data);
    } catch (aiError) {
      console.log('Python AI summary failed, using SerpApi fallback...');
      const { getJson } = require('serpapi');
      const serpData = await getJson({ engine: 'google_finance', q: req.params.ticker, api_key: process.env.SERPAPI_KEY });

      if (!serpData || !serpData.summary) {
        return res.status(404).json({ error: 'Summary not found in SerpApi' });
      }

      const summary = serpData.summary;
      const kg = serpData.knowledge_graph || {};
      const stats = (kg.key_stats && kg.key_stats.stats) ? kg.key_stats.stats : [];
      const getStat = (label) => {
        const s = stats.find(st => st.label.toLowerCase() === label.toLowerCase());
        return s ? s.value : null;
      };

      const yearRange = getStat('Year range');
      let low52 = 0, high52 = 0;
      if (yearRange) {
        const parts = yearRange.split('-').map(p => parseFloat(p.replace(/[^0-9.]/g, '')));
        if (parts.length === 2) { low52 = parts[0]; high52 = parts[1]; }
      }

      const parseValue = (v) => {
        if (!v) return 0;
        let m = 1;
        if (v.includes('M')) m = 1e6;
        if (v.includes('B')) m = 1e9;
        if (v.includes('T')) m = 1e12;
        return parseFloat(v.replace(/[^0-9.]/g, '')) * m;
      };

      const pm = summary.price_movement || { percentage: 0, value: 0, movement: 'Up' };
      const changeVal = pm.value * (pm.movement === 'Down' ? -1 : 1);

      return res.json({
        shortName: summary.title || ticker,
        longName: summary.title || ticker,
        regularMarketPrice: summary.extracted_price || 0,
        regularMarketChange: changeVal,
        regularMarketChangePercent: pm.percentage * (pm.movement === 'Down' ? -1 : 1),
        marketCap: parseValue(getStat('Market cap')),
        fiftyTwoWeekHigh: high52,
        fiftyTwoWeekLow: low52,
        trailingPE: parseFloat(getStat('P/E ratio')) || null,
        regularMarketVolume: parseValue(getStat('Avg Volume')),
        averageDailyVolume3Month: parseValue(getStat('Avg Volume'))
      });
    }
  } catch (error) {
    console.error('Summary error:', error.message);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

module.exports = router;
