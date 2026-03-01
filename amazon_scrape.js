/**
 * Ask Gemini through your backend
 */
async function askGemini(prompt) {
  const response = await fetch("http://localhost:3000/ask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ prompt })
  });

  const data = await response.json();
  return data.reply;
}

/**
 * UI Helper: Refresh history list
 */
const updateHistoryUI = () => {
  chrome.storage.local.get({ history: [] }, (data) => {
    const list = document.getElementById("historyList");
    if (!list) return;

    list.innerHTML = data.history.length
      ? ""
      : '<p style="font-size:0.8em; color:#888;">No history yet.</p>';

    [...data.history]
      .reverse()
      .slice(0, 5)
      .forEach((item) => {
        const div = document.createElement("div");
        div.className = "history-item";
        div.innerHTML = `
          <span class="history-name">${item.name}</span>
          <span class="price-badge">${item.grandTotal}</span>
        `;
        list.appendChild(div);
      });
  });
};

/**
 * Scraper that runs inside Amazon page
 */
const amazonScraper = () => {
  const nameEl = document.querySelector(".lineitem-title-text");
  const itemName = nameEl ? nameEl.innerText.trim() : "Unknown Item";

  const values = Array.from(
    document.querySelectorAll(".order-summary-line-definition")
  );

  const prices = values.map((v) =>
    v.innerText.replace(/\s\s+/g, " ").trim()
  );

  if (prices.length > 0) {
    return {
      name: itemName,
      itemPrice: prices[0] || "N/A",
      shipping: prices[1] || "N/A",
      grandTotal: prices[prices.length - 1] || "N/A",
      allPrices: prices
    };
  }

  return null;
};

/**
 * Initialize popup
 */
document.addEventListener("DOMContentLoaded", async () => {
  updateHistoryUI();

  const display = document.getElementById("display");

  try {
    const reply = await askGemini(
      "Insult me for wasting money online."
    );

    display.innerHTML = `
      <div style="color:#B12704; font-weight:bold; text-align:center;">
        ${reply}
      </div>
    `;
  } catch (err) {
    display.innerHTML =
      '<p style="color:red;">Could not connect to backend.</p>';
    console.error(err);
  }
});

/**
 * Button click handler
 */
document
  .getElementById("clickMe")
  .addEventListener("click", async () => {
    const display = document.getElementById("display");
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        func: amazonScraper
      });

      const found = results.find((res) => res.result !== null);

      if (found && found.result) {
        const data = found.result;

        display.innerHTML = `
          <div style="font-size: 0.9em; line-height: 1.4;">
            <strong>${data.name.substring(0, 35)}...</strong>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 8px 0;">
            <div style="display: flex; justify-content: space-between;">
              <span>Item Price:</span> <span>${data.itemPrice}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Shipping:</span> <span>${data.shipping}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 5px; color: #B12704;">
              <span>Order Total:</span> <span>${data.grandTotal}</span>
            </div>
          </div>
        `;

        chrome.storage.local.get({ history: [] }, (res) => {
          const newHistory = res.history;
          newHistory.push(data);
          chrome.storage.local.set(
            { history: newHistory },
            updateHistoryUI
          );
        });

        // Ask Gemini about THIS purchase
        try {
          const insult = await askGemini(
            `I just spent ${data.grandTotal} on "${data.name}". Insult me aggressively but humorously.`
          );

          display.innerHTML += `
            <hr style="margin:10px 0;">
            <div style="color:#B12704; font-weight:bold;">
              ${insult}
            </div>
          `;
        } catch (err) {
          console.error("Gemini failed:", err);
        }
      } else {
        display.innerHTML =
          "Prices not found. Ensure the Order Summary is loaded.";
      }
    } catch (err) {
      display.innerHTML = "Error: " + err.message;
    }
  });