// Guard against double-injection on SPA re-navigations
if (!window.__ffc_injected) {
  window.__ffc_injected = true;

  // ── Site configs ────────────────────────────────────────────────────────────

  const SITE_CONFIGS = {
    amazon: {
      itemContainer: '.product-description-column',
      name: '.lineitem-title-text',
      prices: '.lineitem-price-text'
    },
    nike: {
      itemContainer: '[data-automation="cart-item"]',
      name: '[data-automation="cart-item-product-name"]',
      prices: '.formatted-price'
    },
    ebay: {
      itemContainer: '.evo-item-detail',
      name: 'a[data-test-id="cart-item-link"]',
      prices: '.price-details'
    },
    bestBuy: {
      itemContainer: '.card',
        name: '.cart-item__title',
        prices: '.price-block'
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function parsePrice(str) {
    if (!str) return 0;
    const match = str.replace(/,/g, '').match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  }

  function scrapeCurrentPage() {
    const host = window.location.hostname;
    let config, label;

    if      (host.includes('amazon'))  { config = SITE_CONFIGS.amazon;  label = 'Amazon'; }
    else if (host.includes('nike'))    { config = SITE_CONFIGS.nike;    label = 'Nike'; }
    else if (host.includes('ebay'))    { config = SITE_CONFIGS.ebay;    label = 'eBay'; }
    else if (host.includes('bestbuy')) { config = SITE_CONFIGS.bestBuy; label = 'Best Buy'; }
    else return null;

    const containers = Array.from(document.querySelectorAll(config.itemContainer));
    console.log('[FFC] Site:', label, '| Containers found:', containers.length);

    const items = containers.map(container => {
      const nameEl  = container.querySelector(config.name);
      const priceEl = container.querySelector(config.prices);
      console.log('[FFC] name:', nameEl?.innerText?.trim(), '| price:', priceEl?.innerText?.trim());
      if (!priceEl) return null;
      const rawName    = nameEl ? nameEl.innerText : 'Unknown Product';
      const priceMatch = priceEl.innerText.match(/\$\d+[\.,]\d{2}/);
      return {
        name:  rawName.trim().replace(/\s+/g, ' '),
        price: priceMatch ? priceMatch[0] : 'N/A'
      };
    }).filter(Boolean);

    return { label, items };
  }

  async function fetchInsult(total, budget, intensity, site) {
    try {
      const pct = budget > 0 ? Math.round((total / budget) * 100) : 0;
      const response = await fetch('http://localhost:3000/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ total, budget, percentUsed: pct, intensity, site })
      });
      if (!response.ok) throw new Error('Server error');
      const data = await response.json();
      return data.reply;
    } catch (err) {
      console.error('[FFC] Gemini fetch failed:', err);
      return 'The shame engine is offline. Consider that a blessing.';
    }
  }

  // ── Styles ──────────────────────────────────────────────────────────────────

  const STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@700&family=DM+Sans:wght@400;500&display=swap');

    #ffc-fab {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: #ff6b2b;
      color: #000;
      font-family: 'Space Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(255,107,43,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.15s, box-shadow 0.15s;
    }
    #ffc-fab:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 24px rgba(255,107,43,0.7);
    }
    #ffc-panel {
      position: fixed;
      bottom: 88px;
      right: 24px;
      z-index: 2147483646;
      width: 290px;
      background: #0f0f0f;
      border: 1px solid #2a2a2a;
      border-radius: 12px;
      font-family: 'DM Sans', Arial, sans-serif;
      color: #f0f0f0;
      font-size: 13px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.6);
      overflow: hidden;
      display: none;
      flex-direction: column;
    }
    #ffc-panel.visible { display: flex; }
    #ffc-panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 14px;
      background: #1a1a1a;
      border-bottom: 1px solid #2a2a2a;
    }
    #ffc-panel-title {
      font-family: 'Space Mono', monospace;
      font-size: 11px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #ff6b2b;
      font-weight: 700;
    }
    #ffc-close {
      background: none;
      border: none;
      color: #888;
      font-size: 16px;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }
    #ffc-close:hover { color: #f0f0f0; }
    #ffc-body { padding: 12px 14px 14px; }
    #ffc-scan-btn {
      width: 100%;
      padding: 9px;
      background: #ff6b2b;
      color: #000;
      border: none;
      border-radius: 7px;
      font-family: 'Space Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      cursor: pointer;
      margin-bottom: 10px;
      transition: background 0.15s;
    }
    #ffc-scan-btn:hover { background: #cc4a10; }
    #ffc-scan-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    #ffc-display { font-size: 12px; }
    .ffc-site-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #ff6b2b;
      margin-bottom: 6px;
    }
    .ffc-cart-row {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      padding: 5px 0;
      border-bottom: 1px solid #2a2a2a;
      font-size: 12px;
    }
    .ffc-cart-name { color: #888; flex: 1; line-height: 1.3; }
    .ffc-cart-price { font-family: 'Space Mono', monospace; color: #ff6b2b; font-weight: 700; white-space: nowrap; }
    .ffc-total { text-align: right; padding: 7px 0 3px; font-size: 12px; }
    .ffc-total strong { font-family: 'Space Mono', monospace; color: #ff6b2b; }
    .ffc-bar-wrap { margin: 7px 0; }
    .ffc-bar-track { height: 5px; background: #2a2a2a; border-radius: 99px; overflow: hidden; }
    .ffc-bar-fill { height: 100%; border-radius: 99px; transition: width 0.5s ease; }
    .ffc-bar-label { font-size: 10px; color: #888; margin-top: 3px; font-family: 'Space Mono', monospace; }
    .ffc-remaining {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 8px;
      background: #1a1a1a;
      border-radius: 6px;
      border: 1px solid #2a2a2a;
      font-size: 11px;
      margin-bottom: 8px;
    }
    .ffc-remaining span { color: #888; }
    .ffc-insult {
      background: #1a1a1a;
      border-left: 3px solid #ff6b2b;
      border-radius: 0 6px 6px 0;
      padding: 8px 10px;
      font-size: 12px;
      line-height: 1.5;
      color: #f0f0f0;
      font-style: italic;
      min-height: 40px;
    }
    .ffc-insult.loading {
      color: #555;
      animation: ffc-pulse 1s ease infinite;
    }
    .ffc-muted { color: #888; font-size: 11px; padding: 4px 0; }
    @keyframes ffc-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = STYLES;
  document.head.appendChild(styleEl);

  // ── Build overlay ───────────────────────────────────────────────────────────

  const fab = document.createElement('button');
  fab.id = 'ffc-fab';
  fab.textContent = 'FFC';
  document.body.appendChild(fab);

  const panel = document.createElement('div');
  panel.id = 'ffc-panel';
  panel.innerHTML = `
    <div id="ffc-panel-header">
      <span id="ffc-panel-title">💸 Budget Check</span>
      <button id="ffc-close">✕</button>
    </div>
    <div id="ffc-body">
      <button id="ffc-scan-btn">New Insult</button>
      <div id="ffc-display"></div>
    </div>
  `;
  document.body.appendChild(panel);

  // ── Core scan + insult function ─────────────────────────────────────────────

  async function runScan() {
    const display = document.getElementById('ffc-display');
    const btn     = document.getElementById('ffc-scan-btn');
    btn.disabled  = true;

    const result = scrapeCurrentPage();

    if (!result || result.items.length === 0) {
      display.innerHTML = '<div class="ffc-muted">No cart items found. The page may still be loading — try again in a moment.</div>';
      btn.disabled = false;
      return;
    }

    const { label, items } = result;

    chrome.storage.local.get(['budget', 'intensity'], async (data) => {
      const budget    = parseFloat(data.budget) || 0;
      const intensity = data.intensity || 'normal';
      const total     = items.reduce((sum, item) => sum + parsePrice(item.price), 0);
      const remaining = budget - total;

      // Build item list HTML
      let html = `<div class="ffc-site-label">${label} Cart</div>`;
      items.forEach(item => {
        html += `
          <div class="ffc-cart-row">
            <span class="ffc-cart-name">${item.name.substring(0, 40)}…</span>
            <span class="ffc-cart-price">${item.price}</span>
          </div>`;
      });

      html += `<div class="ffc-total">Cart Total: <strong>$${total.toFixed(2)}</strong></div>`;

      if (budget > 0) {
        const pct      = Math.round((total / budget) * 100);
        const barColor = pct >= 100 ? '#e53e3e' : pct >= 75 ? '#dd6b20' : pct >= 40 ? '#d69e2e' : '#38a169';
        const remColor = remaining <= 0 ? '#e53e3e' : '#38a169';

        html += `
          <div class="ffc-bar-wrap">
            <div class="ffc-bar-track">
              <div class="ffc-bar-fill" style="width:${Math.min(pct,100)}%;background:${barColor}"></div>
            </div>
            <div class="ffc-bar-label">${pct}% of $${budget.toFixed(0)} budget used</div>
          </div>
          <div class="ffc-remaining">
            <span>Remaining if bought:</span>
            <strong style="font-family:'Space Mono',monospace;color:${remColor};">$${remaining.toFixed(2)}</strong>
          </div>
          <div class="ffc-insult loading" id="ffc-insult-box">Consulting the shame engine…</div>`;

        display.innerHTML = html;

        // Fetch Gemini insult async
        const insult = await fetchInsult(total, budget, intensity, label);
        const insultEl = document.getElementById('ffc-insult-box');
        if (insultEl) {
          insultEl.textContent = insult;
          insultEl.classList.remove('loading');
        }

      } else {
        html += `<div class="ffc-insult">Set a budget in the extension popup to get roasted.</div>`;
        display.innerHTML = html;
      }

      btn.disabled = false;
    });
  }

  // ── Event handlers ──────────────────────────────────────────────────────────

  fab.addEventListener('click', () => panel.classList.toggle('visible'));

  document.getElementById('ffc-close').addEventListener('click', () => {
    panel.classList.remove('visible');
  });

  document.getElementById('ffc-scan-btn').addEventListener('click', runScan);

  // Auto-open and auto-scan on cart page load
  panel.classList.add('visible');
  setTimeout(runScan, 1400);
}