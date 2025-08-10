let isVerificationRunning = false;

// Enhanced delay function with random variance
async function delay(ms, variance = 200) {
  const randomDelay = ms + Math.random() * variance;
  return new Promise((res) => setTimeout(res, randomDelay));
}

// Improved new chat button clicking
async function clickNewChatButton() {
  console.log("🔍 Looking for New Chat button...");

  // Multiple selectors for New Chat button (WhatsApp updates these frequently)
  const selectors = [
    'button[title="New chat"]',
    '[data-testid="new-chat-button"]',
    'div[title="New chat"]',
    'span[data-icon="new-chat"]',
    'button[aria-label="New chat"]',
    // Fallback: look for the plus icon
    'div[data-testid="new-chat"] button',
    'header button[title*="New"]',
  ];

  for (const selector of selectors) {
    const btn = document.querySelector(selector);
    if (btn) {
      console.log(`✅ Found New Chat button with selector: ${selector}`);
      btn.scrollIntoView({ behavior: "smooth", block: "center" });
      await delay(300);
      btn.click();
      await delay(800); // Wait longer for search box to appear
      return true;
    }
  }

  console.log("❌ New Chat button not found");
  return false;
}

// Much improved number entering function
async function enterNumberInSearchBox(number) {
  console.log(`🔍 Entering number: ${number}`);

  // Wait a bit more for search box to appear
  await delay(500);

  // Multiple selectors for search box
  const searchSelectors = [
    'div[contenteditable="true"][data-testid="chat-list-search"]',
    'div[role="textbox"][aria-label*="Search"]',
    'div[contenteditable="true"][title*="Search"]',
    'div[data-testid="search-input"]',
    'input[placeholder*="Search"]',
    // More generic fallbacks
    'div[contenteditable="true"]',
    'input[type="text"]',
  ];

  let searchBox = null;

  for (const selector of searchSelectors) {
    searchBox = document.querySelector(selector);
    if (searchBox) {
      console.log(`✅ Found search box with selector: ${selector}`);
      break;
    }
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

function isNumberFoundInResults(number) {
  // Look for the result div with the number
  // This selector may need to be updated if WhatsApp changes DOM
  const result = Array.from(document.querySelectorAll("span[title]")).find(
    (el) => el.textContent.replace(/\D/g, "") === number.replace(/\D/g, "")
  );

  if (result) {
    // Return the clickable parent (listitem) instead of just true/false
    return (
      result.closest('div[role="listitem"]') ||
      result.closest('div[tabindex="-1"]')
    );
  }

  return null;
}

function debugClickableElement(element) {
  console.log("Element info:", {
    tagName: element.tagName,
    role: element.getAttribute("role"),
    tabindex: element.getAttribute("tabindex"),
    classes: element.className,
    rect: element.getBoundingClientRect(),
    isVisible: element.offsetParent !== null,
    style: element.style.cssText,
  });

  // Check for event listeners
  console.log("Event listeners:", getEventListeners(element));
}

function isCorrectChatOpen(expectedPhone) {
  try {
    // Handle empty or invalid input
    if (
      !expectedPhone ||
      typeof expectedPhone !== "string" ||
      expectedPhone.trim() === ""
    ) {
      console.log("⚠️ Empty or invalid expected phone number, returning false");
      return {
        correct: false,
        displayedNumber: null,
        error: "Empty or invalid phone number",
      };
    }

    const headerElements = document.querySelectorAll('header span[dir="auto"]');
    console.log(`Found ${headerElements.length} header elements`);

    // Clean the expected phone number
    const cleanExpected = expectedPhone.replace(/\D/g, "");
    if (!cleanExpected) {
      console.log("⚠️ Expected phone number contains no digits");
      return {
        correct: false,
        displayedNumber: null,
        error: "Invalid expected phone number",
      };
    }

    for (const element of headerElements) {
      const text = element.textContent?.trim();
      console.log(`Checking header text: "${text}"`);

      // Skip if text is empty or doesn't resemble a phone number
      if (!text || !/[\+\d\s\-\(\)]{5,}/.test(text)) {
        console.log(`Skipping text: "${text}" (invalid or not a phone number)`);
        continue;
      }

      // Clean the displayed number
      const cleanDisplayed = text.replace(/\D/g, "");
      if (!cleanDisplayed) {
        console.log(`Skipping text: "${text}" (no digits after cleaning)`);
        continue;
      }

      // Handle abbreviated numbers (e.g., "+23481...")
      const isAbbreviated = text.includes("...");
      console.log(
        `Comparing cleanExpected: "${cleanExpected}" with cleanDisplayed: "${cleanDisplayed}"${
          isAbbreviated ? " (abbreviated)" : ""
        }`
      );

      // Match logic
      if (cleanExpected === cleanDisplayed) {
        console.log(`Exact match found for ${cleanExpected}`);
        return { correct: true, displayedNumber: text };
      } else if (
        cleanExpected.length >= cleanDisplayed.length &&
        cleanExpected.endsWith(cleanDisplayed)
      ) {
        console.log(
          `Partial match found (cleanExpected ends with cleanDisplayed) for ${cleanExpected}`
        );
        return { correct: true, displayedNumber: text };
      } else if (
        cleanDisplayed.length >= cleanExpected.length &&
        cleanDisplayed.endsWith(cleanExpected)
      ) {
        console.log(
          `Partial match found (cleanDisplayed ends with cleanExpected) for ${cleanExpected}`
        );
        return { correct: true, displayedNumber: text };
      } else if (isAbbreviated && cleanExpected.startsWith(cleanDisplayed)) {
        console.log(
          `Abbreviated match found: ${cleanExpected} starts with ${cleanDisplayed}`
        );
        return { correct: true, displayedNumber: text };
      }
    }

    console.log(`No valid phone number match found for ${expectedPhone}`);
    return { correct: false, displayedNumber: null };
  } catch (error) {
    console.error(`Error in isCorrectChatOpen: ${error.message}`);
    return { correct: false, displayedNumber: null, error: error.message };
  }
}

async function quickVerifyChat(expectedPhone) {
  await delay(3000); // Wait for chat to load

  const verification = isCorrectChatOpen(expectedPhone);

  if (verification.correct) {
    console.log(`✅ Verified: ${verification.displayedNumber}`);
    return true;
  } else {
    console.log(`❌ Wrong chat opened for ${expectedPhone}`);
    return false;
  }
}

async function clickWhatsAppChatItem(resultElement, expectedPhone) {
  console.log("🎯 Opening WhatsApp chat item");

  try {
    // Scroll element into view
    resultElement.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "center",
    });

    await delay(300);

    // Method 1: Try clicking the inner content div first (most reliable)
    const innerContentDiv = resultElement.querySelector("div._ak72");
    if (innerContentDiv) {
      console.log("🎯 Clicking inner content div");
      innerContentDiv.click();

      await delay(1500); // Wait for chat to load

      // Verify chat opened
      const chatOpened = isCorrectChatOpen(expectedPhone);
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
      const element = resultElement.querySelector(selector);
      if (element) {
        console.log(`🎯 Trying fallback selector: ${selector}`);
        element.click();

        await delay(1500);

        const chatOpened = isCorrectChatOpen(expectedPhone);
        if (chatOpened) {
          console.log(`✅ Chat opened via ${selector}`);
          return true;
        }
      }
    }

    // Method 3: Final fallback - button element with enhanced events
    const buttonElement = resultElement.querySelector('div[role="button"]');
    if (buttonElement) {
      console.log("🎯 Using button element as final fallback");

      const rect = buttonElement.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Comprehensive click simulation
      const events = [
        new MouseEvent("mousedown", {
          bubbles: true,
          clientX: centerX,
          clientY: centerY,
          button: 0,
        }),
        new MouseEvent("mouseup", {
          bubbles: true,
          clientX: centerX,
          clientY: centerY,
          button: 0,
        }),
        new MouseEvent("click", {
          bubbles: true,
          clientX: centerX,
          clientY: centerY,
          button: 0,
        }),
      ];

      events.forEach((event) => buttonElement.dispatchEvent(event));

      await delay(1500);

      const chatOpened = isCorrectChatOpen(expectedPhone);
      if (chatOpened) {
        console.log("✅ Chat opened via button fallback");
        return true;
      }
    }

    console.log("❌ All click methods failed");
    return false;
  } catch (error) {
    console.error("❌ Error in clickWhatsAppChatItem:", error);
    return false;
  }
}

function normalizeMessage(msg, rm = false) {
  // Normalize CRLF and fix excessive newlines
  let message = msg.replace(/\r\n/g, "\n"); // Normalize CRLF to LF
  if (rm) {
    console.log(true);
    message = message
      .replace(/\n{4,}/g, "<<DOUBLE>>") // Mark 4 or more newlines
      .replace(/\n{2,}/g, "\n") // Replace double newlines with single
      .replace(/<<DOUBLE>>/g, "\n\n"); // Restore double newlines
  }
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
    console.log("received action ", message.type);
    if (message.operation === "verify") {
      isVerificationRunning = true;
      verifyNumbers(message.data, sendResponse);
      return true;
    } else if (message.operation === "bulk") {
      isVerificationRunning = true;
      sendBulkMessages(message.data, sendResponse);
      return true;
    } else {
      sendResponse({ status: "Unknown operation." });
    }
  }

  if (message.type === "STOP_OPERATION") {
    isVerificationRunning = false;
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
    if (!isVerificationRunning) {
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
  if (isVerificationRunning) {
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
    if (!isVerificationRunning) {
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
        continue;
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
        continue;
      }

      // Step 3: Check if number exists and get the result element
      console.log("Step 3: Checking if number exists...");
      const resultElement = isNumberFoundInResults(phone);

      if (!resultElement) {
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

      // Step 4: Click on the found result to open chat
      console.log("Step 4: Opening chat...");
      await delay(500);

      // Find the clickable parent element
      let clickableElement = resultElement;

      // Try to find a better clickable parent
      const clickableParent =
        resultElement.closest('div[role="button"]') ||
        resultElement.closest('div[role="listitem"]') ||
        resultElement.closest("div[tabindex]") ||
        resultElement.closest('div[data-testid="cell-frame-container"]');

      if (clickableParent) {
        clickableElement = clickableParent;
      }

      // Scroll into view and click
      clickableElement.scrollIntoView({ behavior: "smooth", block: "center" });
      await delay(500);

      // debugClickableElement(clickableElement)

      const chatOpened = await clickWhatsAppChatItem(resultElement, phone);
      // clickableElement.click();
      if (chatOpened)
        console.log("✅ Chat clicked, waiting for chat to load...");

      // Wait longer for chat to load completely
      await delay(3000, 500);

      // Step 5: Find and fill message input
      // Step 5 & 6: Find and fill message input (replace your existing code)
      console.log("Step 5: Finding message input...");

      const inputSelectors = [
        'div[aria-label="Type a message"][data-lexical-editor="true"]',
        'div[aria-label="Type a message"][contenteditable="true"]',
        'div[data-lexical-editor="true"]',
        'div[aria-label="Type a message"]',
      ];

      let inputBox = null;

      for (const selector of inputSelectors) {
        inputBox = document.querySelector(selector);
        if (inputBox) {
          console.log(`✅ Found input with selector: ${selector}`);
          break;
        }
      }

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

      // Step 6: Enter the message (Lexical editor approach)
      console.log("Step 6: Entering message...");

      // Clear existing content by targeting the paragraph inside
      const paragraph = inputBox.querySelector("p");
      if (paragraph) {
        paragraph.innerHTML = "<br>";
      }
      inputBox.focus();
      await delay(300);

      await insertMultilineMessage(inputBox, message);

      // Method 3: Dispatch input events for Lexical
      inputBox.dispatchEvent(new Event("beforeinput", { bubbles: true }));
      inputBox.dispatchEvent(new Event("input", { bubbles: true }));
      inputBox.dispatchEvent(new Event("textInput", { bubbles: true }));
      console.log(
        "✅ Message entered with line breaks, waiting before sending..."
      );
      await delay(3000, 200);
      // Step 7: Find and click send button
      console.log("Step 7: Finding send button...");

      const sendSelectors = [
        'button[aria-label="Send"]',
        'button[data-testid="compose-btn-send"]',
      ];

      let sendBtn = null;

      for (const selector of sendSelectors) {
        sendBtn = document.querySelector(selector);
        if (sendBtn) {
          console.log(`✅ Found send button with selector: ${selector}`);
          break;
        }
      }

      // Alternative: look for button near the input
      if (!sendBtn) {
        const inputParent =
          inputBox.closest('div[data-testid*="compose"]') ||
          inputBox.parentElement;
        if (inputParent) {
          sendBtn =
            inputParent.querySelector("button") ||
            inputParent.querySelector('span[role="button"]');
        }
      }

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
  if (isVerificationRunning) {
    sendResponse({ status: "Bulk messaging complete", results });
    chrome.runtime.sendMessage({ type: "OPERATION_COMPLETE" });
  } else {
    sendResponse({ status: "Bulk messaging stopped by user", results });
    chrome.runtime.sendMessage({ type: "OPERATION_STOPPED" });
  }

  console.log("🏁 Bulk messaging completed");
}

// ========================================
// DEBUGGING HELPER FUNCTIONS
// ========================================

// Add this function to help debug DOM issues
function debugWhatsAppDOM() {
  console.log("🔍 DEBUGGING WHATSAPP DOM STRUCTURE:");

  console.log("New Chat Buttons Found:");
  const newChatSelectors = [
    'button[title="New chat"]',
    '[data-testid="new-chat-button"]',
    'div[title="New chat"]',
    'span[data-icon="new-chat"]',
  ];

  newChatSelectors.forEach((selector) => {
    const elements = document.querySelectorAll(selector);
    console.log(`  ${selector}: ${elements.length} found`);
  });

  console.log("\nSearch Boxes Found:");
  const searchSelectors = [
    'div[contenteditable="true"][data-testid="chat-list-search"]',
    'div[role="textbox"][aria-label*="Search"]',
    'div[contenteditable="true"]',
  ];

  searchSelectors.forEach((selector) => {
    const elements = document.querySelectorAll(selector);
    console.log(`  ${selector}: ${elements.length} found`);
  });

  console.log("\nMessage Input Boxes Found:");
  const inputSelectors = [
    'div[data-testid="conversation-compose-box-input"]',
    'div[aria-label="Type a message"]',
    'div[contenteditable="true"][role="textbox"]',
  ];

  inputSelectors.forEach((selector) => {
    const elements = document.querySelectorAll(selector);
    console.log(`  ${selector}: ${elements.length} found`);
  });

  console.log("\nSend Buttons Found:");
  const sendSelectors = [
    'button[data-testid="compose-btn-send"]',
    'button[aria-label="Send"]',
    'span[data-testid="send"]',
  ];

  sendSelectors.forEach((selector) => {
    const elements = document.querySelectorAll(selector);
    console.log(`  ${selector}: ${elements.length} found`);
  });
}

// Call this in console if you need to debug: debugWhatsAppDOM()

// ========================================
// ADDITIONAL IMPROVEMENTS
// ========================================

// Add error recovery mechanism
async function recoverFromError() {
  console.log("🔄 Attempting error recovery...");

  // Try to close any open modals or dialogs
  const closeButtons = document.querySelectorAll(
    '[aria-label="Close"], [title="Close"], .close'
  );
  for (const btn of closeButtons) {
    btn.click();
    await delay(200);
  }

  // Press Escape key to close dialogs
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
  );
  await delay(500);

  // Try to navigate back to main chat list
  const backButtons = document.querySelectorAll(
    '[aria-label="Back"], [title="Back"]'
  );
  for (const btn of backButtons) {
    btn.click();
    await delay(200);
  }

  await delay(1000);
  console.log("✅ Error recovery complete");
}
