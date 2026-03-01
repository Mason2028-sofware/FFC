import { SITE_CONFIGS } from './websites.js';
import { universalScraper } from './scraper.js';

// ── Insult Engine ──────────────────────────────────────────────────────────────

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
  return template
    .replace('{pct}', pct)
    .replace('{over}', '$' + over.toFixed(2));
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
      const insult = budget > 0 ? generateInsult(total, budget, intensity) : null;

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
