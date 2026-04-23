const { getJson } = require('serpapi');
require('dotenv').config({ path: __dirname + '/../.env' });

const API_KEY = process.env.SERPAPI_KEY;

async function getMarkets(trend = 'most-active') {
  try {
    const result = await getJson({
      engine: 'google_finance_markets',
      trend: trend,
      api_key: API_KEY
    });
    return result;
  } catch (error) {
    console.error('SerpAPI Error:', error.message || error);
    return null;
  }
}

async function getStockQuote(ticker) {
  try {
    const result = await getJson({
      engine: 'google_finance',
      q: ticker,
      api_key: API_KEY
    });
    return result;
  } catch (error) {
    console.error('SerpAPI Quote Error:', error.message);
    return null;
  }
}

async function getMarketIndices() {
  try {
    const result = await getJson({
      engine: 'google_finance_markets',
      trend: 'indexes',
      api_key: API_KEY
    });
    return result;
  } catch (error) {
    console.error('SerpAPI Indices Error:', error.message);
    return null;
  }
}

module.exports = { getMarkets, getStockQuote, getMarketIndices };
