// Guard against double-injection on SPA re-navigations
if (!window.__ffc_injected) {
  window.__ffc_injected = true;

  // ── Insult Engine (duplicated here — content scripts can't import modules) ──

  const INSULTS = {
    'very-strict': {
      safe:    ["You didn't buy anything. Impressive restraint. Or you're just broke.", "Zero spend. Are you okay? That's not normal."],
      warning: ["Already at {pct}% of your budget? You have the willpower of a golden retriever in a butcher shop.", "{pct}% gone. Congrats, you're on pace to be broke.", "{pct}%? Your budget called. It's crying."],
      danger:  ["You're at {pct}% of your budget. Your future self hates you.", "Sir/Ma'am, {pct}% of your budget is GONE. Do you need an intervention?", "{pct}%?! Your wallet filed for emotional damages."],
      over:    ["You are {over} OVER budget. Absolutely unhinged behavior.", "Budget: defeated. You: chaos gremlin. Amount over: {over}.", "You blew past your budget by {over}. Your ancestors are disappointed."]
    },
    'strict': {
      safe:    ["Under budget. Don't get used to it.", "You're safe... for now. We both know this won't last."],
      warning: ["At {pct}% of budget. Slow down, champ.", "You've burned {pct}%. Your savings account just winced.", "{pct}% in — interesting choices you're making."],
      danger:  ["Yikes. {pct}% of budget gone. Maybe log off?", "At {pct}%, you're one 'add to cart' away from disaster.", "At {pct}% you should probably close the browser."],
      over:    ["Over budget by {over}. Bold strategy. How's that working out?", "You went {over} over. Outstanding in the worst possible way.", "Budget exceeded by {over}. I'm not mad, just disappointed. Actually I'm a little mad."]
    },
    'normal': {
      safe:    ["You're under budget! Look at you, a responsible adult.", "Under budget. Treat yourself... to NOT spending more."],
      warning: ["At {pct}% of your budget. Keep an eye on it.", "Sitting at {pct}%. Not bad, not great.", "{pct}% — you're walking the line."],
      danger:  ["You're at {pct}% — getting a little spicy in here.", "Oof, {pct}%. Maybe put the card down for a sec?", "At {pct}%, you're walking a fine line, friend."],
      over:    ["You went over by {over}. It happens. (It shouldn't, but it happens.)", "Over by {over}. Time to re-evaluate some life choices.", "Budget busted by {over}. We live and we learn. Mostly we just spend."]
    },
    'non-strict': {
      safe:    ["Under budget! You're doing amazing sweetie.", "All good! Money is just points in a game anyway."],
      warning: ["At {pct}% — totally fine, you deserve nice things.", "{pct}% spent. Honestly not that bad, keep living your life.", "Used {pct}%. Hey, YOLO right? (Please don't YOLO.)"],
      danger:  ["Okay so {pct}% is a lot but... you only live once?", "At {pct}%? I mean... is it really that bad? (It kind of is.)", "{pct}%! But you know what, money comes and goes."],
      over:    ["Over by {over} but honestly? Treat yourself. (Just kidding, please stop.)", "You went {over} over budget. But I believe in your ability to earn it back!", "Budget exceeded by {over}. At least you have good taste!"]
    }
  };

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
    bestbuy: {
      itemContainer: '.fluid-large-view__info-column',
      name: '.item-title',
      prices: '.pricing-price__regular-price'
    }
  };

  function parsePrice(str) {
    if (!str) return 0;
    const match = str.replace(/,/g, '').match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  }

  function generateInsult(totalSpent, budget, intensity) {
    const tier = INSULTS[intensity] || INSULTS['normal'];
    const pct = budget > 0 ? Math.round((totalSpent / budget) * 100) : 0;
    const over = totalSpent - budget;
    let pool;
    if (totalSpent === 0) pool = tier.safe;
    else if (pct >= 100)  pool = tier.over;
    else if (pct >= 75)   pool = tier.danger;
    else if (pct >= 40)   pool = tier.warning;
    else                  pool = tier.safe;
    const template = pool[Math.floor(Math.random() * pool.length)];
    return template.replace('{pct}', pct).replace('{over}', '$' + over.toFixed(2));
  }

  function scrapeCurrentPage() {
    const host = window.location.hostname;
    let site;
    if (host.includes('amazon'))  site = { config: SITE_CONFIGS.amazon,  label: 'Amazon' };
    else if (host.includes('nike'))    site = { config: SITE_CONFIGS.nike,    label: 'Nike' };
    else if (host.includes('ebay'))    site = { config: SITE_CONFIGS.ebay,    label: 'eBay' };
    else if (host.includes('bestbuy')) site = { config: SITE_CONFIGS.bestbuy, label: 'Best Buy' };
    else return null;

    const containers = Array.from(document.querySelectorAll(site.config.itemContainer));
    const items = containers.map(container => {
      const nameEl  = container.querySelector(site.config.name);
      const priceEl = container.querySelector(site.config.prices);
      if (!priceEl) return null;
      const rawName = nameEl ? nameEl.innerText : 'Unknown Product';
      const priceMatch = priceEl.innerText.match(/\$\d+[\.,]\d{2}/);
      return {
        name:  rawName.trim().replace(/\s+/g, ' '),
        price: priceMatch ? priceMatch[0] : 'N/A'
      };
    }).filter(Boolean);

    return { label: site.label, items };
  }

  // ── Build & Inject Overlay ────────────────────────────────────────────────────

  const STYLES = `
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
      width: 280px;
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
      font-family: monospace;
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
      font-family: monospace;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      cursor: pointer;
      margin-bottom: 10px;
      transition: background 0.15s;
    }
    #ffc-scan-btn:hover { background: #cc4a10; }
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
    .ffc-cart-price { font-family: monospace; color: #ff6b2b; font-weight: 700; white-space: nowrap; }
    .ffc-total {
      text-align: right;
      padding: 7px 0 3px;
      font-size: 12px;
    }
    .ffc-total strong { font-family: monospace; color: #ff6b2b; }
    .ffc-bar-wrap { margin: 7px 0; }
    .ffc-bar-track { height: 5px; background: #2a2a2a; border-radius: 99px; overflow: hidden; }
    .ffc-bar-fill { height: 100%; border-radius: 99px; transition: width 0.5s ease; }
    .ffc-bar-label { font-size: 10px; color: #888; margin-top: 3px; font-family: monospace; }
    .ffc-insult {
      background: #1a1a1a;
      border-left: 3px solid #ff6b2b;
      border-radius: 0 6px 6px 0;
      padding: 7px 10px;
      font-size: 12px;
      line-height: 1.5;
      color: #f0f0f0;
      margin-top: 8px;
      font-style: italic;
    }
    .ffc-muted { color: #888; font-size: 11px; padding: 4px 0; }
    .ffc-scanning {
      color: #888;
      font-family: monospace;
      font-size: 11px;
      text-align: center;
      padding: 8px 0;
      animation: ffc-pulse 1s ease infinite;
    }
    @keyframes ffc-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
  `;

  // Inject Google Fonts
  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Space+Mono:wght@700&family=DM+Sans:wght@400;500&display=swap';
  document.head.appendChild(fontLink);

  // Inject styles
  const styleEl = document.createElement('style');
  styleEl.textContent = STYLES;
  document.head.appendChild(styleEl);

  // FAB button
  const fab = document.createElement('button');
  fab.id = 'ffc-fab';
  fab.textContent = 'FFC';
  document.body.appendChild(fab);

  // Panel
  const panel = document.createElement('div');
  panel.id = 'ffc-panel';
  panel.innerHTML = `
    <div id="ffc-panel-header">
      <span id="ffc-panel-title">💸 Budget Check</span>
      <button id="ffc-close">✕</button>
    </div>
    <div id="ffc-body">
      <button id="ffc-scan-btn">Scan Cart</button>
      <div id="ffc-display"></div>
    </div>
  `;
  document.body.appendChild(panel);

  // ── Event Handlers ────────────────────────────────────────────────────────────

  fab.addEventListener('click', () => {
    panel.classList.toggle('visible');
  });

  document.getElementById('ffc-close').addEventListener('click', () => {
    panel.classList.remove('visible');
  });

  document.getElementById('ffc-scan-btn').addEventListener('click', () => {
    const display = document.getElementById('ffc-display');
    display.innerHTML = '<div class="ffc-scanning">Scanning cart…</div>';

    chrome.storage.local.get(['budget', 'intensity'], (data) => {
      const budget    = parseFloat(data.budget) || 0;
      const intensity = data.intensity || 'normal';
      const result    = scrapeCurrentPage();

      if (!result || result.items.length === 0) {
        display.innerHTML = '<div class="ffc-muted">No items found. The cart may still be loading — try again in a moment.</div>';
        return;
      }

      const { label, items } = result;
      const total = items.reduce((sum, item) => sum + parsePrice(item.price), 0);
      const insult = budget > 0 ? generateInsult(total, budget, intensity) : null;

      let html = `<div class="ffc-site-label">${label} Cart</div>`;
      items.forEach(item => {
        const name = item.name.substring(0, 40);
        html += `
          <div class="ffc-cart-row">
            <span class="ffc-cart-name">${name}…</span>
            <span class="ffc-cart-price">${item.price}</span>
          </div>`;
      });

      html += `<div class="ffc-total">Cart Total: <strong>$${total.toFixed(2)}</strong></div>`;

      if (insult) {
        const pct = Math.round((total / budget) * 100);
        const barColor = pct >= 100 ? '#e53e3e' : pct >= 75 ? '#dd6b20' : pct >= 40 ? '#d69e2e' : '#38a169';
        html += `
          <div class="ffc-bar-wrap">
            <div class="ffc-bar-track">
              <div class="ffc-bar-fill" style="width:${Math.min(pct,100)}%;background:${barColor}"></div>
            </div>
            <div class="ffc-bar-label">${pct}% of $${budget.toFixed(0)} budget used</div>
          </div>
          <div class="ffc-insult">${insult}</div>`;
      } else {
        html += `<div class="ffc-muted" style="margin-top:6px;">Set a budget in the extension popup to get roasted.</div>`;
      }

      display.innerHTML = html;
    });
  });

  // Auto-open the panel when injected
  panel.classList.add('visible');
  // Auto-scan after a short delay to let the cart page finish rendering
  setTimeout(() => {
    document.getElementById('ffc-scan-btn').click();
  }, 1200);
}
