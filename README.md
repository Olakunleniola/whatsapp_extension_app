# WhatsApp Bulk Messenger & Verifier Extension

## Features

- **Bulk Message Sending**: Send messages to multiple WhatsApp numbers
- **Number Verification**: Verify if phone numbers are registered on WhatsApp
- **Excel/CSV Support**: Upload files with phone numbers and messages
- **Iframe Toggle**: Open/close the extension interface with the extension icon

## How to Use

### Iframe Toggle Functionality

1. **Opening the Interface**: 
   - Click the extension icon while on WhatsApp Web
   - The interface will appear as a full-screen overlay
   - If WhatsApp Web is not open, it will open automatically

2. **Closing the Interface**:
   - Click the "✕ Close" button in the top-right corner
   - Or click the extension icon again to toggle it off

3. **State Persistence**:
   - When you close and reopen the interface, your previous data will be restored
   - This includes uploaded files, selected columns, and operation type

### File Upload

1. Select your operation type (Bulk Messaging or Number Verification)
2. Upload a CSV or Excel file with your data
3. Select the appropriate columns for phone numbers and messages
4. Click "Start Operation"

### Supported File Formats

- CSV files (.csv)
- Excel files (.xlsx, .xls)

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the extension folder

## Technical Details

- **Manifest Version**: 3
- **Content Scripts**: Automatically injected on WhatsApp Web
- **State Management**: Persistent iframe state across toggle operations
- **Communication**: Uses Chrome messaging API for background/content script communication

## Troubleshooting

- Make sure you're on WhatsApp Web (https://web.whatsapp.com)
- Refresh the page if the extension doesn't respond
- Check the browser console for any error messages 