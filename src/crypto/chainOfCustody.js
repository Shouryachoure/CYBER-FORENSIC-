import CryptoJS from 'crypto-js';

/**
 * Calculates cryptographic SHA-256 hash of a chain of custody record
 */
export function calculateRecordHash(record) {
  const content = [
    record.id,
    record.evidenceId,
    record.caseNumber,
    record.stage,
    record.timestamp,
    record.custodian,
    record.organization,
    record.storageLocation,
    record.writeBlockerUsed ? 'WB:YES' : 'WB:NO',
    record.evidenceHashSHA256,
    record.evidenceHashMD5,
    record.previousBlockHash,
    record.notes || '',
  ].join('|');

  return CryptoJS.SHA256(content).toString();
}

/**
 * Default initial Chain of Custody records based on a realistic cyber forensics case
 */
export const initialChainOfCustody = [
  {
    id: 'COC-ENTRY-001',
    evidenceId: 'EV-2026-0941',
    caseNumber: 'CFI/2026/049',
    stage: 'Evidence Acquisition & Seizure',
    timestamp: '2026-09-28T09:15:00.000Z',
    custodian: 'Shourya Choure [CM23049]',
    organization: 'SBJITMR Cyber Forensics & Investigation Lab',
    storageLocation: 'Physical Crime Scene / Incident Response Unit 1',
    writeBlockerUsed: true,
    evidenceHashSHA256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    evidenceHashMD5: 'd41d8cd98f00b204e9800998ecf8427e',
    previousBlockHash: '0000000000000000000000000000000000000000000000000000000000000000',
    recordHash: '',
    notes: 'Seized NVMe SSD using Tableau T8u Forensic USB 3.0 Bridge with hardware write-blocking active. Baseline dual-hash calculated.',
  },
  {
    id: 'COC-ENTRY-002',
    evidenceId: 'EV-2026-0941',
    caseNumber: 'CFI/2026/049',
    stage: 'Transfer to Secure Evidence Vault',
    timestamp: '2026-09-28T13:40:00.000Z',
    custodian: 'Officer R. Verma (Evidence Custodian)',
    organization: 'Digital Evidence Locker Facility',
    storageLocation: 'Fireproof Faraday Locker B-14',
    writeBlockerUsed: true,
    evidenceHashSHA256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    evidenceHashMD5: 'd41d8cd98f00b204e9800998ecf8427e',
    previousBlockHash: '',
    recordHash: '',
    notes: 'Received into tamper-evident anti-static bag #TE-8842. Custody transfer dual-hash matched baseline.',
  },
  {
    id: 'COC-ENTRY-003',
    evidenceId: 'EV-2026-0941',
    caseNumber: 'CFI/2026/049',
    stage: 'Forensic Lab Bit-Stream Acquisition',
    timestamp: '2026-09-29T10:00:00.000Z',
    custodian: 'Ms. Sweta Bokade (Forensic Supervisor)',
    organization: 'SBJITMR Digital Forensics Research Lab',
    storageLocation: 'Forensic Workstation Alpha (Isolated Air-Gapped)',
    writeBlockerUsed: true,
    evidenceHashSHA256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    evidenceHashMD5: 'd41d8cd98f00b204e9800998ecf8427e',
    previousBlockHash: '',
    recordHash: '',
    notes: 'Generated Raw dd / E01 working image. Working image hash verified bit-for-bit identical to master physical image.',
  },
  {
    id: 'COC-ENTRY-004',
    evidenceId: 'EV-2026-0941',
    caseNumber: 'CFI/2026/049',
    stage: 'Courtroom Evidence Verification & Presentation',
    timestamp: '2026-10-01T11:30:00.000Z',
    custodian: 'Shourya Choure [Lead Investigator]',
    organization: 'Special Cyber Proceedings / Academic Review Board',
    storageLocation: 'Sealed Presentation Vault',
    writeBlockerUsed: true,
    evidenceHashSHA256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    evidenceHashMD5: 'd41d8cd98f00b204e9800998ecf8427e',
    previousBlockHash: '',
    recordHash: '',
    notes: 'Pre-trial hash verification executed in presence of defense. Zero integrity deviation confirmed.',
  }
];

// Initialize cryptographic hashes for the initial chain
let prev = '0000000000000000000000000000000000000000000000000000000000000000';
for (let i = 0; i < initialChainOfCustody.length; i++) {
  initialChainOfCustody[i].previousBlockHash = prev;
  const hash = calculateRecordHash(initialChainOfCustody[i]);
  initialChainOfCustody[i].recordHash = hash;
  prev = hash;
}

/**
 * Verifies the mathematical integrity of the Chain of Custody ledger.
 * Returns { isValid: boolean, brokenIndex: number | null, reason: string }
 */
export function verifyChainOfCustody(chain) {
  if (!chain || chain.length === 0) {
    return { isValid: true, brokenIndex: null, reason: 'Empty chain is trivially valid' };
  }

  let expectedPrevHash = '0000000000000000000000000000000000000000000000000000000000000000';

  for (let i = 0; i < chain.length; i++) {
    const entry = chain[i];

    // Check 1: Does the entry have the correct previousBlockHash?
    if (entry.previousBlockHash !== expectedPrevHash) {
      return {
        isValid: false,
        brokenIndex: i,
        brokenId: entry.id,
        reason: `Broken chain link at Entry #${i + 1} (${entry.id}). Previous hash mismatch: expected ${expectedPrevHash.slice(0, 10)}... but found ${entry.previousBlockHash.slice(0, 10)}... (Possible record deletion or insertion).`
      };
    }

    // Check 2: Does recomputing the entry's hash match its recorded hash?
    const computedHash = calculateRecordHash(entry);
    if (computedHash !== entry.recordHash) {
      return {
        isValid: false,
        brokenIndex: i,
        brokenId: entry.id,
        reason: `Tamper detected in Entry #${i + 1} (${entry.id})! The record data (custodian, timestamp, or evidence hash) has been altered after signing.`
      };
    }

    expectedPrevHash = entry.recordHash;
  }

  return {
    isValid: true,
    brokenIndex: null,
    totalVerifiedRecords: chain.length,
    reason: `All ${chain.length} Chain of Custody blocks cryptographically validated with zero tampering.`
  };
}
