const API_KEY = "4bfb335317b54469880db563de8ed153";

async function getStockNews(company) {
  try {
    const query = company ? `${company} stock` : 'Indian stock market';
    const targetUrl = `/api/news?q=${encodeURIComponent(query)}`;

    const res = await fetch(targetUrl);
    if (!res.ok) throw new Error("Backend proxy error");
    
    const data = await res.json();

    if (data.status === 'error') {
      throw new Error(data.message || 'Failed to fetch news');
    }

    if (!data.articles || data.articles.length === 0) {
      throw new Error("No articles found");
    }

    return data.articles;
  } catch (error) {
    console.error("News API Error:", error);
    if (typeof showToast === 'function') {
      showToast("Using fallback news: " + error.message, "info");
    }
    
    // Return mock data so the UI doesn't break
    return [
      {
        title: "Sensex, Nifty Hit Record Highs Amid Global Rally",
        description: "The Indian stock market benchmarks touched new all-time highs today as positive global cues and strong domestic earnings boosted investor sentiment across the board.",
        source: { name: "Financial Times" },
        publishedAt: new Date().toISOString(),
        url: "#",
        urlToImage: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Tech Giants Announce Stellar Q3 Earnings, Shares Surge",
        description: "Major technology companies have reported better-than-expected earnings for the third quarter, driving a significant rally in tech stocks and lifting the broader market indices.",
        source: { name: "Market Watch" },
        publishedAt: new Date().toISOString(),
        url: "#",
        urlToImage: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "RBI Keeps Repo Rate Unchanged, Focuses on Inflation Control",
        description: "In its latest monetary policy meeting, the Reserve Bank of India decided to keep the repo rate unchanged, prioritizing inflation management while supporting economic growth.",
        source: { name: "Economic Times" },
        publishedAt: new Date().toISOString(),
        url: "#",
        urlToImage: "https://images.unsplash.com/photo-1601597111158-2fceff292cdc?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "IPO Market Heats Up: Three New Companies to List This Week",
        description: "The primary market is seeing renewed activity with three major initial public offerings scheduled for this week, expecting strong subscriptions from retail and institutional investors.",
        source: { name: "Business Standard" },
        publishedAt: new Date().toISOString(),
        url: "#",
        urlToImage: "https://images.unsplash.com/photo-1591696205602-2f950c417cb9?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Gold Prices Stabilize After Recent Volatility",
        description: "Following weeks of sharp fluctuations, gold prices have found some stability as investors weigh inflation data and central bank policies.",
        source: { name: "Reuters" },
        publishedAt: new Date().toISOString(),
        url: "#",
        urlToImage: "https://images.unsplash.com/photo-1610375461246-83ff852e21bc?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Electric Vehicle Sector Sees Massive Investments",
        description: "Several automakers have announced billions in new investments to expand their electric vehicle manufacturing capabilities in India, promising thousands of new jobs.",
        source: { name: "Auto India" },
        publishedAt: new Date().toISOString(),
        url: "#",
        urlToImage: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Dividend Yield Stocks Attract Value Investors",
        description: "As markets reach new highs, value investors are increasingly shifting their focus toward high dividend yield stocks to ensure consistent returns in a volatile environment.",
        source: { name: "Investing.com" },
        publishedAt: new Date().toISOString(),
        url: "#",
        urlToImage: "https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Global Supply Chain Disruptions Continue to Affect Retailers",
        description: "Ongoing supply chain issues and port congestions are forcing major retailers to rethink their inventory strategies ahead of the crucial holiday shopping season.",
        source: { name: "Bloomberg" },
        publishedAt: new Date().toISOString(),
        url: "#",
        urlToImage: "https://images.unsplash.com/photo-1586528116311-ad8ed7c508c0?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Cryptocurrency Markets Show Signs of Recovery",
        description: "After a prolonged bearish trend, major cryptocurrencies are showing signs of life with Bitcoin and Ethereum posting their first weekly gains in months.",
        source: { name: "Crypto News" },
        publishedAt: new Date().toISOString(),
        url: "#",
        urlToImage: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }
}

let currentNews = [];
let currentPage = 1;
const itemsPerPage = 5; // 1 featured + 4 latest

function renderNews(news, containerId) {
  const container = document.getElementById(containerId);
  const paginationContainer = document.getElementById("pagination-container");

  if (!news || news.length === 0) {
    container.innerHTML = `
      <div class="glass-card" style="text-align:center; padding:40px;">
        <p class="text-muted" style="font-family: 'Playfair Display', serif; font-size: 24px;">No stories available for this edition.</p>
      </div>
    `;
    if (paginationContainer) paginationContainer.innerHTML = "";
    return;
  }

  // Filter for stock related headlines as requested
  const filteredNews = news.filter(article => 
    article.title && (
      article.title.toLowerCase().includes("share") ||
      article.title.toLowerCase().includes("stock") ||
      article.title.toLowerCase().includes("earnings") ||
      article.title.toLowerCase().includes("market") ||
      article.title.toLowerCase().includes("dividend") ||
      article.title.toLowerCase().includes("invest") ||
      article.title.toLowerCase().includes("sensex") ||
      article.title.toLowerCase().includes("nifty") ||
      article.title.toLowerCase().includes("profit") ||
      article.title.toLowerCase().includes("ipo")
    )
  );

  // If filter is too strict and returns nothing, fallback to original news
  currentNews = filteredNews.length > 0 ? filteredNews : news;
  currentPage = 1;
  renderPage(currentPage, containerId);
}

function renderPage(page, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  const totalPages = Math.ceil(currentNews.length / itemsPerPage);
  if (page < 1) page = 1;
  if (page > totalPages) page = totalPages;
  currentPage = page;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageItems = currentNews.slice(startIndex, endIndex);

  if (pageItems.length === 0) return;

  const getReadTime = (text) => {
    const words = text ? text.split(' ').length : 100;
    const time = Math.ceil(words / 200);
    return `${time} min read`;
  };

  const getCategory = (title) => {
    const t = title.toLowerCase();
    if(t.includes('movie') || t.includes('netflix') || t.includes('film')) return 'Movies';
    if(t.includes('sport') || t.includes('formula 1') || t.includes('match') || t.includes('game')) return 'Sport';
    if(t.includes('crime') || t.includes('killed') || t.includes('police')) return 'Crime';
    if(t.includes('stock') || t.includes('market') || t.includes('sensex') || t.includes('nifty')) return 'Finance';
    return 'News';
  };

  // 1. Featured Article
  const featuredArticle = pageItems[0];
  let featuredHtml = '';
  if (featuredArticle) {
    const dateStr = new Date(featuredArticle.publishedAt);
    let timeAgo = Math.floor((new Date() - dateStr) / 60000);
    timeAgo = timeAgo > 60 ? `${Math.floor(timeAgo/60)} hours ago` : `${timeAgo} minutes ago`;

    const imgTag = featuredArticle.urlToImage ? `
      <div class="featured-image-container">
        <img src="${featuredArticle.urlToImage}" class="featured-image" onerror="this.src='https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80'">
      </div>` : '';
    const initial = featuredArticle.source.name.charAt(0).toUpperCase();

    featuredHtml = `
      <div class="featured-news-wrapper">
        ${imgTag}
        <div>
          <div class="news-source-meta">
            <span class="source-icon">${initial}</span>
            <span>${featuredArticle.source.name}</span>
            <span>•</span>
            <span>${timeAgo}</span>
          </div>
          <a href="${featuredArticle.url}" target="_blank" class="featured-title">${featuredArticle.title}</a>
          <p class="featured-excerpt">${featuredArticle.description ? featuredArticle.description.substring(0, 180) + '...' : ''}</p>
          <div class="news-category-meta">
            <span>${getCategory(featuredArticle.title)}</span> • ${getReadTime(featuredArticle.content || featuredArticle.description)}
          </div>
        </div>
      </div>
    `;
  }

  // 2. Latest News Grid
  let latestHtml = `
    <div class="section-header">
      <h2>Latest News</h2>
      <a href="#">See all ⟶</a>
    </div>
    <div class="latest-news-grid">
  `;
  for(let i = 1; i < Math.min(5, pageItems.length); i++) {
    const article = pageItems[i];
    const dateStr = new Date(article.publishedAt);
    let timeAgo = Math.floor((new Date() - dateStr) / 60000);
    timeAgo = timeAgo > 60 ? `${Math.floor(timeAgo/60)} hours ago` : `${timeAgo} minutes ago`;
    const initial = article.source.name.charAt(0).toUpperCase();

    latestHtml += `
      <div class="latest-news-card">
        <a href="${article.url}" target="_blank" class="latest-img-wrapper">
          <img src="${article.urlToImage || 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80'}" class="latest-card-img" onerror="this.src='https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80'">
        </a>
        <div class="news-source-meta" style="margin-bottom: 8px;">
          <span class="source-icon" style="width:16px;height:16px;font-size:8px;">${initial}</span>
          <span>${article.source.name}</span>
          <span>•</span>
          <span>${timeAgo}</span>
        </div>
        <a href="${article.url}" target="_blank" class="latest-card-title">${article.title}</a>
        <p class="latest-card-excerpt">${article.description ? article.description.substring(0, 80) + '...' : ''}</p>
        <div class="news-category-meta">
          <span>${getCategory(article.title)}</span> • ${getReadTime(article.content || article.description)}
        </div>
      </div>
    `;
  }
  latestHtml += `</div>`;

  // 3. Bulletin Story
  let bulletinHtml = `
    <div class="section-header">
      <h2>Buletin Story</h2>
      <a href="#">See all ⟶</a>
    </div>
    <div class="bulletin-scroll">
  `;
  
  // Extract unique sources for bulletin
  const uniqueSources = [];
  const sourceNames = new Set();
  currentNews.forEach(article => {
    if(!sourceNames.has(article.source.name)) {
      sourceNames.add(article.source.name);
      uniqueSources.push(article.source.name);
    }
  });

  // Mock colors for bulletin circles
  const colors = ['#e63946', '#1d3557', '#457b9d', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51', '#2b2d42', '#8d99ae'];
  
  uniqueSources.slice(0, 10).forEach((source, index) => {
    const initial = source.substring(0, 2).toUpperCase();
    const bgColor = colors[index % colors.length];
    
    bulletinHtml += `
      <div class="bulletin-item" onclick="loadNews('${source}')">
        <div class="bulletin-circle" style="background-color: ${bgColor};">
          ${initial}
        </div>
        <div class="bulletin-name">${source.length > 12 ? source.substring(0,10)+'...' : source}</div>
      </div>
    `;
  });
  bulletinHtml += `</div>`;

  container.innerHTML = featuredHtml + latestHtml + bulletinHtml;
  renderPaginationControls(totalPages, containerId);
}

function renderPaginationControls(totalPages, containerId) {
  const paginationContainer = document.getElementById("pagination-container");
  if (!paginationContainer) return;
  
  paginationContainer.innerHTML = "";

  if (totalPages <= 1) return;

  const prevBtn = document.createElement("button");
  prevBtn.className = "btn btn-secondary btn-sm";
  prevBtn.textContent = "Previous";
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => {
    if (currentPage > 1) {
      renderPage(currentPage - 1, containerId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  if(currentPage === 1) prevBtn.style.opacity = "0.5";

  const pageInfo = document.createElement("span");
  pageInfo.style.display = "flex";
  pageInfo.style.alignItems = "center";
  pageInfo.style.fontSize = "14px";
  pageInfo.style.color = "#555";
  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

  const nextBtn = document.createElement("button");
  nextBtn.className = "btn btn-secondary btn-sm";
  nextBtn.textContent = "Next";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => {
    if (currentPage < totalPages) {
      renderPage(currentPage + 1, containerId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  if(currentPage === totalPages) nextBtn.style.opacity = "0.5";

  paginationContainer.appendChild(prevBtn);
  paginationContainer.appendChild(pageInfo);
  paginationContainer.appendChild(nextBtn);
}

async function loadNews(topic = null) {
  const containerId = "news-container";
  
  // Removed titleEl modification to preserve the banner layout

  document.getElementById(containerId).innerHTML = `
    <div style="text-align:center; padding:40px; width: 100%;">
      <div class="loading-spinner"></div>
      <p class="loading-text mt-2" style="color: #666;">Fetching latest news...</p>
    </div>
  `;

  const articles = await getStockNews(topic);
  renderNews(articles, containerId);
}

document.addEventListener("DOMContentLoaded", () => {
  loadNews(); // Load default news on load

  const searchBtn = document.getElementById("search-news-btn");
  const searchInput = document.getElementById("news-search");

  if (searchBtn && searchInput) {
    searchBtn.addEventListener("click", () => {
      const topic = searchInput.value.trim();
      if (topic) {
        loadNews(topic);
      }
    });

    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const topic = searchInput.value.trim();
        if (topic) {
          loadNews(topic);
        }
      }
    });
  }

  // Handle category clicks
  const categories = document.querySelectorAll('.news-category');
  categories.forEach(category => {
    category.addEventListener('click', (e) => {
      // Update active state
      categories.forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');

      const topic = e.target.getAttribute('data-topic');
      loadNews(topic || null);
    });
  });
});
