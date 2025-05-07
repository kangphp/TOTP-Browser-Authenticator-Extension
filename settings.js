/**
 * Settings Manager for Browser Authenticator
 */

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

// Get settings from storage
async function getSettings() {
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

// Save settings to storage
async function saveSettings(settings) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({ settings }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

// Export accounts as JSON file
async function exportAccounts() {
  try {
    const data = await new Promise((resolve, reject) => {
      chrome.storage.sync.get('accounts', (data) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(data.accounts || {});
        }
      });
    });
    
    // Create a downloadable blob
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create a link to download and click it
    const a = document.createElement('a');
    a.href = url;
    a.download = `authenticator-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
    showStatus('Accounts exported successfully!');
    return true;
  } catch (error) {
    console.error('Export error:', error);
    showStatus('Export failed. Please check console.', 5000);
    return false;
  }
}

// Import accounts from JSON file
async function importAccountsFromFile(file) {
  try {
    const content = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
    
    const importedAccounts = JSON.parse(content);
    
    // Validate imported data (must be an object)
    if (typeof importedAccounts !== 'object' || importedAccounts === null || Array.isArray(importedAccounts)) {
      throw new Error('Invalid backup format');
    }
    
    // Get current accounts
    const data = await new Promise((resolve, reject) => {
      chrome.storage.sync.get('accounts', (data) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(data);
        }
      });
    });
    
    const currentAccounts = data.accounts || {};
    
    // Merge imported accounts with current accounts
    const mergedAccounts = { ...currentAccounts, ...importedAccounts };
    
    // Save merged accounts
    await new Promise((resolve, reject) => {
      chrome.storage.sync.set({ accounts: mergedAccounts }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
    
    const importedCount = Object.keys(importedAccounts).length;
    showStatus(`${importedCount} account(s) imported successfully!`);
    return true;
  } catch (error) {
    console.error('Import error:', error);
    showStatus('Import failed. Invalid file or format.', 5000);
    return false;
  }
}

// Initialize the settings page
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Settings page loaded');
  
  const codeLengthSelect = document.getElementById('codeLength');
  const refreshPeriodSelect = document.getElementById('refreshPeriod');
  const algorithmSelect = document.getElementById('algorithm');
  const autoBackupToggle = document.getElementById('autoBackupToggle');
  
  try {
    // Load current settings
    const settings = await getSettings();
    console.log('Settings loaded:', settings);
    
    // Set form values from loaded settings
    codeLengthSelect.value = settings.codeLength || 6;
    refreshPeriodSelect.value = settings.refreshPeriod || 30;
    algorithmSelect.value = settings.algorithm || 'SHA-1';
    autoBackupToggle.checked = settings.autoBackup || false;
    
    // Save settings button
    document.getElementById('saveSettingsButton').addEventListener('click', async () => {
      try {
        const newSettings = {
          codeLength: parseInt(codeLengthSelect.value),
          refreshPeriod: parseInt(refreshPeriodSelect.value),
          algorithm: algorithmSelect.value,
          autoBackup: autoBackupToggle.checked
        };
        
        await saveSettings(newSettings);
        showStatus('Settings saved successfully!');
        
        // Optional: go back to main popup after saving
        setTimeout(() => {
          window.location.href = 'popup.html';
        }, 1500);
      } catch (error) {
        console.error('Error saving settings:', error);
        showStatus('Failed to save settings. Please try again.', 5000);
      }
    });
    
    // Back button
    document.getElementById('backFromSettingsButton').addEventListener('click', () => {
      window.location.href = 'popup.html';
    });
    
    // Export accounts button
    document.getElementById('exportButton').addEventListener('click', exportAccounts);
    
    // Import accounts button
    document.getElementById('importButton').addEventListener('click', () => {
      document.getElementById('importFile').click();
    });
    
    // File input change handler
    document.getElementById('importFile').addEventListener('change', async (event) => {
      const file = event.target.files[0];
      if (file) {
        await importAccountsFromFile(file);
        // Reset the file input
        event.target.value = null;
      }
    });
  } catch (error) {
    console.error('Error initializing settings page:', error);
    showStatus('Failed to load settings. Check console for details.', 10000);
  }
});
