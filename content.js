async function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function clickNewChatButton() {
  // Try to find and click the 'New chat' button
  const btn = document.querySelector('button[title="New chat"]');
  if (btn) {
    btn.click();
    await delay(500); // Wait for search box to appear
    return true;
  }
  return false;
}

async function enterNumberInSearchBox(number) {
  // Find the search input (contenteditable)
  const searchBox = document.querySelector(
    'div[role="textbox"][aria-label*="Search"]'
  );
  if (searchBox) {
    // Clear previous content
    searchBox.focus();
    document.execCommand("selectAll", false, null);
    document.execCommand("delete", false, null);
    // Paste/type the number
    searchBox.textContent = number;
    // Trigger input event
    searchBox.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await delay(1200); // Wait for search results to update
    return true;
  }
  return false;
}

function isNumberFoundInResults(number) {
  // Look for the result div with the number
  // This selector may need to be updated if WhatsApp changes DOM
  const result = Array.from(document.querySelectorAll("span[title]")).find(
    (el) => el.textContent.replace(/\D/g, "") === number.replace(/\D/g, "")
  );
  return !!result;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "START_OPERATION") {
    if (message.operation === "verify") {
      verifyNumbers(message.data, sendResponse);
      return true;
    } else {
      sendResponse({ status: "Bulk messaging not implemented yet." });
    }
  }
});

async function verifyNumbers(data, sendResponse) {
  const results = [];
  for (let i = 0; i < data.length; i++) {
    const phone = data[i].phone;
    let status = "❌ Not on WhatsApp";
    try {
      await clickNewChatButton();
      await delay(500);
      await enterNumberInSearchBox(phone);
      await delay(1200);
      if (isNumberFoundInResults(phone)) {
        status = "✅ Found on WhatsApp";
      }
    } catch (e) {
      status = "❌ Error";
    }
    results.push({ phone, status });
    await delay(1000); // Short delay between verifications
  }
  sendResponse({ status: "Verification complete", results });
}
