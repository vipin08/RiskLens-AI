const express = require('express');
const router = express.Router();
const axios = require('axios');
const Analysis = require('../models/Analysis');
const auth = require('../middleware/auth');
require('dotenv').config({ path: __dirname + '/../.env' });

const PYTHON_AI_URL = process.env.PYTHON_AI_URL || 'http://127.0.0.1:5001';
const SERPAPI_KEY_FALLBACK = process.env.SERPAPI_KEY || '6ae3874806be57c6e5d1077e5f9cf4e28f1032a0fa25147ca69fa44bc53d0e53';

router.get('/:ticker', auth, async (req, res) => {
  try {
    let ticker = req.params.ticker.toUpperCase();
    if (ticker.includes(':')) ticker = ticker.split(':')[0];

    const aiResponse = await axios.get(`${PYTHON_AI_URL}/analyze/${ticker}`, { timeout: 60000 });
    const aiResult = aiResponse.data;

    const analysis = new Analysis({
      ticker,
      userId: req.user.id,
      score: aiResult.score,
      signal: aiResult.signal,
      confidence: aiResult.confidence,
      summary: aiResult.summary,
      indicators: aiResult.indicators,
      forecast: aiResult.forecast,
      reasons: aiResult.reasons
    });

    await analysis.save();

    res.json(analysis);
  } catch (error) {
    console.error('AI Engine Analysis error:', error.message);

    console.log('AI Engine failed. Attempting SerpApi fallback for analysis.');
    try {
      const { getJson } = require('serpapi');
      const originalTicker = req.params.ticker.toUpperCase();
      const serpData = await getJson({ engine: 'google_finance', q: originalTicker, api_key: SERPAPI_KEY_FALLBACK });

      if (!serpData) {
        throw new Error('SerpApi could not find data for this ticker.');
      }

      let summary = serpData.summary;
      if (!summary && serpData.suggestions && serpData.suggestions.length > 0) {
        summary = serpData.suggestions[0];
      }

      if (!summary) {
        throw new Error('SerpApi could not find data for this ticker.');
      }

      const movement = summary.price_movement?.movement || 'Neutral';
      let signal = 'HOLD';
      if (movement === 'Up') signal = 'BUY';
      if (movement === 'Down') signal = 'WAIT';

      const liteAnalysis = {
        ticker: originalTicker,
        userId: req.user.id,
        score: 50,
        signal: signal,
        confidence: 40,
        summary: `SerpApi Fallback: Based on current price movement (${movement}), the signal is ${signal}. Full AI analysis was unavailable.`,
        indicators: {
          currentPrice: summary.extracted_price,
        },
        forecast: {},
        reasons: ['Used SerpApi fallback due to AI engine failure.', `Price movement is currently ${movement}.`]
      };

      const analysis = new Analysis(liteAnalysis);
      await analysis.save();
      res.json(analysis);

    } catch (fallbackError) {
      console.error('SerpApi Fallback Analysis error:', fallbackError.message);
      res.status(500).json({ error: 'Primary AI analysis and fallback both failed.' });
    }
  }
});

router.get('/history/:ticker', auth, async (req, res) => {
  try {
    const ticker = req.params.ticker.toUpperCase();
    const analyses = await Analysis.find({ ticker }).sort({ createdAt: -1 }).limit(20);
    res.json(analyses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analysis history' });
  }
});

router.get('/latest/:ticker', async (req, res) => {
  try {
    const ticker = req.params.ticker.toUpperCase();
    const analysis = await Analysis.findOne({ ticker }).sort({ createdAt: -1 });
    if (!analysis) return res.status(404).json({ error: 'No analysis found' });
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analysis' });
  }
});

module.exports = router;
