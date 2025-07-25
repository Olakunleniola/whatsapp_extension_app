// DOM elements
const fileInput = document.getElementById("fileInput");
const startBtn = document.getElementById("startBtn");
const statusLog = document.getElementById("statusLog");
const operationSelect = document.getElementById("operation");
const headerSelectSection = document.getElementById("headerSelectSection");
const phoneHeaderSelect = document.getElementById("phoneHeaderSelect");
const messageHeaderSelect = document.getElementById("messageHeaderSelect");

let parsedData = [];
let headers = [];
let selectedPhoneHeader = "";
let selectedMessageHeader = "";

function logStatus(message) {
  const p = document.createElement("div");
  p.textContent = message;
  statusLog.appendChild(p);
  statusLog.scrollTop = statusLog.scrollHeight;
}

const updateHeaderDropdownVisibility = () => {
  const operation = operationSelect.value;
  console.log(operation);
  if (operation === "verify") {
    console.log(messageHeaderSelect);
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
  reader.onload = function (evt) {
    const data = evt.target.result;
    let workbook;
    try {
      workbook = XLSX.read(data, { type: "binary" });
    } catch (err) {
      logStatus("❌ Error reading file.");
      return;
    }
    const firstSheet = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheet];
    parsedData = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    if (parsedData.length === 0) {
      logStatus("❌ No data found in file.");
      headerSelectSection.classList.add("hidden");
    } else {
      headers = Object.keys(parsedData[0]);
      if (headers.length < 2) {
        logStatus("❌ File must have at least two columns.");
        headerSelectSection.classList.add("hidden");
        return;
      }
      populateHeaderDropdowns(headers);
      headerSelectSection.classList.remove("hidden");
      logStatus(`✅ Loaded ${parsedData.length} rows. Select columns below.`);
    }
  };
  reader.readAsBinaryString(file);
});

phoneHeaderSelect.addEventListener("change", (e) => {
  selectedPhoneHeader = e.target.value;
});

messageHeaderSelect.addEventListener("change", (e) => {
  selectedMessageHeader = e.target.value;
});

startBtn.addEventListener("click", () => {
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
        return;
      }
      chrome.tabs.sendMessage(
        tabs[0].id,
        { type: "START_OPERATION", operation, data: sendData },
        (response) => {
          if (chrome.runtime.lastError) {
            logStatus("❌ Could not communicate with WhatsApp Web.");
          } else if (response && response.status) {
            logStatus(`ℹ️ ${response.status}`);
          }
        }
      );
    }
  );
});
