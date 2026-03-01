import { SITE_CONFIGS } from './websites.js';
import { universalScraper } from './scraper.js';

// ── Insult Engine ──────────────────────────────────────────────────────────────
const INSULTS = {
  'very-strict': {
    safe: ["You didn't buy anything. Impressive restraint. Or you're just broke.", "Zero spend. Are you okay? That's not normal."],
    warning: ["Already at {pct}% of your budget? You have the willpower of a golden retriever in a butcher shop.", "{pct}% gone. Congrats, you're on pace to be broke."],
    danger: ["You're at {pct}% of your budget. Your future self hates you.", "{pct}%?! Your wallet filed for emotional damages."],
    over: ["You are {over} OVER budget. Absolutely unhinged behavior.", "Budget: defeated. You: chaos gremlin. Amount over: {over}."]
  },
  'strict': {
    safe: ["Under budget. Don't get used to it.", "You're safe... for now."],
    warning: ["At {pct}% of budget. Slow down, champ.", "You've burned {pct}%. Your savings account just winced."],
    danger: ["Yikes. {pct}% of budget gone. Maybe log off?", "At {pct}%, you're one 'add to cart' away from disaster."],
    over: ["Over budget by {over}. Bold strategy.", "I'm not mad, just disappointed."]
  },
  'normal': {
    safe: ["You're under budget! Responsible adulting achieved.", "Under budget. Treat yourself... to NOT spending more."],
    warning: ["At {pct}% of your budget. Keep an eye on it.", "Sitting at {pct}%. Not bad, not great."],
    danger: ["You're at {pct}% — getting a little spicy in here.", "Oof, {pct}%. Maybe put the card down?"],
    over: ["You went over by {over}. It happens.", "Budget busted by {over}. Time to re-evaluate life choices."]
  },
  'non-strict': {
    safe: ["Under budget! You're doing amazing sweetie.", "All good! Money is just points in a game anyway."],
    warning: ["At {pct}% — totally fine, you deserve nice things.", "{pct}% spent. Honestly not that bad."],
    danger: ["Okay so {pct}% is a lot but... YOLO?", "{pct}%! But you know what, money comes and goes."],
    over: ["Over by {over} but honestly? Treat yourself.", "Budget exceeded by {over}. At least you have good taste!"]
  }
};

// ── Helper Logic ──────────────────────────────────────────────────────────────

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
  return template.replace('{pct}', pct).replace('{over}', '$' + Math.abs(over).toFixed(2));
}

// ── Core Dashboard Logic ──────────────────────────────────────────────────────

const refreshPermanentBudget = () => {
  chrome.storage.local.get(['budget'], (data) => {
    const display = document.getElementById('permanent-budget-display');
    if (!display) return;

    const currentBalance = parseFloat(data.budget) || 0;
    display.innerText = `$${currentBalance.toFixed(2)}`;

    // Dynamic Color Coding
    if (currentBalance <= 0) {
      display.style.color = "#e53e3e"; // Red
    } else if (currentBalance < 50) {
      display.style.color = "#dd6b20"; // Orange
    } else {
      display.style.color = "#38a169"; // Green
    }
  });
};

const saveSettings = () => {
  const budget     = document.getElementById('budget').value;
  const timeframe  = document.getElementById('timeframe').value;
  const percentage = document.getElementById('percentage').value;
  const intensity  = document.querySelector('input[name="intensity"]:checked')?.value || 'normal';
  const categories = Array.from(document.querySelectorAll('.category-box input:checked')).map(el => el.value);
  
  chrome.storage.local.set({ budget, timeframe, percentage, intensity, categories }, () => {
    refreshPermanentBudget(); // Update the big number immediately
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
    refreshPermanentBudget();
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

const updateHistoryUI = () => {
  chrome.storage.local.get({ history: [] }, (data) => {
    const list = document.getElementById('historyList');
    if (!list) return;
    list.innerHTML = data.history.length
      ? '<div style="font-size:0.75em;font-weight:bold;color:#888;margin:12px 0 4px;text-align:center;">RECENT PURCHASES</div>'
      : '<p style="font-size:0.8em; color:#888; text-align:center;">No purchase history yet.</p>';

    [...data.history].reverse().slice(0, 3).forEach(item => {
      const div = document.createElement('div');
      div.className = 'history-item';
      div.style = "display:flex; justify-content:space-between; font-size:0.8em; padding:4px 0; border-bottom:1px solid #eee;";
      div.innerHTML = `<span>${item.date || 'Order'}</span> <b>$${item.total.toFixed(2)}</b>`;
      list.appendChild(div);
    });
  });
};

// ── Init ───────────────────────────────────────────────────────────────────────

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
      const remainingIfBought = budget - total;
      const insult = generateInsult(total, budget, intensity);

      let html = `<div style="font-weight:bold; margin-bottom:10px; color:#4a5568;">${site} Cart Items:</div>`;
      
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