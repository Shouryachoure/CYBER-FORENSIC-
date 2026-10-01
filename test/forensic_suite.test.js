import assert from 'node:assert';
import { calculateCRC32, computeAllHashes, calculateEntropy } from '../src/crypto/hasher.js';
import { analyzeAvalanche, TamperPresets } from '../src/crypto/avalanche.js';
import { initialChainOfCustody, calculateRecordHash, verifyChainOfCustody } from '../src/crypto/chainOfCustody.js';

async function runTests() {
  console.log("=== RUNNING FORENSIC SUITE UNIT TESTS ===");

  // 1. Test Hashes
  const testInput = "CONFIDENTIAL FORENSIC INVESTIGATION REPORT";
  const hashRes = await computeAllHashes(testInput);
  assert(hashRes.hashes.sha256.length === 64, "SHA-256 length must be 64 hex chars");
  assert(hashRes.hashes.md5.length === 32, "MD5 length must be 32 hex chars");
  assert(hashRes.hashes.sha512.length === 128, "SHA-512 length must be 128 hex chars");
  assert(hashRes.hashes.crc32.length === 8, "CRC32 length must be 8 hex chars");
  console.log("✓ Multi-Algorithm Hash Computation: PASS");

  // 2. Test CRC32 vs SHA-256
  const crc = calculateCRC32(testInput);
  assert(crc === hashRes.hashes.crc32, "CRC32 match");
  console.log("✓ CRC32 Checksum Validation: PASS");

  // 3. Test Avalanche Effect (1 bit flip)
  const flippedInput = TamperPresets.flipSingleBit(testInput);
  const hashResFlipped = await computeAllHashes(flippedInput);
  const avalanche = analyzeAvalanche(hashRes.hashes.sha256, hashResFlipped.hashes.sha256, 'SHA-256');
  assert(avalanche.flippedBits > 100, `Expected strong diffusion (>100 bits flipped), got ${avalanche.flippedBits}`);
  console.log(`✓ Avalanche Effect Diffusion: PASS (${avalanche.flippedBits}/256 bits flipped, ${avalanche.avalanchePercentage}%)`);

  // 4. Test Chain of Custody Validation
  const auditInitial = verifyChainOfCustody(initialChainOfCustody);
  assert(auditInitial.isValid === true, "Initial chain must be valid");
  console.log("✓ Initial Chain-of-Custody Audit: PASS");

  // 5. Test Chain of Custody Tamper Detection
  const tamperedChain = JSON.parse(JSON.stringify(initialChainOfCustody));
  tamperedChain[1].custodian = "MALICIOUS_IMPOSTOR";
  const auditTampered = verifyChainOfCustody(tamperedChain);
  assert(auditTampered.isValid === false, "Tampered chain must be detected as invalid");
  assert(auditTampered.brokenIndex === 1, "Tamper index must match modified entry");
  console.log("✓ Chain-of-Custody Tamper Detection Audit: PASS (Caught tampered record #2)");

  // 6. Test Shannon Entropy
  const entropy = calculateEntropy(new TextEncoder().encode(testInput));
  assert(entropy > 3.0 && entropy < 6.0, "Entropy of text should be normal range");
  console.log(`✓ Shannon Entropy Calculation: PASS (Score: ${entropy})`);

  console.log("\nALL 6 CRITICAL FORENSIC MODULE TESTS PASSED WITH 100% SUCCESS!");
}

runTests().catch(err => {
  console.error("Test failure:", err);
  process.exit(1);
});
