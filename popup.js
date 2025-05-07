/**
 * Main Application Logic for Browser Authenticator
 */

// Global variables
let selectedAccount = null;
let settings = {
  codeLength: 6,
  refreshPeriod: 30,
  algorithm: 'SHA-1',
  autoBackup: false
};

// Storage service
const storage = {
  saveAccount: function(name, secret) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get('accounts', (data) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        
        const accounts = data.accounts || {};
        accounts[name] = secret;
        chrome.storage.sync.set({ accounts }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
    });
  },
  
  getAccounts: function() {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get('accounts', (data) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(data.accounts || {});
        }
      });
    });
  },
  
  deleteAccount: function(name) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get('accounts', (data) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        
        const accounts = data.accounts || {};
        if (accounts[name]) {
          delete accounts[name];
          chrome.storage.sync.set({ accounts }, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          });
        } else {
          resolve();
        }
      });
    });
  },
  
  getSettings: function() {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get('settings', (data) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(data.settings || {
            codeLength: 6,
            refreshPeriod: 30,
            algorithm: 'SHA-1',
            autoBackup: false
          });
        }
      });
    });
  }
};

// Display a status message
function showStatus(message, duration = 3000) {
  const statusElement = document.getElementById('statusMessage');
  statusElement.textContent = message;
  statusElement.classList.add('fade-in');
  
  setTimeout(() => {
    statusElement.textContent = '';
    statusElement.classList.remove('fade-in');
  }, duration);
}

// Update the TOTP code for the selected account
async function updateSelectedAccount() {
  if (!selectedAccount) {
    document.getElementById('totpCode').textContent = '------';
    return;
  }
  
  try {
    const accounts = await storage.getAccounts();
    const secret = accounts[selectedAccount];
    
    if (secret) {
      const code = await generateTOTP(
        secret, 
        settings.refreshPeriod, 
        settings.codeLength, 
        settings.algorithm
      );
      document.getElementById('totpCode').textContent = code;
    }
  } catch (error) {
    console.error('Error updating TOTP:', error);
    showStatus('Error generating code. Please check console.', 5000);
  }
}

// Update the timer bar
function updateTimer() {
  const percentage = getRemainingPercentage(settings.refreshPeriod);
  document.getElementById('timerProgress').style.width = percentage + '%';
  
  if (percentage <= 3) {
    setTimeout(updateSelectedAccount, 1000);
  }
}

// Refresh the account list in UI
async function refreshAccountList() {
  const accountList = document.getElementById('accountList');
  accountList.innerHTML = '';
  
  try {
    const accounts = await storage.getAccounts();
    const accountNames = Object.keys(accounts);
    
    if (accountNames.length === 0) {
      const emptyItem = document.createElement('div');
      emptyItem.className = 'account-item';
      emptyItem.textContent = 'Belum ada akun yang ditambahkan';
      accountList.appendChild(emptyItem);
      document.getElementById('totpCode').textContent = '------';
      return;
    }
    
    for (const name of accountNames) {
      const item = document.createElement('div');
      item.className = 'account-item';
      if (name === selectedAccount) {
        item.classList.add('selected');
      }
      
      item.textContent = name;
      item.addEventListener('click', () => {
        selectedAccount = name;
        updateSelectedAccount();
        
        // Update selection visuals
        document.querySelectorAll('.account-item').forEach(el => {
          el.classList.remove('selected');
        });
        item.classList.add('selected');
      });
      
      accountList.appendChild(item);
    }
    
    // Select first account if none selected
    if (!selectedAccount && accountNames.length > 0) {
      selectedAccount = accountNames[0];
      document.querySelector('.account-item').classList.add('selected');
      updateSelectedAccount();
    } else if (selectedAccount && !accountNames.includes(selectedAccount)) {
      // If selected account was deleted
      selectedAccount = accountNames.length > 0 ? accountNames[0] : null;
      if (selectedAccount) {
        document.querySelector('.account-item').classList.add('selected');
        updateSelectedAccount();
      }
    }
  } catch (error) {
    console.error('Error refreshing accounts:', error);
    showStatus('Error loading accounts. Please check console.', 5000);
  }
}

// Copy TOTP code to clipboard
function copyToClipboard() {
  const codeElement = document.getElementById('totpCode');
  const code = codeElement.textContent;
  
  if (code && code !== '------') {
    navigator.clipboard.writeText(code).then(() => {
      showStatus('Code copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
      showStatus('Failed to copy code');
    });
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Authenticator loaded');
  
  try {
    // Load settings
    settings = await storage.getSettings();
    console.log('Settings loaded:', settings);
    
    // Set up timer that updates every second
    setInterval(updateTimer, 1000);
    
    // Load accounts and display them
    await refreshAccountList();
    
    // Enable code copying on click
    document.getElementById('totpCode').addEventListener('click', copyToClipboard);
    
    // Set up UI event handlers
    document.getElementById('addButton').addEventListener('click', () => {
      document.getElementById('addForm').style.display = 'block';
    });
    
    document.getElementById('cancelButton').addEventListener('click', () => {
      document.getElementById('accountName').value = '';
      document.getElementById('secretKey').value = '';
      document.getElementById('addForm').style.display = 'none';
    });
    
    document.getElementById('saveButton').addEventListener('click', async () => {
      const name = document.getElementById('accountName').value.trim();
      const secret = document.getElementById('secretKey').value.trim().replace(/\s/g, '');
      
      if (name && secret) {
        try {
          await storage.saveAccount(name, secret);
          document.getElementById('accountName').value = '';
          document.getElementById('secretKey').value = '';
          document.getElementById('addForm').style.display = 'none';
          await refreshAccountList();
          showStatus('Account added successfully!');
        } catch (error) {
          console.error('Error saving account:', error);
          showStatus('Failed to save account. Please try again.', 5000);
        }
      } else {
        showStatus('Account name and secret key are required', 5000);
      }
    });
    
    document.getElementById('scanQRButton').addEventListener('click', () => {
      window.location.href = 'qr-scan.html';
    });
    
    document.getElementById('settingsButton').addEventListener('click', () => {
      window.location.href = 'settings.html';
    });
    
  } catch (error) {
    console.error('Error initializing authenticator:', error);
    showStatus('Failed to initialize. Check console for details.', 10000);
  }
});
