/**
 * TOTP Implementation for Browser Authenticator
 */

// Base32 decoding
const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const base32CharsMap = {};
for (let i = 0; i < base32Chars.length; i++) {
  base32CharsMap[base32Chars.charAt(i)] = i;
}

// Base32 to bytes conversion
function base32ToBytes(base32) {
  let base32Str = base32.replace(/=+$/, '').toUpperCase();
  let bytes = [];
  let buffer = 0;
  let bitsLeft = 0;
  
  for (let i = 0; i < base32Str.length; i++) {
    const char = base32Str.charAt(i);
    if (!(char in base32CharsMap)) continue;
    
    buffer = (buffer << 5) | base32CharsMap[char];
    bitsLeft += 5;
    
    if (bitsLeft >= 8) {
      bitsLeft -= 8;
      bytes.push((buffer >> bitsLeft) & 0xFF);
    }
  }
  
  return bytes;
}

// Convert array of bytes to Uint8Array
function bytesToUint8Array(bytes) {
  return new Uint8Array(bytes);
}

// HMAC-SHA1 implementation using SubtleCrypto
async function hmacWithAlgorithm(key, message, algorithm = 'SHA-1') {
  try {
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: algorithm },
      false,
      ['sign']
    );
    
    const signature = await window.crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      message
    );
    
    return new Uint8Array(signature);
  } catch (error) {
    console.error('HMAC error:', error);
    throw error;
  }
}

// Generate TOTP code
async function generateTOTP(secret, period = 30, digits = 6, algorithm = 'SHA-1') {
  try {
    // Convert base32 secret to bytes
    const keyBytes = base32ToBytes(secret);
    const key = bytesToUint8Array(keyBytes);
    
    // Calculate counter value (Unix timestamp / period)
    let counter = Math.floor(Date.now() / 1000 / period);
    const counterBytes = new Uint8Array(8);
    for (let i = 7; i >= 0; i--) {
      counterBytes[i] = counter & 0xff;
      counter = counter >>> 8;
    }
    
    // Generate HMAC using the specified algorithm
    const hmacResult = await hmacWithAlgorithm(key, counterBytes, algorithm);
    
    // Dynamic truncation
    const offset = hmacResult[hmacResult.length - 1] & 0xf;
    const binary = ((hmacResult[offset] & 0x7f) << 24) |
                  ((hmacResult[offset + 1] & 0xff) << 16) |
                  ((hmacResult[offset + 2] & 0xff) << 8) |
                  (hmacResult[offset + 3] & 0xff);
    
    // Calculate OTP with the specified number of digits
    const otp = binary % Math.pow(10, digits);
    
    // Convert to string and pad with zeros if needed
    return otp.toString().padStart(digits, '0');
  } catch (error) {
    console.error('TOTP generation error:', error);
    return ''.padStart(digits, '-');
  }
}

// Calculate remaining time until next TOTP refresh
function getRemainingSeconds(period = 30) {
  return period - (Math.floor(Date.now() / 1000) % period);
}

// Calculate percentage of time remaining
function getRemainingPercentage(period = 30) {
  const remaining = getRemainingSeconds(period);
  return (remaining / period) * 100;
}
