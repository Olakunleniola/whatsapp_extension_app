// DOM elements
const fileInput = document.getElementById("fileInput");
const startBtn = document.getElementById("startBtn");
const statusLog = document.getElementById("statusLog");
const operationSelect = document.getElementById("operation");
const headerSelectSection = document.getElementById("headerSelectSection");
const phoneHeaderSelect = document.getElementById("phoneHeaderSelect");
const messageHeaderSelect = document.getElementById("messageHeaderSelect");
const closeBtn = document.getElementById("close-overlay");

let parsedData = [];
let headers = [];
let selectedPhoneHeader = "";
let selectedMessageHeader = "";
let isOperationRunning = false;
let operationResults = [];

closeBtn?.addEventListener("click", () => {
  window.parent.postMessage({ type: "CLOSE_IFRAME" }, "*");
});

function logStatus(message) {
  const p = document.createElement("div");
  p.textContent = message;
  statusLog.appendChild(p);
  statusLog.scrollTop = statusLog.scrollHeight;
}

function resetUI() {
  // Clear file input
  fileInput.value = "";

  // Clear parsed data
  parsedData = [];
  headers = [];
  selectedPhoneHeader = "";
  selectedMessageHeader = "";
  operationResults = [];

  // Hide header selectors
  headerSelectSection.classList.add("hidden");

  // Clear status log
  statusLog.innerHTML = "";

  // Reset button text
  startBtn.textContent = "🚀 Start Operation";
  isOperationRunning = false;
}

function generateExcelFiles() {
  console.log("generateExcelFiles called, operationResults:", operationResults);

  if (operationResults.length === 0) {
    logStatus("❌ No results to export.");
    return;
  }

  // Create a map from phone to status
  const statusMap = {};
  for (const result of operationResults) {
    statusMap[result.phone] = result.status;
  }

  // Add Status column to each original row
  const dataWithStatus = parsedData.map((row) => {
    const phone = row[selectedPhoneHeader];
    return {
      ...row,
      Status: statusMap[phone] || "❌ Not on WhatsApp",
    };
  });

  // Separate verified and unverified numbers (with all original columns)
  const verifiedRows = dataWithStatus.filter(
    (row) => row.Status === "✅ Found on WhatsApp"
  );
  const unverifiedRows = dataWithStatus.filter(
    (row) => row.Status !== "✅ Found on WhatsApp"
  );

  // Create workbook for verified numbers
  if (verifiedRows.length > 0) {
    try {
      const verifiedWorkbook = XLSX.utils.book_new();
      const verifiedWorksheet = XLSX.utils.json_to_sheet(verifiedRows);
      XLSX.utils.book_append_sheet(
        verifiedWorkbook,
        verifiedWorksheet,
        "Verified Numbers"
      );

      // Generate verified numbers file using base64
      const verifiedBase64 = XLSX.write(verifiedWorkbook, {
        bookType: "xlsx",
        type: "base64",
      });

      // Convert base64 to blob
      const verifiedBlob = new Blob(
        [Uint8Array.from(atob(verifiedBase64), (c) => c.charCodeAt(0))],
        {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }
      );
      const verifiedUrl = URL.createObjectURL(verifiedBlob);

      // Create download link for verified numbers
      const verifiedLink = document.createElement("a");
      verifiedLink.href = verifiedUrl;
      verifiedLink.download = `verified_numbers_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;
      verifiedLink.textContent = `📥 Download Verified Numbers (${verifiedRows.length})`;
      verifiedLink.style.cssText = `
        display: block;
        margin: 10px 0;
        padding: 10px;
        background: #10b981;
        color: white;
        text-decoration: none;
        border-radius: 6px;
        text-align: center;
        font-weight: 500;
      `;
      statusLog.appendChild(verifiedLink);
      console.log("Verified link created");
    } catch (error) {
      console.error("Error creating verified file:", error);
      logStatus("❌ Error creating verified numbers file");
    }
  }

  // Create workbook for unverified numbers
  if (unverifiedRows.length > 0) {
    try {
      const unverifiedWorkbook = XLSX.utils.book_new();
      const unverifiedWorksheet = XLSX.utils.json_to_sheet(unverifiedRows);
      XLSX.utils.book_append_sheet(
        unverifiedWorkbook,
        unverifiedWorksheet,
        "Unverified Numbers"
      );

      // Generate unverified numbers file using base64
      const unverifiedBase64 = XLSX.write(unverifiedWorkbook, {
        bookType: "xlsx",
        type: "base64",
      });

      // Convert base64 to blob
      const unverifiedBlob = new Blob(
        [Uint8Array.from(atob(unverifiedBase64), (c) => c.charCodeAt(0))],
        {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }
      );
      const unverifiedUrl = URL.createObjectURL(unverifiedBlob);

      // Create download link for unverified numbers
      const unverifiedLink = document.createElement("a");
      unverifiedLink.href = unverifiedUrl;
      unverifiedLink.download = `unverified_numbers_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;
      unverifiedLink.textContent = `📥 Download Unverified Numbers (${unverifiedRows.length})`;
      unverifiedLink.style.cssText = `
        display: block;
        margin: 10px 0;
        padding: 10px;
        background: #ef4444;
        color: white;
        text-decoration: none;
        border-radius: 6px;
        text-align: center;
        font-weight: 500;
      `;
      statusLog.appendChild(unverifiedLink);
      console.log("Unverified link created");
    } catch (error) {
      console.error("Error creating unverified file:", error);
      logStatus("❌ Error creating unverified numbers file");
    }
  }

  logStatus(
    `✅ Generated ${verifiedRows.length} verified and ${unverifiedRows.length} unverified results.`
  );
}

const updateHeaderDropdownVisibility = () => {
  const operation = operationSelect.value;
  if (operation === "verify") {
    messageHeaderSelect.parentElement.classList.add("hidden");
  } else {
    messageHeaderSelect.parentElement.classList.remove("hidden");
  }
};

operationSelect.addEventListener("change", updateHeaderDropdownVisibility);

function populateHeaderDropdowns(headers) {
  phoneHeaderSelect.innerHTML = "";
  messageHeaderSelect.innerHTML = "";
  headers.forEach((h) => {
    const opt1 = document.createElement("option");
    opt1.value = h;
    opt1.textContent = h;
    phoneHeaderSelect.appendChild(opt1);
    const opt2 = document.createElement("option");
    opt2.value = h;
    opt2.textContent = h;
    messageHeaderSelect.appendChild(opt2);
  });
  updateHeaderDropdownVisibility();
}

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = async function (evt) {
    try {
      const data = new Uint8Array(evt.target.result);
      const workbook = await XLSX.read(data, { type: "array" });

      const firstSheet = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheet];
      parsedData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (parsedData.length === 0) {
        logStatus("❌ No data found in file.");
        headerSelectSection.classList.add("hidden");
        return;
      }

      headers = Object.keys(parsedData[0]);

      if (headers.length < 1) {
        logStatus("❌ File must have at least one column.");
        headerSelectSection.classList.add("hidden");
        return;
      }

      populateHeaderDropdowns(headers);
      headerSelectSection.classList.remove("hidden");
      logStatus(`✅ Loaded ${parsedData.length} rows. Select columns below.`);
    } catch (err) {
      console.error("File parsing error:", err);
      logStatus(`❌ Error reading file: ${err.message}`);
    }
  };

  reader.onerror = (err) => {
    logStatus("❌ Failed to read file.");
  };

  reader.readAsArrayBuffer(file); // <— key change
});

phoneHeaderSelect.addEventListener("change", (e) => {
  selectedPhoneHeader = e.target.value;
});

messageHeaderSelect.addEventListener("change", (e) => {
  selectedMessageHeader = e.target.value;
});

startBtn.addEventListener("click", (e) => {
  if (isOperationRunning) {
    // Stop operation
    isOperationRunning = false;
    startBtn.textContent = "🔄 Reset Operation";
    e.target.style.backgroundColor = "#3535c5";
    logStatus("⏹️ Operation stopped by user.");

    // Send stop message to content script
    chrome.tabs.query(
      { url: "*://web.whatsapp.com/*", active: true, currentWindow: true },
      (tabs) => {
        if (tabs.length) {
          chrome.tabs.sendMessage(tabs[0].id, { type: "STOP_OPERATION" });
        }
      }
    );
    return;
  }

  if (startBtn.textContent === "🔄 Reset Operation") {
    // Reset operation
    e.target.style.backgroundColor = "#0ea50e";
    resetUI();
    return;
  }

  // Start operation
  e.target.style.backgroundColor = "#e43e3e";
  if (!parsedData.length) {
    logStatus("❌ Please upload a file first.");
    return;
  }
  selectedPhoneHeader = phoneHeaderSelect.value;
  selectedMessageHeader = messageHeaderSelect.value;
  const operation = operationSelect.value;
  if (!selectedPhoneHeader) {
    logStatus("❌ Please select the phone number column.");
    return;
  }
  if (operation === "bulk" && !selectedMessageHeader) {
    logStatus("❌ Please select the message column.");
    return;
  }

  // Change button to stop mode
  isOperationRunning = true;
  startBtn.textContent = "❌ Stop Operation";

  logStatus(
    `🚀 Starting: ${
      operation === "bulk" ? "Bulk Messaging" : "Number Verification"
    }...`
  );

  // Prepare data for sending
  let sendData;
  if (operation === "verify") {
    sendData = parsedData.map((row) => ({ phone: row[selectedPhoneHeader] }));
  } else {
    sendData = parsedData.map((row) => ({
      phone: row[selectedPhoneHeader],
      message: row[selectedMessageHeader],
    }));
  }

  chrome.tabs.query(
    { url: "*://web.whatsapp.com/*", active: true, currentWindow: true },
    (tabs) => {
      if (!tabs.length) {
        logStatus("❌ WhatsApp Web tab not found or not active.");
        isOperationRunning = false;
        startBtn.textContent = "🚀 Start Operation";
        return;
      }
      chrome.tabs.sendMessage(
        tabs[0].id,
        { type: "START_OPERATION", operation, data: sendData },
        (response) => {
          if (chrome.runtime.lastError) {
            logStatus("❌ Could not communicate with WhatsApp Web.");
            isOperationRunning = false;
            startBtn.textContent = "🚀 Start Operation";
          } else if (response && response.status) {
            logStatus(`ℹ️ ${response.status}`);
          }
        }
      );
    }
  );
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message:", message);

  if (message.type === "STATUS_UPDATE") {
    logStatus(`${message.phone}: ${message.status}`);
    // Store result for Excel generation
    operationResults.push({
      phone: message.phone,
      status: message.status,
    });
    console.log("Added result, total results:", operationResults.length);
  }

  if (message.type === "OPERATION_COMPLETE") {
    console.log("Operation complete, results:", operationResults);
    isOperationRunning = false;
    startBtn.textContent = "🔄 Reset Operation";
    logStatus("✅ Operation completed! Generating Excel files...");
    generateExcelFiles();
  }

  if (message.type === "OPERATION_STOPPED") {
    console.log("Operation stopped, results:", operationResults);
    isOperationRunning = false;
    startBtn.textContent = "🔄 Reset Operation";
    logStatus(
      "⏹️ Operation stopped. Generating Excel files for completed results..."
    );
    generateExcelFiles();
  }
});
