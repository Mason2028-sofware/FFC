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
  document.querySelectorAll('input').forEach(el => el.addEventListener('change', saveSettings));
});