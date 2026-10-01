import { computeAllHashes } from './hasher.js';

/**
 * Converts a hex string into a binary string
 */
export function hexToBinary(hex) {
  let binary = '';
  for (let i = 0; i < hex.length; i++) {
    const bin = parseInt(hex[i], 16).toString(2).padStart(4, '0');
    binary += bin;
  }
  return binary;
}

/**
 * Calculates bit-level differences (Hamming Distance & Avalanche Metric)
 * between two hashes of the same algorithm.
 */
export function analyzeAvalanche(hashA, hashB, algorithmName = 'SHA-256') {
  if (!hashA || !hashB) return null;
  const binA = hexToBinary(hashA);
  const binB = hexToBinary(hashB);
  const bitLength = Math.max(binA.length, binB.length);

  let flippedBits = 0;
  const bitDifferences = []; // array of { index, bitA, bitB, isFlipped }

  for (let i = 0; i < bitLength; i++) {
    const bitA = binA[i] || '0';
    const bitB = binB[i] || '0';
    const isFlipped = bitA !== bitB;
    if (isFlipped) flippedBits++;
    bitDifferences.push({
      index: i,
      bitA,
      bitB,
      isFlipped,
    });
  }

  const avalanchePercentage = Number(((flippedBits / bitLength) * 100).toFixed(2));
  
  // Interpretation according to strict cryptographic standards
  let evaluation = '';
  let statusClass = '';
  if (algorithmName === 'CRC32') {
    evaluation = 'Poor (Non-Cryptographic Checksum): Small input changes cause localized or predictable bit changes.';
    statusClass = 'danger';
  } else if (avalanchePercentage >= 40 && avalanchePercentage <= 60) {
    evaluation = 'Ideal Cryptographic Diffusion (~50% Avalanche Effect achieved). High collision and tampering resistance.';
    statusClass = 'success';
  } else {
    evaluation = `Partial Avalanche (${avalanchePercentage}%). Differs from optimal 50% cryptographic diffusion.`;
    statusClass = 'warning';
  }

  return {
    algorithmName,
    bitLength,
    flippedBits,
    avalanchePercentage,
    evaluation,
    statusClass,
    bitDifferences,
  };
}

/**
 * Tamper simulation mutations
 */
export const TamperPresets = {
  flipSingleBit: (text) => {
    if (!text || text.length === 0) return 'Sample Evidence Data';
    // Invert the lowest bit of the first character
    const charCode = text.charCodeAt(0);
    const flippedChar = String.fromCharCode(charCode ^ 1);
    return flippedChar + text.slice(1);
  },

  modifyOneByte: (text) => {
    if (!text || text.length === 0) return 'Sample Evidence Data';
    const mid = Math.floor(text.length / 2);
    const replacement = text[mid] === 'X' ? 'Y' : 'X';
    return text.slice(0, mid) + replacement + text.slice(mid + 1);
  },

  appendSpace: (text) => {
    // Simulates subtle editor touch or white-space contamination
    return text + ' ';
  },

  metadataTouch: (text) => {
    // Simulates mounting a drive without a hardware write-blocker (access timestamp updated)
    return text + '\n[FS_ATIME_UPDATE: ' + new Date().toISOString() + ']';
  },

  insertNullByte: (text) => {
    return text + '\0';
  },
};
