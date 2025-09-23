let isWhatappToolRunning = false;

// Enhanced delay function with random variance
async function delay(ms, variance = 200) {
  const randomDelay = ms + Math.random() * variance;
  return new Promise((res) => setTimeout(res, randomDelay));
}

// Improved new chat button clicking
async function clickNewChatButton() {
  console.log("🔍 Looking for New Chat button...");

  // Multiple selectors for New Chat button (WhatsApp updates these frequently)
  const selector = 'button[title="New chat"][aria-label="New chat"]';
  const btn = document.querySelector(selector);
  if (btn) {
    console.log(`✅ Found New Chat button with selector: ${selector}`);
    btn.scrollIntoView({ behavior: "smooth", block: "center" });
    await delay(300);
    btn.click();
    await delay(800); // Wait longer for search box to appear
    return true;
  }
  console.log("❌ New Chat button not found");
  return false;
}

// Much improved number entering function
async function enterNumberInSearchBox(number) {
  console.log(`🔍 Entering number: ${number}`);

  // Wait a bit more for search box to appear
  await delay(500);

  const selector = 'div[role="textbox"][aria-label*="Search"]';
  let searchBox = null;

  searchBox = document.querySelector(selector);
  if (searchBox) {
    console.log(`✅ Found search box with selector: ${selector}`);
  }

  if (!searchBox) {
    console.log("❌ Search box not found");
    return false;
  }

  // Focus and clear the search box
  searchBox.focus();
  await delay(200);

  // Clear existing content multiple ways
  if (searchBox.tagName === "INPUT") {
    searchBox.value = "";
    searchBox.dispatchEvent(new Event("input", { bubbles: true }));
  } else {
    // For contenteditable divs
    searchBox.innerHTML = "";
    searchBox.textContent = "";
  }

  await delay(300);

  // Enter the number using multiple methods for reliability
  try {
    // Method 1: Direct text content
    if (searchBox.tagName !== "INPUT") {
      searchBox.textContent = number;
    } else {
      searchBox.value = number;
    }

    // Method 2: execCommand as backup
    document.execCommand("selectAll", false, null);
    document.execCommand("insertText", false, number);

    // Method 3: Simulate typing
    for (let char of number) {
      searchBox.dispatchEvent(
        new KeyboardEvent("keydown", { key: char, bubbles: true })
      );
      searchBox.dispatchEvent(
        new KeyboardEvent("keypress", { key: char, bubbles: true })
      );
      if (searchBox.tagName === "INPUT") {
        searchBox.value += char;
      } else {
        searchBox.textContent += char;
      }
      searchBox.dispatchEvent(
        new KeyboardEvent("keyup", { key: char, bubbles: true })
      );
      await delay(50, 20); // Small delay between characters
    }

    // Trigger input events
    searchBox.dispatchEvent(
      new Event("input", { bubbles: true, cancelable: true })
    );
    searchBox.dispatchEvent(new Event("change", { bubbles: true }));
    searchBox.dispatchEvent(
      new KeyboardEvent("keyup", { key: "Enter", bubbles: true })
    );

    console.log(`✅ Entered "${number}" into search box`);

    // Wait longer for results to populate
    await delay(1500, 300);
    return true;
  } catch (error) {
    console.error("❌ Error entering number:", error);
    return false;
  }
}

async function isNumberFoundInResults(number, timeout = 20000) {
  const startTime = Date.now();
  const interval = 1000;
  const networkErrorInterval = 5000; // Longer interval for network errors

  // Target the search results container with fallback selectors
  resultsContainer = document.querySelector(
    "div.x1n2onr6.x1n2onr6.xupqr0c.x78zum5.x1r8uery.x1iyjqo2.xdt5ytf.x6ikm8r.x1odjw0f.x1hc1fzr.x1tkvqr7.x150wa6m"
  );
  if (resultsContainer) {
    console.log(`✅ Found results container`);
  }

  if (!resultsContainer) {
    console.log("❌ Search results container not found with any selector");
    return null;
  }

  await delay(1000); // Initial wait for results to populate

  while (Date.now() - startTime < timeout) {
    console.log(
      `[${Date.now() - startTime}ms] Checking for results for '${number}'...`
    );

    // Check for network error
    const networkError = resultsContainer.querySelector("div.x1c436fg");
    if (
      networkError &&
      networkError.textContent.includes("Unable to connect to the internet")
    ) {
      console.log(
        `[${
          Date.now() - startTime
        }ms] Network error detected: ${networkError.textContent.trim()}`
      );

      const retryButton = resultsContainer.querySelector(
        'button:where(:contains("Retry"), .xjb2p0i)'
      );
      if (retryButton && true) {
        console.log(`[${Date.now() - startTime}ms] Clicking Retry button`);
        retryButton.scrollIntoView({ behavior: "smooth", block: "center" });
        retryButton.click();
        await delay(1000);
      }
      console.log(
        `[${Date.now() - startTime}ms] Waiting for network recovery...`
      );
      await delay(networkErrorInterval);
      continue;
    }

    // Check for loading state
    const loadingIndicator = resultsContainer.querySelector(
      'span[data-visualcompletion="loading-state"]'
    );

    if (loadingIndicator) {
      const isVisible = isElementVisible(loadingIndicator) || true;
      console.log(
        `[${Date.now() - startTime}ms] Loading indicator found: ${
          loadingIndicator.outerHTML
        }, Visible: ${isVisible}`
      );
      if (isVisible) {
        console.log(
          `[${Date.now() - startTime}ms] Loading results for '${number}'...`
        );
        await delay(interval);
        continue;
      }
    }

    // Check for "No results found"
    const noResults = resultsContainer.querySelector("span._ao3e");
    if (noResults) {
      console.log(
        `[${
          Date.now() - startTime
        }ms] No results element found: ${noResults.textContent.trim()}, Visible: ${true}`
      );
      if (noResults.textContent.trim().includes("No results")) {
        console.log(
          `[${Date.now() - startTime}ms] No results found for '${number}'`
        );
        return null;
      }
    }

    // Look for visible search results
    const resultElements = Array.from(
      resultsContainer.querySelectorAll('div[role="button"] span')
    );

    if (resultElements.length > 0) {
      const result = resultElements[0];
      const text = result.textContent.replace(/\s+/g, " ").trim();
      const title = result.getAttribute("title") || "";
      console.log(
        `[${
          Date.now() - startTime
        }ms] Found visible result for '${number}': Text="${text}", Title="${title}"`
      );
      return result;
    }

    console.log(
      `[${Date.now() - startTime}ms] No visible result elements found`
    );
    await delay(interval);
  }

  console.log(
    `[${
      Date.now() - startTime
    }ms] Timeout waiting for results for '${number}' after ${timeout}ms`
  );
  return "timeout";
}

function isCorrectChatOpen(expectedPhone) {
  try {
    // Handle empty or invalid input
    if (
      !expectedPhone ||
      typeof expectedPhone !== "string" ||
      expectedPhone.trim() === ""
    ) {
      console.log(
        "⚠️ Empty or invalid expected phone number or name, returning false"
      );
      return false;
    }

    // Clean the expected phone number
    const cleanExpected =
      expectedPhone.replace(/\D/g, "") || expectedPhone.trim();

    const openedChatHeader = document.querySelector('header span[dir="auto"]');

    const text = openedChatHeader.textContent?.trim();
    console.log(`Checking header text: "${text}"`);
    const cleanDisplayed = text.replace(/\D/g, "") || text.trim();

    // Match logic
    if (cleanExpected === cleanDisplayed) {
      console.log(`Exact match found for ${cleanExpected}`);
      return true;
    } else if (
      cleanExpected.length >= cleanDisplayed.length &&
      cleanExpected.endsWith(cleanDisplayed)
    ) {
      console.log(
        `Partial match found (cleanExpected ends with cleanDisplayed) for ${cleanExpected}`
      );
      return true;
    } else if (
      cleanDisplayed.length >= cleanExpected.length &&
      cleanDisplayed.endsWith(cleanExpected)
    ) {
      console.log(
        `Partial match found (cleanDisplayed ends with cleanExpected) for ${cleanExpected}`
      );
      return true;
    } else if (isAbbreviated && cleanExpected.startsWith(cleanDisplayed)) {
      console.log(
        `Abbreviated match found: ${cleanExpected} starts with ${cleanDisplayed}`
      );
      return true;
    }

    console.log(`No valid phone number match found for ${expectedPhone}`);
    return false;
  } catch (error) {
    console.error(`Error in isCorrectChatOpen: ${error.message}`);
    return false;
  }
}

async function clickWhatsAppChatItem(result) {
  console.log("🎯 Opening WhatsApp chat item");
  const clickableParent =
    result.closest('div[role="button"]') ||
    result.closest('div[tabindex="-1"]') ||
    result.closest('div[data-testid="cell-frame-container"]') ||
    result;
  try {
    // Scroll element into view
    clickableParent.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "center",
    });

    await delay(300);

    // Method 1: Try clicking the inner content div first (most reliable)
    const innerContentDiv = clickableParent.querySelector("div._ak72");
    if (innerContentDiv) {
      console.log("🎯 Clicking inner content div");
      innerContentDiv.click();

      await delay(2000, 500); // Wait for chat to load

      // Verify chat opened
      const chatOpened = isCorrectChatOpen(result.textContent);
      if (chatOpened) {
        console.log("✅ Chat opened via inner content div");
        return true;
      }
    }

    // Method 2: Fallback to other child elements
    const fallbackSelectors = [
      "div._ak8n",
      "div._ak8l",
      '[role="gridcell"]',
      "span[title]",
    ];

    for (const selector of fallbackSelectors) {
      const element = clickableParent.querySelector(selector);
      if (element) {
        console.log(`🎯 Trying fallback selector: ${selector}`);
        element.click();

        await delay(1500);

        const chatOpened = isCorrectChatOpen(result.textContent);
        if (chatOpened) {
          console.log(`✅ Chat opened via ${selector}`);
          return true;
        }
      }
    }

    console.log("❌ All click methods failed");
    return false;
  } catch (error) {
    console.error("❌ Error in clickWhatsAppChatItem:", error);
    return false;
  }
}

function normalizeMessage(msg) {
  // Normalize CRLF and fix excessive newlines
  let message = msg.replace(/\r\n/g, "\n"); // Normalize CRLF to LF
  message = message
    .replace(/\n{4,}/g, "<<DOUBLE>>") // Mark 4 or more newlines
    .replace(/\n{2,}/g, "\n") // Replace double newlines with single
    .replace(/<<DOUBLE>>/g, "\n\n"); // Restore double newlines
  return message;
}

async function insertMultilineMessage(inputBox, message) {
  inputBox.focus();
  console.log(JSON.stringify(message));
  cleaned = normalizeMessage(message, true);
  const lines = cleaned.split("\n");

  for (let i = 0; i < lines.length; i++) {
    // Insert just the text for this line
    document.execCommand("insertText", false, lines[i]);

    // Between lines, simulate Shift+Enter to break
    if (i < lines.length - 1) {
      inputBox.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Enter",
          code: "Enter",
          keyCode: 13,
          which: 13,
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        })
      );
      await delay(80);
    }
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "START_OPERATION") {
    if (message.operation === "verify") {
      isWhatappToolRunning = true;
      verifyNumbers(message.data, sendResponse);
      return true;
    } else if (message.operation === "bulk") {
      isWhatappToolRunning = true;
      sendBulkMessages(message.data, sendResponse);
      return true;
    } else {
      sendResponse({ status: "Unknown operation." });
    }
  }

  if (message.type === "STOP_OPERATION") {
    isWhatappToolRunning = false;
    console.log("Operation stopped by user");
    chrome.runtime.sendMessage({ type: "OPERATION_STOPPED" });
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

// ========================================
// VERIFICATION FUNCTIONS
// ========================================

async function verifyNumbers(data, sendResponse) {
  console.log(`🚀 Starting verification for ${data.length} numbers`);
  const results = [];

  for (let i = 0; i < data.length; i++) {
    if (!isWhatappToolRunning) {
      console.log("Verification stopped by user");
      break;
    }

    const phone = data[i].phone;
    let status = "❌ Not on WhatsApp";

    console.log(`\n📱 Verifying ${i + 1}/${data.length}: ${phone}`);

    // Validate phone number format
    if (
      !phone ||
      typeof phone !== "string" ||
      !/^\+?234\d{7,}$/.test(phone.trim())
    ) {
      status = "❌ Invalid format";
      results.push({ phone, status });
      chrome.runtime.sendMessage({ type: "STATUS_UPDATE", phone, status });
      await delay(500);
      continue;
    }

    try {
      // Click new chat
      const newChatSuccess = await clickNewChatButton();
      if (!newChatSuccess) {
        status = "❌ UI Error";
        results.push({ phone, status });
        chrome.runtime.sendMessage({ type: "STATUS_UPDATE", phone, status });
        continue;
      }

      // Enter number
      const searchSuccess = await enterNumberInSearchBox(phone);
      if (!searchSuccess) {
        status = "❌ Search Error";
        results.push({ phone, status });
        chrome.runtime.sendMessage({ type: "STATUS_UPDATE", phone, status });
        continue;
      }

      // Check results
      const resultElement = isNumberFoundInResults(phone);
      if (resultElement) {
        status = "✅ Found on WhatsApp";
      }
    } catch (error) {
      console.error("❌ Verification error:", error);
      status = "❌ Error";
    }

    results.push({ phone, status });
    chrome.runtime.sendMessage({ type: "STATUS_UPDATE", phone, status });

    console.log(`📊 Result: ${phone} -> ${status}`);
    await delay(1000, 200);
  }

  // Send completion status
  if (isWhatappToolRunning) {
    sendResponse({ status: "Verification complete", results });
    chrome.runtime.sendMessage({ type: "OPERATION_COMPLETE" });
  } else {
    sendResponse({ status: "Verification stopped by user", results });
    chrome.runtime.sendMessage({ type: "OPERATION_STOPPED" });
  }

  console.log("🏁 Verification completed");
}

// ========================================
// BULK MESSAGING FUNCTIONS
// ========================================

async function sendBulkMessages(data, sendResponse) {
  console.log(`🚀 Starting bulk messaging for ${data.length} numbers`);
  const results = [];

  for (let i = 0; i < data.length; i++) {
    if (!isWhatappToolRunning) {
      console.log("Bulk messaging stopped by user");
      break;
    }

    const phone = data[i].phone;
    const message = data[i].message;
    let status = "❌ Failed";

    console.log(`\n📱 Processing ${i + 1}/${data.length}: ${phone}`);

    // Validate inputs
    if (!phone || !message || !message.trim()) {
      status = "❌ Invalid data";
      results.push({ phone, message, status });
      chrome.runtime.sendMessage({
        type: "STATUS_UPDATE",
        phone,
        message,
        status,
      });
      await delay(500);
      continue;
    }

    // Validate phone number format
    if (
      !phone ||
      typeof phone !== "string" ||
      !/^\+?234\d{7,}$/.test(phone.trim())
    ) {
      status = "❌ Invalid format";
      results.push({ phone, status });
      chrome.runtime.sendMessage({ type: "STATUS_UPDATE", phone, status });
      await delay(500);
      continue;
    }

    try {
      // Step 1: Click new chat button
      console.log("Step 1: Opening new chat...");
      const newChatSuccess = await clickNewChatButton();
      if (!newChatSuccess) {
        status = "❌ Could not open new chat";
        results.push({ phone, message, status });
        chrome.runtime.sendMessage({
          type: "STATUS_UPDATE",
          phone,
          message,
          status,
        });
        break;
      }

      // Step 2: Enter number in search
      console.log("Step 2: Entering number in search...");
      const searchSuccess = await enterNumberInSearchBox(phone);
      if (!searchSuccess) {
        status = "❌ Search failed";
        results.push({ phone, message, status });
        chrome.runtime.sendMessage({
          type: "STATUS_UPDATE",
          phone,
          message,
          status,
        });
        break;
      }

      // Step 3: Check for result
      console.log("Step 3: Checking for result...");
      const result = await isNumberFoundInResults(phone);

      if (!result) {
        status = "❌ Not on WhatsApp";
        results.push({ phone, message, status });
        chrome.runtime.sendMessage({
          type: "STATUS_UPDATE",
          phone,
          message,
          status,
        });
        continue;
      }

      if (result === "timeout") {
        status = "❌ Result not found... Timeout";
        results.push({ phone, message, status });
        chrome.runtime.sendMessage({
          type: "STATUS_UPDATE",
          phone,
          message,
          status,
        });
        break;
      }

      // Step 4: Click on the found result to open chat
      console.log("Step 4: Opening chat...");
      await delay(500);
      const chatOpened = await clickWhatsAppChatItem(result);
      if (!chatOpened) {
        status = "❌ Error Chat failed to open";
        results.push({ phone, message, status });
        chrome.runtime.sendMessage({
          type: "STATUS_UPDATE",
          phone,
          message,
          status,
        });
        break;
      }
      console.log("✅ Chat clicked, waiting for chat to load...");

      // Wait longer for chat to load completely
      await delay(3000, 500);

      // Step 5: Find and fill message input
      console.log("Step 5: Finding message input...");
      const chatInterface = document.querySelector(
        ".x9f619.x1n2onr6.xupqr0c.x5yr21d.x6ikm8r.x10wlt62.x17dzmu4.x1i1dayz.x2ipvbc.x1w8yi2h.xyyilfv.x1iyjqo2.xpilrb4.x1t7ytsu.x1m2ixmg"
      );
      const messageDiv = chatInterface.querySelector(
        "div.lexical-rich-text-input"
      );
      if (!messageDiv) {
        status = "❌ Message div not found";
        results.push({ phone, message, status });
        chrome.runtime.sendMessage({
          type: "STATUS_UPDATE",
          phone,
          message,
          status,
        });
        continue;
      }

      const inputBox = messageDiv.querySelector(
        `div[aria-placeholder="Type a message`
      );
      if (!inputBox) {
        status = "❌ Message input not found";
        console.log("❌ Could not find message input box");
        results.push({ phone, message, status });
        chrome.runtime.sendMessage({
          type: "STATUS_UPDATE",
          phone,
          message,
          status,
        });
        continue;
      }
      console.log("Message input Found");

      // Step 6: Enter the message (Lexical editor approach)
      console.log("Step 6: Entering message...");
      inputBox.focus();
      await delay(300);
      await insertMultilineMessage(inputBox, message);
      await delay(3000, 200);

      // Step 7: Find and click send button
      console.log("Step 7: Finding send button...");

      const sendBtn = chatInterface.querySelector('button[aria-label="Send"]');

      if (sendBtn) {
        sendBtn.click();
        console.log("✅ Send button clicked");
        status = "✅ Sent";
        await delay(1000); // Wait to confirm send
      } else {
        // Fallback: try Enter key
        console.log("🔄 Send button not found, trying Enter key...");
        inputBox.focus();
        inputBox.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "Enter",
            code: "Enter",
            keyCode: 13,
            bubbles: true,
          })
        );

        await delay(1000);
        status = "✅ Sent (Enter key)";
      }
    } catch (error) {
      console.error("❌ Error in bulk messaging:", error);
      status = "❌ Error: " + error.message;
    }

    results.push({ phone, message, status });
    chrome.runtime.sendMessage({
      type: "STATUS_UPDATE",
      phone,
      message,
      status,
    });

    console.log(`📊 Result: ${phone} -> ${status}`);

    // Longer delay between messages to avoid rate limiting
    await delay(2000, 500);
  }

  // Send completion status
  if (isWhatappToolRunning) {
    sendResponse({ status: "Bulk messaging complete", results });
    chrome.runtime.sendMessage({ type: "OPERATION_COMPLETE" });
  } else {
    sendResponse({ status: "Bulk messaging stopped by user", results });
    chrome.runtime.sendMessage({ type: "OPERATION_STOPPED" });
  }

  console.log("🏁 Bulk messaging completed");
}
