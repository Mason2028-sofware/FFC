const saveSettings = () => {
    const budget = document.getElementById('budget').value;
    const timeframe = document.getElementById('timeframe').value;
    const percentage = document.getElementById('percentage').value;
    const categories = Array.from(document.querySelectorAll('.category-group input:checked'))
        .map(cb => cb.value);
    const intensity = document.querySelector('input[name="intensity"]:checked')?.value || 'normal';

    const settings = {
        budget: parseFloat(budget) || 0,
        timeframe: parseInt(timeframe) || 1,
        percentage: parseFloat(percentage) || 10,
        categories: categories,
        intensity: intensity
    };

    chrome.storage.local.set({ userSettings: settings }, () => {
        const display = document.getElementById('display');
        display.innerText = "Settings Saved! Your wallet is now on lockdown.";
        display.style.color = "#2ecc71";
    });
};

const loadSettings = () => {
    chrome.storage.local.get(['userSettings'], (result) => {
        if (result.userSettings) {
            const s = result.userSettings;
            document.getElementById('budget').value = s.budget;
            document.getElementById('timeframe').value = s.timeframe;
            document.getElementById('percentage').value = s.percentage;

            s.categories.forEach(cat => {
                const cb = document.querySelector(`.category-group input[value="${cat}"]`);
                if (cb) cb.checked = true;
            });
            const rb = document.querySelector(`input[name="intensity"][value="${s.intensity}"]`);
            if (rb) rb.checked = true;
        }
    });
};

document.addEventListener('DOMContentLoaded', loadSettings);
document.getElementById('clickMe').addEventListener('click', saveSettings);