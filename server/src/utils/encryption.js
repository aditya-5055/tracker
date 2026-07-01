const crypto = require('crypto');

// ENCRYPTION_SECRET should be a 32-byte hex string (64 characters) or padded to 32 bytes
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'a_very_secure_default_secret_12345678901234567890123456789012';
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

function getValidKey() {
  // Ensure the key is exactly 32 bytes (256 bits)
  const keyBuffer = Buffer.alloc(32);
  const secretBuffer = Buffer.from(ENCRYPTION_SECRET, 'utf8');
  secretBuffer.copy(keyBuffer, 0, 0, Math.min(secretBuffer.length, 32));
  return keyBuffer;
}

exports.encrypt = function(text) {
  if (!text) return text;
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, getValidKey(), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (err) {
    console.error('Encryption error:', err);
    return null;
  }
};

exports.decrypt = function(text) {
  if (!text) return text;
  try {
    const textParts = text.split(':');
    if (textParts.length !== 2) return text; // might be unencrypted legacy data
    
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, getValidKey(), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    console.error('Decryption error:', err);
    return null;
  }
};
