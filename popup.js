// popup.js — settings only, no scanning or insults

const saveSettings = () => {
  const budget     = document.getElementById('budget').value;
  const timeframe  = document.getElementById('timeframe').value;
  const percentage = document.getElementById('percentage').value;
  const intensity  = document.querySelector('input[name="intensity"]:checked')?.value || 'normal';
  const categories = Array.from(document.querySelectorAll('.category-box input:checked')).map(el => el.value);

  chrome.storage.local.set({ budget, timeframe, percentage, intensity, categories }, () => {
    const indicator = document.getElementById('save-indicator');
    indicator.classList.add('visible');
    setTimeout(() => indicator.classList.remove('visible'), 1500);
  });
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

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  initSettingsPanel();
  
  // Listen for manual budget changes
  document.querySelectorAll('input').forEach(el => {
    el.addEventListener('input', saveSettings);
  });
});

// ── Main Scan Handler ──────────────────────────────────────────────────────────

document.getElementById('clickMe').addEventListener('click', async () => {
  const display = document.getElementById('display');
  const budget = parseFloat(document.getElementById('budget').value) || 0;
  const intensity = document.querySelector('input[name="intensity"]:checked')?.value || 'normal';

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  display.innerHTML = '<div style="text-align:center; padding:10px;">Scrutinizing your choices...</div>';

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
      const remainingIfBought = budget - total;

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
        html += `
          <div style="display:flex; justify-content:space-between; font-size:0.85em; margin-bottom:3px;">
            <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:180px;">${item.name}</span>
            <span>${item.price}</span>
          </div>`;
      });

      html += `<div style="margin-top:10px; padding-top:10px; border-top:2px solid #edf2f7; font-weight:bold;">Cart Total: $${total.toFixed(2)}</div>`;

      // ── The Projection ──
      const projColor = remainingIfBought <= 0 ? '#e53e3e' : '#2d3748';
      html += `
        <div style="margin-top:15px; padding:10px; background:#f7fafc; border-radius:6px; border:1px solid #e2e8f0;">
          <div style="font-size:0.75em; color:#718096;">Budget remaining if you buy this:</div>
          <div style="font-size:1.3em; font-weight:bold; color:${projColor};">$${remainingIfBought.toFixed(2)}</div>
        </div>`;

      display.innerHTML = html;

    } else {
      display.innerHTML = "<div style='text-align:center; color:#a0aec0; padding:20px 0;'>No items found. Go to a cart!</div>";
    }
  } catch (e) {
    display.innerHTML = `<div style='color:#e53e3e; font-size:0.8em;'>Error: ${e.message}</div>`;
  }
});