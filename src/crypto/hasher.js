import CryptoJS from 'crypto-js';

// IEEE 802.3 CRC32 implementation
const makeCRCTable = () => {
  let c;
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
  }
  return crcTable;
};

const crcTable = makeCRCTable();

export function calculateCRC32(data) {
  let crc = 0 ^ (-1);
  if (typeof data === 'string') {
    for (let i = 0; i < data.length; i++) {
      const code = data.charCodeAt(i);
      if (code < 128) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ code) & 0xff];
      } else {
        const utf8 = unescape(encodeURIComponent(data[i]));
        for (let j = 0; j < utf8.length; j++) {
          crc = (crc >>> 8) ^ crcTable[(crc ^ utf8.charCodeAt(j)) & 0xff];
        }
      }
    }
  } else if (data instanceof Uint8Array || data instanceof ArrayBuffer) {
    const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
    for (let i = 0; i < bytes.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[i]) & 0xff];
    }
  }
  return ((crc ^ (-1)) >>> 0).toString(16).padStart(8, '0').toLowerCase();
}

/**
 * Converts ArrayBuffer to CryptoJS WordArray
 */
function arrayBufferToWordArray(ab) {
  const i8a = new Uint8Array(ab);
  const a = [];
  for (let i = 0; i < i8a.length; i += 4) {
    a.push(
      (i8a[i] << 24) |
      (i8a[i + 1] << 16) |
      (i8a[i + 2] << 8) |
      (i8a[i + 3])
    );
  }
  return CryptoJS.lib.WordArray.create(a, i8a.length);
}

/**
 * Computes all forensic hash algorithms simultaneously
 * @param {string | ArrayBuffer | File} input - Data or File to hash
 * @returns {Promise<Object>} Object containing all hashes & metadata
 */
export async function computeAllHashes(input) {
  const startTime = performance.now();
  let wordArray;
  let rawBytes;
  let byteLength = 0;

  if (input instanceof File || input instanceof Blob) {
    byteLength = input.size;
    const buffer = await input.arrayBuffer();
    rawBytes = new Uint8Array(buffer);
    wordArray = arrayBufferToWordArray(buffer);
  } else if (input instanceof ArrayBuffer) {
    byteLength = input.byteLength;
    rawBytes = new Uint8Array(input);
    wordArray = arrayBufferToWordArray(input);
  } else if (typeof input === 'string') {
    byteLength = new TextEncoder().encode(input).length;
    wordArray = CryptoJS.enc.Utf8.parse(input);
    rawBytes = new TextEncoder().encode(input);
  } else {
    throw new Error('Unsupported input type for hashing');
  }

  // Calculate hashes
  const md5 = CryptoJS.MD5(wordArray).toString();
  const sha1 = CryptoJS.SHA1(wordArray).toString();
  const sha256 = CryptoJS.SHA256(wordArray).toString();
  const sha512 = CryptoJS.SHA512(wordArray).toString();
  const sha3 = CryptoJS.SHA3(wordArray, { outputLength: 256 }).toString();
  const crc32 = calculateCRC32(rawBytes);

  const durationMs = (performance.now() - startTime).toFixed(2);

  return {
    byteLength,
    durationMs,
    hashes: {
      crc32,
      md5,
      sha1,
      sha256,
      sha512,
      sha3,
    },
    // Dual Hash Forensic Standard (MD5 + SHA-256 pairing recommended in report)
    dualHash: {
      md5,
      sha256,
      fingerprint: `${md5.slice(0, 8)}...:${sha256.slice(0, 12)}...`,
      isStandardCompliant: true,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Calculate binary entropy of data to detect encryption / packing / corruption
 */
export function calculateEntropy(bytes) {
  if (!bytes || bytes.length === 0) return 0;
  const frequencies = new Uint32Array(256);
  for (let i = 0; i < bytes.length; i++) {
    frequencies[bytes[i]]++;
  }
  let entropy = 0;
  const len = bytes.length;
  for (let i = 0; i < 256; i++) {
    if (frequencies[i] > 0) {
      const p = frequencies[i] / len;
      entropy -= p * Math.log2(p);
    }
  }
  return Number(entropy.toFixed(3)); // Max 8.0 for random/encrypted data
}
