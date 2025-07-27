// Track iframe state per tab
const iframeStates = new Map();

chrome.runtime.onInstalled.addListener(async () => {
  const manifest = chrome.runtime.getManifest();
  for (const cs of manifest.content_scripts) {
    for (const tab of await chrome.tabs.query({ url: cs.matches })) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: cs.js,
      });
    }
  }
});

// Single click handler for extension icon
chrome.action.onClicked.addListener(async (tab) => {
  // Check if this is a WhatsApp Web tab
  if (!tab.url || !tab.url.includes("web.whatsapp.com")) {
    // Open WhatsApp Web if not already on it
    const whatsappURL = "https://web.whatsapp.com/";
    chrome.tabs.query({}, function (tabs) {
      const existing = tabs.find(
        (t) => t.url && t.url.includes("web.whatsapp.com")
      );
      if (existing) {
        chrome.tabs.update(existing.id, { active: true });
        // Toggle iframe on existing tab
        toggleIframe(existing.id);
      } else {
        // Create new tab and wait for it to load
        chrome.tabs.create({ url: whatsappURL }, (newTab) => {
          // Wait for the page to load before trying to toggle iframe
          chrome.tabs.onUpdated.addListener(function listener(
            tabId,
            changeInfo
          ) {
            if (tabId === newTab.id && changeInfo.status === "complete") {
              chrome.tabs.onUpdated.removeListener(listener);
              // Small delay to ensure content script is ready
              setTimeout(() => toggleIframe(newTab.id), 500);
            }
          });
        });
      }
    });
    return;
  }

  // Toggle iframe on current WhatsApp Web tab
  toggleIframe(tab.id);
});

function toggleIframe(tabId) {
  // Simply send toggle message to content script
  chrome.tabs.sendMessage(tabId, { action: "toggle_iframe" });
}

// Listen for iframe close events from content script
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === "iframe_closed" && sender.tab) {
    iframeStates.set(sender.tab.id, false);
  }
});

// Clean up state when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  iframeStates.delete(tabId);
});
