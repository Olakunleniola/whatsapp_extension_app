let isVerificationRunning = false;

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
    searchBox.textContent = "";

    // 3. Clear any existing content
    document.execCommand("selectAll", false, null);
    document.execCommand("delete", false, null);

    // 4. Insert your number via execCommand

    document.execCommand("insertText", false, number);

    // 5. Dispatch a real input event (in case WhatsApp needs it)
    searchBox.dispatchEvent(new Event("input", { bubbles: true }));

    console.log(`✅ Pasted “${number}” into WhatsApp search box.`);

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
    console.log("received action ", message.type);
    if (message.operation === "verify") {
      isVerificationRunning = true;
      verifyNumbers(message.data, sendResponse);
      return true;
    } else {
      sendResponse({ status: "Bulk messaging not implemented yet." });
    }
  }

  if (message.type === "STOP_OPERATION") {
    isVerificationRunning = false;
    console.log("Operation stopped by user");
  }

  // Handle iframe toggle
  if (message.action === "toggle_iframe") {
    toggleIframe();
  }
});

function toggleIframe() {
  const existingIframe = document.getElementById("whatsapp-bulk-overlay");

  if (existingIframe) {
    // Close iframe
    existingIframe.remove();
  } else {
    // Open iframe
    const iframe = document.createElement("iframe");
    iframe.src = chrome.runtime.getURL("popup.html");
    iframe.id = "whatsapp-bulk-overlay";
    iframe.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 9999;
      border: none;
    `;

    document.body.appendChild(iframe);
  }
}

// Listen for messages from iframe
window.addEventListener("message", (event) => {
  if (event.data.type === "CLOSE_IFRAME") {
    const iframe = document.getElementById("whatsapp-bulk-overlay");
    if (iframe) iframe.remove();
  }
});

async function verifyNumbers(data, sendResponse) {
  const results = [];

  for (let i = 0; i < data.length; i++) {
    // Check if operation was stopped
    if (!isVerificationRunning) {
      console.log("Verification stopped by user");
      break;
    }

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
    // ✅ Send progress update to popup
    chrome.runtime.sendMessage({
      type: "STATUS_UPDATE",
      phone,
      status,
    });

    await delay(1000); // Short delay between verifications
  }

  // Send final status
  if (isVerificationRunning) {
    sendResponse({ status: "Verification complete", results });
  } else {
    sendResponse({ status: "Verification stopped by user", results });
  }
}
