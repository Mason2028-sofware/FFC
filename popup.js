import { SITE_CONFIGS } from './websites.js';
import { universalScraper } from './scraper.js';

// ── Insult Engine ──────────────────────────────────────────────────────────────

async function askGemini(payload) {
  try {
    const response = await fetch("http://localhost:3000/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("Backend error");
    }

    const data = await response.json();
    return data.reply;

  } catch (err) {
    console.error("Gemini error:", err);
    return "The shame engine is offline. Consider that a blessing.";
  }
}



// ── Settings Persistence ───────────────────────────────────────────────────────

const saveSettings = () => {
  const budget     = document.getElementById('budget').value;
  const timeframe  = document.getElementById('timeframe').value;
  const percentage = document.getElementById('percentage').value;
  const intensity  = document.querySelector('input[name="intensity"]:checked')?.value || 'normal';
  const categories = Array.from(document.querySelectorAll('.category-box input:checked')).map(el => el.value);
  chrome.storage.local.set({ budget, timeframe, percentage, intensity, categories });
};

const loadSettings = () => {
  chrome.storage.local.get(['budget','timeframe','percentage','intensity','categories'], (data) => {
    if (data.budget)     document.getElementById('budget').value     = data.budget;
    if (data.timeframe)  document.getElementById('timeframe').value  = data.timeframe;
    if (data.percentage) document.getElementById('percentage').value = data.percentage;
    if (data.intensity) {
      const radio = document.querySelector(`input[name="intensity"][value="${data.intensity}"]`);
      if (radio) radio.checked = true;
    }
    if (data.categories) {
      data.categories.forEach(val => {
        const cb = document.querySelector(`.category-box input[value="${val}"]`);
        if (cb) cb.checked = true;
      });
    }
  });
};

// ── Collapsible Settings ───────────────────────────────────────────────────────

const initSettingsPanel = () => {
  const toggle  = document.getElementById('settingsToggle');
  const content = document.getElementById('settingsContent');
  const chevron = document.getElementById('settingsChevron');

  // Open on first run (no saved settings), collapsed otherwise
  chrome.storage.local.get(['hasVisited'], (data) => {
    const isFirstRun = !data.hasVisited;
    if (isFirstRun) {
      content.classList.add('open');
      chevron.textContent = '▲';
      chrome.storage.local.set({ hasVisited: true });
    } else {
      content.classList.remove('open');
      chevron.textContent = '▼';
    }
  });

  toggle.addEventListener('click', () => {
    const isOpen = content.classList.toggle('open');
    chevron.textContent = isOpen ? '▲' : '▼';
  });
};

// ── Init ───────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  initSettingsPanel();
  document.querySelectorAll('input').forEach(el => el.addEventListener('change', saveSettings));
});

// ── Main Scan Handler ──────────────────────────────────────────────────────────

document.getElementById('clickMe').addEventListener('click', async () => {
  const display = document.getElementById('display');
  saveSettings();

  const budget    = parseFloat(document.getElementById('budget').value) || 0;
  const intensity = document.querySelector('input[name="intensity"]:checked')?.value || 'normal';

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  display.innerHTML = '<div class="scanning">Scanning cart...</div>';

  function parsePrice(str) {
  if (!str) return 0;
  const match = str.replace(/,/g, '').match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: universalScraper,
      args: [SITE_CONFIGS]
    });

    const found = results.find(res => res.result && res.result.success);

    if (found) {
      const { items, site } = found.result;
      const total = items.reduce((sum, item) => sum + parsePrice(item.price), 0);
      //const insult = budget > 0 ? generateInsult(total, budget, intensity) : null;

      let insult = null;

    if (budget > 0) {
      const pct = Math.round((total / budget) * 100);

      insult = await askGemini({
        total,
        budget,
        percentUsed: pct,
        intensity,
        site
      });
    }

      let html = `<div class="site-label">${site} Cart</div>`;
      items.forEach(item => {
        const name = item.name ? item.name.substring(0, 45) : 'Item';
        html += `
          <div class="cart-row">
            <span class="cart-name">${name}&hellip;</span>
            <span class="cart-price">${item.price}</span>
          </div>`;
      });

      html += `<div class="cart-total">Cart Total: <strong>$${total.toFixed(2)}</strong></div>`;

      if (insult) {
        const pct = Math.round((total / budget) * 100);
        const barColor = pct >= 100 ? '#e53e3e' : pct >= 75 ? '#dd6b20' : pct >= 40 ? '#d69e2e' : '#38a169';
        html += `
          <div class="budget-bar-wrap">
            <div class="budget-bar-track">
              <div class="budget-bar-fill" style="width:${Math.min(pct,100)}%;background:${barColor}"></div>
            </div>
            <div class="budget-bar-label">${pct}% of $${budget.toFixed(0)} budget used</div>
          </div>
          <div class="insult-box">${insult}</div>`;
      }

      display.innerHTML = html;

    } else {
      display.innerHTML = "<div style='color:#888;font-size:0.85em;padding:8px 0;'>No cart items found. Make sure you're on a supported cart page.</div>";
    }
  } catch (e) {
    display.innerHTML = `<div style='color:red;font-size:0.85em;'>Error: ${e.message}</div>`;
  }
});
