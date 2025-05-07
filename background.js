/**
 * Background Script for Browser Authenticator
 * Handles background tasks and manages extension state
 */

// Initialize default settings if not present
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Authenticator extension installed');
  
  try {
    const data = await chrome.storage.sync.get('settings');
    
    // If settings don't exist, create defaults
    if (!data.settings) {
      const defaultSettings = {
        codeLength: 6,
        refreshPeriod: 30,
        algorithm: 'SHA-1',
        autoBackup: false
      };
      
      await chrome.storage.sync.set({ settings: defaultSettings });
      console.log('Default authenticator settings initialized.');
    }
    
    // Check if accounts storage exists, initialize if needed
    const accountsData = await chrome.storage.sync.get('accounts');
    if (!accountsData.accounts) {
      await chrome.storage.sync.set({ accounts: {} });
      console.log('Accounts storage initialized.');
    }
    
  } catch (error) {
    console.error('Error initializing extension:', error);
  }
});

// Optional: Set up context menu for quick access
chrome.runtime.onInstalled.addListener(() => {
  if (chrome.contextMenus) {
    chrome.contextMenus.create({
      id: 'scan-qr-code',
      title: 'Scan QR Code for Authentication',
      contexts: ['page']
    });
  }
});

// Handle context menu clicks
chrome.contextMenus && chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'scan-qr-code') {
    chrome.tabs.create({ url: 'qr-scan.html' });
  }
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getAccounts') {
    // Return all accounts
    chrome.storage.sync.get('accounts', (data) => {
      sendResponse({ accounts: data.accounts || {} });
    });
    return true; // Keep the message channel open for async response
  }
  
  if (message.action === 'getSettings') {
    // Return settings
    chrome.storage.sync.get('settings', (data) => {
      sendResponse({ settings: data.settings });
    });
    return true;
  }
  
  if (message.action === 'logMessage') {
    // Log messages from other parts of the extension
    console.log('Extension log:', message.text);
    sendResponse({ success: true });
    return false;
  }
});

// Optional: Periodic backup functionality
async function performBackup() {
  try {
    const data = await chrome.storage.sync.get(['settings', 'accounts']);
    
    if (data.settings && data.settings.autoBackup) {
      // Create backup in local storage as failsafe
      const timestamp = new Date().toISOString();
      const backup = {
        accounts: data.accounts || {},
        settings: data.settings,
        timestamp
      };
      
      await chrome.storage.local.set({ lastBackup: backup });
      console.log('Automatic backup completed:', timestamp);
    }
  } catch (error) {
    console.error('Backup error:', error);
  }
}

// Run backup periodically (e.g., once a day)
setInterval(performBackup, 24 * 60 * 60 * 1000); // 24 hours

console.log('Background script running');
