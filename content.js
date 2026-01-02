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
  // Try the new structure first: div containing span with data-icon="new-chat-outline"
  let btn = document
    .querySelector('span[data-icon="new-chat-outline"]')
    ?.closest("div");

  // Fallback to old selector
  if (!btn) {
    const selector = 'button[title="New chat"][aria-label="New chat"]';
    btn = document.querySelector(selector);
  }

  if (btn) {
    console.log(`✅ Found New Chat button`);
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
  // Try new structure first (for bulk SMS), then old structure (for verify)
  // New container: div with classes containing x1anedsm.x1280gxy (contains listitems)
  let resultsContainer = document.querySelectorAll(
    "div.x1n2onr6.x1n2onr6.xupqr0c.x78zum5.x1r8uery.x1iyjqo2.xdt5ytf.x6ikm8r.x1odjw0f.x1hc1fzr.x1anedsm.x1280gxy"
  );

  // Final fallback: old structure
  if (!resultsContainer.length) {
    resultsContainer = document.querySelectorAll(
      "div.x1n2onr6.x1n2onr6.xupqr0c.x78zum5.x1r8uery.x1iyjqo2.xdt5ytf.x6ikm8r.x1odjw0f.x1hc1fzr.x1tkvqr7.x150wa6m"
    );
  }

  if (resultsContainer.length) {
    console.log(`✅ Found results container`, resultsContainer);
  }

  if (!resultsContainer.length) {
    console.log("❌ Search results container not found with any selector");
    return null;
  }

  await delay(1000); // Initial wait for results to populate

  while (Date.now() - startTime < timeout) {
    console.log(
      `[${Date.now() - startTime}ms] Checking for results for '${number}'...`
    );

    // Check for network error
    const networkError = Array.from(resultsContainer).find((el) =>
      el.textContent.includes("Unable to connect to the internet")
    );
    if (networkError !== undefined) {
      console.log(
        `[${
          Date.now() - startTime
        }ms] Network error detected: ${networkError.textContent.trim()}`
      );

      const retryButton = resultsContainer[0].querySelector(
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
    const loadingIndicator = resultsContainer[0].querySelector(
      'span[data-visualcompletion="loading-state"]'
    );

    if (loadingIndicator) {
      const isVisible = loadingIndicator.checkVisibility();
      console.log(
        `[${Date.now() - startTime}ms] Loading indicator found: ${
          loadingIndicator.outerHTML
        }, Visible: ${isVisible}`,
        loadingIndicator
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
    const noResults = Array.from(resultsContainer).find((el) =>
      el.textContent.toLowerCase().includes("no results found")
    );
    if (noResults !== undefined) {
      console.log(
        `[${
          Date.now() - startTime
        }ms] No results element found: ${noResults.textContent.trim()}`
      );
      return null;
    }

    // Look for visible search results - try new structure first, then old structure
    // New structure: div[role="listitem"] containing span[dir="auto"][title]
    let resultElement = Array.from(
      resultsContainer[0].querySelectorAll("span[title]")
    ).find(
      (el) =>
        el.textContent.replace(/\D/g, "") ===
          "2348162958348".replace(/\D/g, "") || el.textContent
    );

    console.log(resultElement);

    if (resultElement !== undefined) {
      const text = resultElement.textContent.replace(/\s+/g, " ").trim();
      const title = resultElement.getAttribute("title") || "";
      console.log(
        `[${
          Date.now() - startTime
        }ms] Found visible result for '${number}': Text="${text}", Title="${title}"`
      );
      return resultElement;
    }

    await delay(interval);
  }

  console.log(
    `[${
      Date.now() - startTime
    }ms] Timeout waiting for results for '${number}' after ${timeout}ms`
  );
  return "timeout";
}

function isCorrectChatOpen(expectedQuery, expectedDisplayName = null) {
  try {
    // Handle empty or invalid input
    if (
      !expectedQuery ||
      typeof expectedQuery !== "string" ||
      expectedQuery.trim() === ""
    ) {
      console.log(
        "⚠️ Empty or invalid expected phone number or name, returning false"
      );
      return false;
    }

    const openedChatHeader = document.querySelector('header span[dir="auto"]');
    if (!openedChatHeader) {
      console.log("⚠️ Chat header not found");
      return false;
    }

    const text = openedChatHeader.textContent?.trim();
    console.log(`Checking header text: "${text}"`);

    // First, check if display name matches (most reliable for contacts with names)
    if (!/\d/.test(expectedQuery) && !/\d/.test(text)) {
      const displayName = expectedQuery.trim();
      const headerName = text.trim();

      // Exact match
      if (displayName.toLowerCase() === headerName.toLowerCase()) {
        console.log(
          `✅ Display name exact match: "${displayName}" === "${headerName}"`
        );
        return true;
      }

      // Contains match (for cases where header might have additional text)
      if (
        headerName.toLowerCase().includes(displayName.toLowerCase()) ||
        displayName.toLowerCase().includes(headerName.toLowerCase())
      ) {
        console.log(
          `✅ Display name contains match: "${displayName}" in "${headerName}"`
        );
        return true;
      }
    }

    // Then check phone number match
    const cleanExpected =
      expectedQuery.replace(/\D/g, "") || expectedQuery.trim();
    const cleanDisplayed = text.replace(/\D/g, "") || text.trim();

    // Phone number match logic
    if (cleanExpected && cleanDisplayed) {
      if (cleanExpected === cleanDisplayed) {
        console.log(`✅ Phone number exact match: ${cleanExpected}`);
        return true;
      } else if (
        cleanExpected.length >= cleanDisplayed.length &&
        cleanExpected.endsWith(cleanDisplayed)
      ) {
        console.log(
          `✅ Phone number partial match (ends with): ${cleanExpected} ends with ${cleanDisplayed}`
        );
        return true;
      } else if (
        cleanDisplayed.length >= cleanExpected.length &&
        cleanDisplayed.endsWith(cleanExpected)
      ) {
        console.log(
          `✅ Phone number partial match (contained in): ${cleanExpected} contained in ${cleanDisplayed}`
        );
        return true;
      }
    }

    console.log(
      `❌ No match found. Expected: "${expectedQuery}"${
        expectedQuery ? ` or "${expectedQuery}"` : ""
      }, Found: "${text}"`
    );
    return false;
  } catch (error) {
    console.error(`Error in isCorrectChatOpen: ${error.message}`);
    return false;
  }
}

async function clickWhatsAppChatItem(result) {
  console.log("🎯 Opening WhatsApp chat item");

  // Extract display name from result element (title attribute or textContent)
  // const displayName =
  //   result.getAttribute("title") || result.textContent?.trim() || null;

  // Use phone number for verification if provided, otherwise use result text
  const verificationText =
    result.textContent || result.getAttribute("title") || "";

  console.log(
    `🎯 Verification: phone="${verificationText}", displayName="${verificationText}"`
  );

  try {
    // Find the clickable element - new structure uses listitem with button inside
    let clickableElement = null;

    // Method 1: Find listitem, then the button inside it (new structure)
    const listItem = result.closest(
      'div[role="listitem"].x10l6tqk.xh8yej3.x1g42fcv'
    );
    if (listItem) {
      clickableElement = listItem.querySelector(
        'div[tabindex="-1"][role="button"]'
      );
      if (clickableElement) {
        console.log(`🎯 Found clickable button inside listitem`);
      }
    }

    // Method 2: If not found, try finding the row and then the button
    if (!clickableElement) {
      const row = result.closest('div[role="row"].x10l6tqk.xh8yej3.x1g42fcv');
      if (row) {
        clickableElement = row.querySelector(
          'div[tabindex="-1"][role="button"]'
        );
        if (clickableElement) {
          console.log(`🎯 Found clickable button inside row`);
        }
      }
    }

    // Method 3: Try finding gridcell with tabindex (older structure)
    if (!clickableElement) {
      clickableElement = result.closest('div[role="gridcell"][tabindex="0"]');
      if (clickableElement) {
        console.log(`🎯 Found gridcell with tabindex`);
      }
    }

    // Method 4: Try finding the button directly
    if (!clickableElement) {
      clickableElement = result.closest('div[tabindex="-1"][role="button"]');
      if (clickableElement) {
        console.log(`🎯 Found button directly`);
      }
    }

    // Fallback to other structures
    if (!clickableElement) {
      clickableElement =
        result.closest('div[role="listitem"].x10l6tqk.xh8yej3.x1g42fcv') ||
        result.closest('div[role="row"].x10l6tqk.xh8yej3.x1g42fcv') ||
        result.closest('div[role="button"]') ||
        result.closest('div[tabindex="-1"]') ||
        result.closest('div[data-testid="cell-frame-container"]') ||
        result;
    }

    // Verify the clickable element contains our result
    if (!clickableElement.contains(result)) {
      console.log(
        "⚠️ Warning: Clickable element may not contain the result element, searching for correct parent"
      );
      // Try to find a parent that contains the result
      const parentWithResult = result.closest(
        'div[role="listitem"], div[role="row"]'
      );
      if (parentWithResult) {
        const buttonInParent = parentWithResult.querySelector(
          'div[tabindex="-1"][role="button"]'
        );
        if (buttonInParent) {
          clickableElement = buttonInParent;
          console.log(
            "✅ Found correct button in parent element that contains result"
          );
        } else {
          // If no button found, use the parent itself
          clickableElement = parentWithResult;
          console.log("✅ Using parent element as clickable");
        }
      }
    }

    console.log(
      `🎯 Found clickable element: ${
        clickableElement.tagName
      }, role: ${clickableElement.getAttribute(
        "role"
      )}, tabindex: ${clickableElement.getAttribute(
        "tabindex"
      )}, contains result: ${clickableElement.contains(result)}`
    );

    // Scroll element into view
    clickableElement.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "center",
    });

    await delay(500);

    // Method 1: Try clicking the button element directly (new structure - most reliable)
    if (
      clickableElement.getAttribute("role") === "button" &&
      clickableElement.getAttribute("tabindex") === "-1"
    ) {
      console.log("🎯 Method 1: Clicking button with tabindex=-1 directly");

      // Try standard click first
      clickableElement.click();
      await delay(2000, 500);
      let chatOpened = isCorrectChatOpen(verificationText);
      if (chatOpened) {
        console.log("✅ Chat opened via button (standard click)");
        return true;
      }

      // Try mouse event
      console.log("🎯 Method 1b: Trying mouse event on button");
      const mouseEvent = new MouseEvent("click", {
        view: window,
        bubbles: true,
        cancelable: true,
        buttons: 1,
      });
      clickableElement.dispatchEvent(mouseEvent);
      await delay(2000, 500);
      chatOpened = isCorrectChatOpen(verificationText);
      if (chatOpened) {
        console.log("✅ Chat opened via button (mouse event)");
        return true;
      }

      // Try focus + Enter
      console.log("🎯 Method 1c: Trying focus + Enter on button");
      clickableElement.focus();
      await delay(200);
      const enterEvent = new KeyboardEvent("keydown", {
        key: "Enter",
        code: "Enter",
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true,
      });
      clickableElement.dispatchEvent(enterEvent);
      await delay(2000, 500);
      chatOpened = isCorrectChatOpen(verificationText);
      if (chatOpened) {
        console.log("✅ Chat opened via button (Enter key)");
        return true;
      }
    }

    // Method 1.5: Try clicking the listitem element directly
    const listItemElement = result.closest(
      'div[role="listitem"].x10l6tqk.xh8yej3.x1g42fcv'
    );
    if (listItemElement) {
      console.log("🎯 Method 1.5: Clicking listitem element directly");
      listItemElement.click();
      await delay(2000, 500);
      let chatOpened = isCorrectChatOpen(verificationText);
      if (chatOpened) {
        console.log("✅ Chat opened via listitem element");
        return true;
      }
    }

    // Method 1.6: Try clicking the row element directly (fallback)
    const rowElement = result.closest(
      'div[role="row"].x10l6tqk.xh8yej3.x1g42fcv'
    );
    if (rowElement) {
      console.log("🎯 Method 1.6: Clicking row element directly");
      rowElement.click();
      await delay(2000, 500);
      let chatOpened = isCorrectChatOpen(verificationText);
      if (chatOpened) {
        console.log("✅ Chat opened via row element");
        return true;
      }
    }

    // Method 1.7: Try clicking gridcell with tabindex (older structure)
    if (
      clickableElement.getAttribute("role") === "gridcell" &&
      clickableElement.getAttribute("tabindex") === "0"
    ) {
      console.log("🎯 Method 1.7: Clicking gridcell with tabindex directly");
      clickableElement.click();
      await delay(2000, 500);
      let chatOpened = isCorrectChatOpen(verificationText);
      if (chatOpened) {
        console.log("✅ Chat opened via gridcell");
        return true;
      }
    }

    // Method 2: Try clicking the inner content div
    const innerContentDiv = clickableElement.querySelector("div._ak72");
    if (innerContentDiv) {
      console.log("🎯 Method 2: Clicking inner content div");
      innerContentDiv.click();
      await delay(2000, 500);

      const chatOpened = isCorrectChatOpen(verificationText);
      if (chatOpened) {
        console.log("✅ Chat opened via inner content div");
        return true;
      }
    }

    // Method 3: Try clicking the div with tabindex="-1" inside gridcell
    const tabindexDiv = clickableElement.querySelector('div[tabindex="-1"]');
    if (tabindexDiv) {
      console.log("🎯 Method 3: Clicking div with tabindex=-1");
      tabindexDiv.click();
      await delay(2000, 500);

      const chatOpened = isCorrectChatOpen(verificationText);
      if (chatOpened) {
        console.log("✅ Chat opened via tabindex div");
        return true;
      }
    }

    // Method 4: Fallback to other child elements
    const fallbackSelectors = [
      "div._ak8n",
      "div._ak8l",
      'div[role="gridcell"]',
    ];

    for (const selector of fallbackSelectors) {
      const element = clickableElement.querySelector(selector);
      if (element) {
        console.log(`🎯 Method 4: Trying fallback selector: ${selector}`);
        element.click();
        await delay(2000, 500);

        const chatOpened = isCorrectChatOpen(verificationText);
        if (chatOpened) {
          console.log(`✅ Chat opened via ${selector}`);
          return true;
        }
      }
    }

    // Method 5: Last resort - click the clickableElement itself with mouse event
    console.log(
      "🎯 Method 5: Trying to click element directly with mouse event"
    );
    const mouseEvent2 = new MouseEvent("click", {
      view: window,
      bubbles: true,
      cancelable: true,
      buttons: 1,
    });
    clickableElement.dispatchEvent(mouseEvent2);
    await delay(2000, 500);

    const chatOpened = isCorrectChatOpen(verificationText);
    if (chatOpened) {
      console.log("✅ Chat opened via direct mouse event");
      return true;
    }

    console.log("❌ All click methods failed");
    return false;
  } catch (error) {
    console.error("❌ Error in clickWhatsAppChatItem:", error);
    return false;
  }
}

function normalizeMessage(msg, format = true) {
  // Normalize CRLF and fix excessive newlines
  let message = msg.replace(/\r\n/g, "\n"); // Normalize CRLF to LF
  if (format) {
    message = message
      .replace(/\n{4,}/g, "<<DOUBLE>>") // Mark 4 or more newlines
      .replace(/\n{2,}/g, "\n") // Replace double newlines with single
      .replace(/<<DOUBLE>>/g, "\n\n"); // Restore double newlines
    return message;
  }
  return message;
}

async function insertMultilineMessage(inputBox, message) {
  inputBox.focus();
  console.log(JSON.stringify(message));
  cleaned = normalizeMessage(message, false);
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

      if (result === "timeout" || result === null) {
        status = "❌ Result not found... Timeout";
        results.push({ phone, message, status });
        chrome.runtime.sendMessage({
          type: "STATUS_UPDATE",
          phone,
          message,
          status,
        });
        continue;
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
        ".x9f619.x12lumcd.x1qrby5j.xeuugli.x6prxxf.x1fcty0u.x1fc57z9.xk7ee7b.x1716072.x1ygal6x.x89wmna.x1rbbhm9.x13fuv20.x18b5jzi.x1q0q8m5.x1t7ytsu.x178xt8z.x1lun4ml.xso031l.xpilrb4.x1a2a7pz.x13w7htt.x78zum5.x123j3cw.x1gabggj.xs9asl8.xaso8d8.x1diwwjn.xbmvrgn.xod5an3.x1wiwyrm.xt7dq6l.x17m9png.x91sizk.x1vva9xg.x1jfkl46.x6s0dn4.xkfubxc.x1p0mfcu"
      );
      const messageDiv = chatInterface?.querySelector(
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

      // Try multiple selectors for send button (WhatsApp updates these frequently)
      let sendBtn = chatInterface.querySelector('button[aria-label="Send"]');

      // Fallback: find by data-icon
      if (!sendBtn) {
        const sendIcon = document.querySelector(
          'span[data-icon="wds-ic-send-filled"]'
        );
        if (sendIcon) {
          sendBtn =
            sendIcon.closest('button[aria-label="Send"]') ||
            sendIcon.closest('button[type="button"]');
        }
      }

      // Fallback: find button with Send aria-label anywhere
      if (!sendBtn) {
        sendBtn = document.querySelector('button[aria-label="Send"]');
      }

      let messageSent = false;

      if (sendBtn) {
        const isDisabled =
          sendBtn.getAttribute("aria-disabled") === "true" ||
          sendBtn.disabled ||
          sendBtn.hasAttribute("disabled");

        if (!isDisabled) {
          sendBtn.scrollIntoView({ behavior: "smooth", block: "center" });
          await delay(200);
          sendBtn.click();
          console.log("✅ Send button clicked");
          status = "✅ Sent";
          messageSent = true;
          await delay(1000); // Wait to confirm send
        } else {
          console.log("⚠️ Send button is disabled, trying Enter key...");
        }
      }

      // Fallback: try Enter key if button not found or disabled
      if (!messageSent) {
        console.log(
          "🔄 Send button not found or disabled, trying Enter key..."
        );
        inputBox.focus();
        await delay(200);
        inputBox.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "Enter",
            code: "Enter",
            keyCode: 13,
            bubbles: true,
            cancelable: true,
          })
        );
        inputBox.dispatchEvent(
          new KeyboardEvent("keyup", {
            key: "Enter",
            code: "Enter",
            keyCode: 13,
            bubbles: true,
            cancelable: true,
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
