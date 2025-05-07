/**
 * QR Code Scanner for Browser Authenticator
 */

// Display a status message
function showStatus(message, duration = 3000) {
  const statusElement = document.getElementById('statusMessage');
  if (!statusElement) return;
  
  statusElement.textContent = message;
  statusElement.classList.add('fade-in');
  
  setTimeout(() => {
    statusElement.textContent = '';
    statusElement.classList.remove('fade-in');
  }, duration);
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('QR scan page loaded');
  
  // Check if HTML5 QRCode is available
  if (typeof Html5Qrcode === 'undefined') {
    console.error('HTML5 QR code scanner library not loaded');
    showStatus('QR scanner library not loaded. Please check console.', 10000);
    return;
  }
  
  const qrReader = document.getElementById('qr-reader');
  const resultContainer = document.getElementById('resultContainer');
  const qrResult = document.getElementById('qrResult');
  const saveQrButton = document.getElementById('saveQrButton');
  const backButton = document.getElementById('backButton');
  
  let lastResult = null;
  let html5QrCode;
  
  try {
    html5QrCode = new Html5Qrcode("qr-reader");
    
    // Konfigurasi scanner
    const qrConfig = { 
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0
    };
    
    // Mulai pemindaian kamera
    html5QrCode.start(
      { facingMode: "environment" },
      qrConfig,
      onScanSuccess,
      onScanFailure
    ).catch(err => {
      console.error('Error starting scanner:', err);
      showStatus('Failed to access camera. Please ensure you have granted camera permission.', 10000);
    });
    
    // Handler untuk hasil pemindaian
    function onScanSuccess(decodedText) {
      console.log('QR code detected:', decodedText);
      
      // Hentikan pemindaian jika QR code terdeteksi
      html5QrCode.pause();
      
      try {
        // Coba menguraikan hasil QR code sebagai URI otentikasi
        const qrUri = new URL(decodedText);
        
        // Periksa apakah ini adalah URI otauth
        if (qrUri.protocol === 'otpauth:') {
          const params = new URLSearchParams(qrUri.search);
          const secret = params.get('secret');
          const issuer = params.get('issuer') || '';
          const accountName = qrUri.pathname.split('/').pop() || 'Unknown';
          
          lastResult = {
            name: issuer ? `${issuer} (${accountName})` : accountName,
            secret: secret
          };
          
          // Tampilkan hasil dan tombol simpan
          qrResult.textContent = `Akun: ${lastResult.name}`;
          resultContainer.style.display = 'block';
        } else {
          showStatus('QR code detected but not recognized as an authenticator code.', 5000);
          html5QrCode.resume();
        }
      } catch (error) {
        console.error('Error parsing QR code:', error);
        showStatus('Invalid QR code format. Please try another code.', 5000);
        html5QrCode.resume();
      }
    }
    
    // Feedback saat pemindaian
    function onScanFailure(error) {
      // Kita tidak perlu menampilkan error untuk setiap frame
      // console.error('QR scan error:', error);
    }
    
    // Tombol untuk menyimpan hasil
    saveQrButton.addEventListener('click', () => {
      if (lastResult) {
        chrome.storage.sync.get('accounts', (data) => {
          const accounts = data.accounts || {};
          accounts[lastResult.name] = lastResult.secret;
          
          chrome.storage.sync.set({ accounts }, () => {
            if (chrome.runtime.lastError) {
              console.error('Error saving account:', chrome.runtime.lastError);
              showStatus('Failed to save account. Please try again.', 5000);
            } else {
              showStatus('Account successfully added!');
              setTimeout(() => {
                window.location.href = 'popup.html';
              }, 1500);
            }
          });
        });
      }
    });
    
    // Tombol untuk kembali
    backButton.addEventListener('click', () => {
      if (html5QrCode) {
        html5QrCode.stop().then(() => {
          window.location.href = 'popup.html';
        }).catch(error => {
          console.error('Error stopping QR scanner:', error);
          window.location.href = 'popup.html';
        });
      } else {
        window.location.href = 'popup.html';
      }
    });
    
  } catch (error) {
    console.error('QR scanner initialization error:', error);
    showStatus('Failed to initialize QR scanner. Please check console.', 10000);
  }
});
