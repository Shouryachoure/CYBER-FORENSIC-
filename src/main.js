import confetti from 'canvas-confetti';
import { computeAllHashes, calculateEntropy } from './crypto/hasher.js';
import { analyzeAvalanche, TamperPresets } from './crypto/avalanche.js';
import { initialChainOfCustody, calculateRecordHash, verifyChainOfCustody } from './crypto/chainOfCustody.js';
import { SampleEvidenceFiles } from './data/sampleEvidence.js';
import {
  ReportMetadata,
  HashingAlgorithmsData,
  IntegrityRisksData,
  KeyObservations,
  ForensicRecommendations
} from './data/reportData.js';
import { renderReportCharts } from './ui/charts.js';
import { generateForensicCertificateHTML } from './ui/certificate.js';

// Application State
const state = {
  currentEvidence: {
    name: 'server_auth.log',
    type: 'Security Event Log',
    byteLength: 0,
    entropy: 0,
    latency: '0.00',
    content: '',
    hashes: {
      crc32: '',
      md5: '',
      sha1: '',
      sha256: '',
      sha512: '',
      sha3: '',
    },
    dualHash: null,
    caseNumber: 'CFI/2026/049',
    evidenceId: 'EV-2026-0941',
  },
  chainOfCustody: JSON.parse(JSON.stringify(initialChainOfCustody)),
  avalanche: {
    algorithm: 'SHA-256',
    originalText: '',
    tamperedText: '',
  }
};

// Toast notification helper
function showToast(message, icon = '✓') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 200);
  }, 3200);
}

// ----------------------------------------------------
// TAB NAVIGATION
// ----------------------------------------------------
function initNavigation() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      const pane = document.getElementById(targetId);
      if (pane) pane.classList.add('active');

      if (targetId === 'tab-analytics') {
        setTimeout(renderReportCharts, 50);
      } else if (targetId === 'tab-certificate') {
        renderCertificate();
      } else if (targetId === 'tab-avalanche') {
        updateAvalancheAnalysis();
      }
    });
  });
}

// ----------------------------------------------------
// TAB 1: EVIDENCE INGESTION & HASH CALCULATOR
// ----------------------------------------------------
async function processEvidenceInput(data, name = 'custom_evidence.bin', type = 'Raw Ingested Artifact') {
  try {
    const hashResult = await computeAllHashes(data);
    state.currentEvidence.name = name;
    state.currentEvidence.type = type;
    state.currentEvidence.byteLength = hashResult.byteLength;
    state.currentEvidence.latency = hashResult.durationMs;
    state.currentEvidence.hashes = hashResult.hashes;
    state.currentEvidence.dualHash = hashResult.dualHash;

    if (typeof data === 'string') {
      state.currentEvidence.content = data;
      state.currentEvidence.entropy = calculateEntropy(new TextEncoder().encode(data));
    } else if (data instanceof File) {
      const buf = await data.arrayBuffer();
      state.currentEvidence.entropy = calculateEntropy(new Uint8Array(buf));
      // Read first 2KB as text preview if possible
      try {
        state.currentEvidence.content = await data.slice(0, 4096).text();
      } catch (e) {
        state.currentEvidence.content = '[Binary Data Stream]';
      }
    }

    renderEvidenceMetadata();
    renderHashesList();
    renderCertificate();
  } catch (err) {
    console.error('Hashing error:', err);
    showToast('Failed to hash evidence: ' + err.message, '⚠️');
  }
}

function renderEvidenceMetadata() {
  document.getElementById('meta-filename').textContent = state.currentEvidence.name;
  document.getElementById('meta-filesize').textContent = `${state.currentEvidence.byteLength.toLocaleString()} Bytes`;
  document.getElementById('meta-entropy').textContent = `${state.currentEvidence.entropy} / 8.00`;
  document.getElementById('meta-latency').textContent = `${state.currentEvidence.latency} ms`;
}

function renderHashesList() {
  const container = document.getElementById('hashes-display-list');
  if (!container) return;

  const h = state.currentEvidence.hashes;
  const algos = [
    {
      id: 'sha256',
      name: 'SHA-256 (NIST FIPS 180-4)',
      digest: h.sha256,
      badge: 'FORENSIC GOLD STANDARD',
      badgeClass: 'badge-gold',
      security: '256-bit collision-resistant digest; standard for evidentiary validity.'
    },
    {
      id: 'md5',
      name: 'MD5 (Rivest RFC 1321)',
      digest: h.md5,
      badge: 'DUAL-HASH CROSS-CHECK',
      badgeClass: 'badge-legacy',
      security: '128-bit legacy hash; used exclusively paired with SHA-256 for backward compatibility.'
    },
    {
      id: 'sha1',
      name: 'SHA-1 (NIST FIPS 180-1)',
      digest: h.sha1,
      badge: 'DEPRECATED / PHASING OUT',
      badgeClass: 'badge-legacy',
      security: '160-bit digest; theoretical & practical collisions demonstrated (SHAttered).'
    },
    {
      id: 'sha512',
      name: 'SHA-512 (SHA-2 Family)',
      digest: h.sha512,
      badge: 'HIGH-ASSURANCE TIER',
      badgeClass: 'badge-gold',
      security: '512-bit digest; optimal for 64-bit platforms and high-sensitivity government cases.'
    },
    {
      id: 'sha3',
      name: 'SHA-3 (Keccak-256 NIST FIPS 202)',
      digest: h.sha3,
      badge: 'NEXT-GEN STANDARD',
      badgeClass: 'badge-nextgen',
      security: '256-bit sponge permutation; mathematically independent of SHA-2 structure.'
    },
    {
      id: 'crc32',
      name: 'CRC32 (IEEE 802.3 Checksum)',
      digest: h.crc32,
      badge: 'FORBIDDEN FOR FORENSICS',
      badgeClass: 'badge-forbidden',
      security: '32-bit transmission check only; non-cryptographic, zero pre-image resistance.'
    },
  ];

  container.innerHTML = algos.map(item => `
    <div class="hash-row">
      <div class="hash-row-header">
        <span class="hash-algo-name">${item.name}</span>
        <div class="hash-badges">
          <span class="badge ${item.badgeClass}">${item.badge}</span>
        </div>
      </div>
      <div class="hash-digest-box">
        <span class="hash-digest-text font-mono" id="digest-val-${item.id}">${item.digest || 'Computing...'}</span>
        <button class="copy-btn" data-copy="${item.digest}" title="Copy to clipboard">
          📋 Copy
        </button>
      </div>
    </div>
  `).join('');

  // Attach copy listeners
  container.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.getAttribute('data-copy');
      if (text) {
        navigator.clipboard.writeText(text);
        showToast('Hash copied to clipboard!');
      }
    });
  });
}

function initIngestionEvents() {
  const dropzone = document.getElementById('evidence-dropzone');
  const fileInput = document.getElementById('evidence-file-input');
  const rawTextarea = document.getElementById('raw-evidence-text');

  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processEvidenceInput(file, file.name, 'Uploaded Forensic Image');
      showToast(`Ingested file: ${file.name}`);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      processEvidenceInput(file, file.name, 'Uploaded Forensic Image');
      showToast(`Ingested file: ${file.name}`);
    }
  });

  rawTextarea.addEventListener('input', (e) => {
    processEvidenceInput(e.target.value, 'live_stream_buffer.txt', 'Direct Buffer Ingestion');
  });

  // Sample Evidence Buttons
  document.querySelectorAll('.sample-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sampleId = btn.getAttribute('data-sample');
      const sample = SampleEvidenceFiles.find(s => s.id === sampleId);
      if (sample) {
        rawTextarea.value = sample.content;
        processEvidenceInput(sample.content, sample.name, sample.type);
        showToast(`Loaded sample: ${sample.name}`);
      }
    });
  });

  // Action Buttons
  document.getElementById('btn-export-manifest').addEventListener('click', () => {
    const manifest = `# FORENSIC EVIDENCE HASH MANIFEST
# Case ID: ${state.currentEvidence.caseNumber}
# Evidence ID: ${state.currentEvidence.evidenceId}
# File Name: ${state.currentEvidence.name}
# Size: ${state.currentEvidence.byteLength} Bytes
# Acquisition Timestamp: ${new Date().toISOString()}
# Lead Investigator: ${ReportMetadata.studentName} [${ReportMetadata.studentRoll}]
# Guide: ${ReportMetadata.guideName}

SHA256 (${state.currentEvidence.name}) = ${state.currentEvidence.hashes.sha256}
MD5 (${state.currentEvidence.name}) = ${state.currentEvidence.hashes.md5}
SHA512 (${state.currentEvidence.name}) = ${state.currentEvidence.hashes.sha512}
SHA3-256 (${state.currentEvidence.name}) = ${state.currentEvidence.hashes.sha3}
CRC32 (${state.currentEvidence.name}) = ${state.currentEvidence.hashes.crc32}
`;
    const blob = new Blob([manifest], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.currentEvidence.name}.sha256`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Evidence hash manifest downloaded!');
  });

  document.getElementById('btn-send-to-avalanche').addEventListener('click', () => {
    document.querySelector('[data-tab="tab-avalanche"]').click();
    const orig = document.getElementById('avalanche-original-text');
    const tampered = document.getElementById('avalanche-tampered-text');
    orig.value = state.currentEvidence.content || 'Evidence Artifact Sample Bit-Stream';
    tampered.value = TamperPresets.flipSingleBit(orig.value);
    updateAvalancheAnalysis();
    showToast('Sent evidence to Avalanche Lab with 1-bit mutation injected!');
  });

  document.getElementById('btn-register-in-coc').addEventListener('click', () => {
    document.querySelector('[data-tab="tab-coc"]').click();
    document.getElementById('btn-add-coc-record').click();
  });

  document.getElementById('btn-quick-verify').addEventListener('click', () => {
    document.querySelector('[data-tab="tab-verify"]').click();
    document.getElementById('verify-raw-content').value = state.currentEvidence.content;
    document.getElementById('verify-expected-hash').value = state.currentEvidence.hashes.sha256;
    document.getElementById('verify-expected-algo').value = 'SHA-256';
    document.getElementById('btn-execute-verification').click();
  });
}

// ----------------------------------------------------
// TAB 2: AVALANCHE EFFECT & TAMPER LAB
// ----------------------------------------------------
async function updateAvalancheAnalysis() {
  const origText = document.getElementById('avalanche-original-text').value;
  const tamperedText = document.getElementById('avalanche-tampered-text').value;
  const algo = document.getElementById('avalanche-algo-select').value;

  const origHashObj = await computeAllHashes(origText);
  const tamperedHashObj = await computeAllHashes(tamperedText);

  let key = 'sha256';
  if (algo === 'MD5') key = 'md5';
  else if (algo === 'SHA-1') key = 'sha1';
  else if (algo === 'SHA-512') key = 'sha512';
  else if (algo === 'CRC32') key = 'crc32';

  const origHash = origHashObj.hashes[key];
  const tamperedHash = tamperedHashObj.hashes[key];

  document.getElementById('avalanche-orig-hash').textContent = origHash;
  document.getElementById('avalanche-tampered-hash').textContent = tamperedHash;

  const analysis = analyzeAvalanche(origHash, tamperedHash, algo);
  if (!analysis) return;

  const isIdentical = origHash === tamperedHash;
  const statusPill = document.getElementById('tamper-status-pill');
  const algoBadge = document.getElementById('tamper-algo-badge');

  if (isIdentical) {
    statusPill.className = 'status-pill pass';
    statusPill.textContent = 'IDENTICAL BIT-STREAM';
    algoBadge.className = 'badge badge-gold';
    algoBadge.textContent = '100% MATCH';
    document.getElementById('metric-integrity-status').textContent = 'VERIFIED';
    document.getElementById('metric-integrity-status').style.color = '#34d399';
  } else {
    statusPill.className = 'status-pill fail';
    statusPill.textContent = 'MODIFIED STATE';
    algoBadge.className = 'badge badge-forbidden';
    algoBadge.textContent = 'MISMATCH DETECTED';
    document.getElementById('metric-integrity-status').textContent = 'TAMPERED';
    document.getElementById('metric-integrity-status').style.color = '#f87171';
  }

  document.getElementById('metric-total-bits').textContent = analysis.bitLength;
  document.getElementById('metric-flipped-bits').textContent = analysis.flippedBits;
  document.getElementById('metric-avalanche-pct').textContent = `${analysis.avalanchePercentage}%`;

  const alertBox = document.getElementById('avalanche-alert-box');
  alertBox.className = `audit-alert-box ${isIdentical ? 'pass' : (analysis.statusClass === 'danger' ? 'fail' : 'pass')}`;
  document.getElementById('avalanche-explanation').innerHTML = `
    <strong>Forensic Cryptographic Evaluation:</strong> ${analysis.evaluation}
    <br><small style="color: #cbd5e1;">A 1-bit or minor input edit triggered ${analysis.flippedBits} flipped bits out of ${analysis.bitLength} total digest bits (${analysis.avalanchePercentage}% diffusion rate).</small>
  `;

  // Render Visual Bit Matrix (limit up to 256 cells for visual clarity)
  const bitGrid = document.getElementById('avalanche-bit-grid');
  bitGrid.innerHTML = '';
  const displayBits = analysis.bitDifferences.slice(0, 256);
  displayBits.forEach((b) => {
    const cell = document.createElement('div');
    cell.className = `bit-cell ${b.isFlipped ? 'flipped' : ''}`;
    cell.textContent = b.bitB;
    cell.title = `Bit #${b.index}: Original=${b.bitA} → Current=${b.bitB} (${b.isFlipped ? 'FLIPPED' : 'Identical'})`;
    bitGrid.appendChild(cell);
  });
}

function initAvalancheEvents() {
  const origText = document.getElementById('avalanche-original-text');
  const tamperedText = document.getElementById('avalanche-tampered-text');
  const algoSelect = document.getElementById('avalanche-algo-select');

  origText.addEventListener('input', updateAvalancheAnalysis);
  tamperedText.addEventListener('input', updateAvalancheAnalysis);
  algoSelect.addEventListener('change', updateAvalancheAnalysis);

  document.getElementById('btn-tamper-flip-1bit').addEventListener('click', () => {
    tamperedText.value = TamperPresets.flipSingleBit(origText.value);
    updateAvalancheAnalysis();
    showToast('Flipped 1 single bit (Character 0 XOR 1)!');
  });

  document.getElementById('btn-tamper-modify-byte').addEventListener('click', () => {
    tamperedText.value = TamperPresets.modifyOneByte(origText.value);
    updateAvalancheAnalysis();
    showToast('Modified 1 byte in payload!');
  });

  document.getElementById('btn-tamper-space').addEventListener('click', () => {
    tamperedText.value = TamperPresets.appendSpace(origText.value);
    updateAvalancheAnalysis();
    showToast('Appended subtle whitespace character!');
  });

  document.getElementById('btn-tamper-metadata').addEventListener('click', () => {
    tamperedText.value = TamperPresets.metadataTouch(origText.value);
    updateAvalancheAnalysis();
    showToast('Simulated mount without write-blocker (Access timestamp modified)!');
  });

  document.getElementById('btn-tamper-null').addEventListener('click', () => {
    tamperedText.value = TamperPresets.insertNullByte(origText.value);
    updateAvalancheAnalysis();
    showToast('Injected null byte (\\0)!');
  });

  document.getElementById('btn-tamper-reset').addEventListener('click', () => {
    tamperedText.value = origText.value;
    updateAvalancheAnalysis();
    showToast('Restored identical copies.');
  });
}

// ----------------------------------------------------
// TAB 3: CHAIN OF CUSTODY (CoC) LEDGER
// ----------------------------------------------------
function renderChainOfCustodyTimeline() {
  const container = document.getElementById('coc-timeline-container');
  if (!container) return;

  const auditResult = verifyChainOfCustody(state.chainOfCustody);
  const auditBanner = document.getElementById('coc-audit-banner');
  const auditTitle = document.getElementById('coc-audit-title');
  const auditMsg = document.getElementById('coc-audit-msg');
  const auditPill = document.getElementById('coc-audit-pill');

  if (auditResult.isValid) {
    auditBanner.className = 'audit-alert-box pass';
    auditTitle.textContent = '✓ Cryptographically Immutable Ledger Verified';
    auditMsg.textContent = auditResult.reason;
    auditPill.className = 'status-pill pass';
    auditPill.textContent = 'INTEGRITY SOUND';
  } else {
    auditBanner.className = 'audit-alert-box fail';
    auditTitle.textContent = '⚠️ TAMPER DETECTED IN CHAIN OF CUSTODY LEDGER!';
    auditMsg.textContent = auditResult.reason;
    auditPill.className = 'status-pill fail';
    auditPill.textContent = 'LEDGER COMPROMISED';
  }

  container.innerHTML = state.chainOfCustody.map((block, idx) => {
    const isTamperedBlock = !auditResult.isValid && idx >= auditResult.brokenIndex;
    return `
      <div class="coc-block ${isTamperedBlock ? 'tampered' : ''}">
        <div class="coc-node-badge">#${idx + 1}</div>
        <div class="coc-content-card">
          <div class="coc-card-header">
            <span class="coc-stage-tag">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
              ${block.stage}
            </span>
            <span class="coc-time">${new Date(block.timestamp).toLocaleString()}</span>
          </div>

          <div class="coc-details-grid">
            <div>
              <span class="text-dim" style="font-size: 0.7rem; text-transform: uppercase;">Custodian / Examiner:</span>
              <div style="font-weight: 600; color: #f1f5f9;">${block.custodian}</div>
            </div>
            <div>
              <span class="text-dim" style="font-size: 0.7rem; text-transform: uppercase;">Location / Workstation:</span>
              <div style="font-weight: 500; color: #cbd5e1;">${block.storageLocation}</div>
            </div>
            <div>
              <span class="text-dim" style="font-size: 0.7rem; text-transform: uppercase;">Hardware Write-Block:</span>
              <div>
                ${block.writeBlockerUsed
                  ? '<span class="status-pill pass">Active (Tableau T8u)</span>'
                  : '<span class="status-pill fail">None / Bypassed</span>'}
              </div>
            </div>
          </div>

          <p style="font-size: 0.8rem; color: #94a3b8; margin: 0.5rem 0;">${block.notes || ''}</p>

          <div class="coc-hash-links">
            <div class="coc-link-row">
              <span class="label">Evidence SHA-256:</span>
              <span class="hash-val">${block.evidenceHashSHA256}</span>
            </div>
            <div class="coc-link-row">
              <span class="label">Previous Block Hash:</span>
              <span class="hash-val">${block.previousBlockHash}</span>
            </div>
            <div class="coc-link-row">
              <span class="label" style="color: var(--accent-cyan);">Signed Block Hash:</span>
              <span class="hash-val" style="color: ${isTamperedBlock ? '#ef4444' : '#38bdf8'}; font-weight: bold;">
                ${block.recordHash}
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function initChainOfCustodyEvents() {
  const modal = document.getElementById('modal-add-coc');
  const btnOpenModal = document.getElementById('btn-add-coc-record');
  const btnCloseModal = document.getElementById('btn-close-coc-modal');
  const btnCancelModal = document.getElementById('btn-cancel-coc');
  const formAdd = document.getElementById('form-add-coc');

  btnOpenModal.addEventListener('click', () => modal.classList.add('active'));
  btnCloseModal.addEventListener('click', () => modal.classList.remove('active'));
  btnCancelModal.addEventListener('click', () => modal.classList.remove('active'));

  formAdd.addEventListener('submit', (e) => {
    e.preventDefault();
    const stage = document.getElementById('modal-coc-stage').value;
    const custodian = document.getElementById('modal-coc-custodian').value;
    const location = document.getElementById('modal-coc-location').value;
    const wb = document.getElementById('modal-coc-wb').value === 'true';
    const notes = document.getElementById('modal-coc-notes').value;

    const prevBlock = state.chainOfCustody[state.chainOfCustody.length - 1];
    const prevHash = prevBlock ? prevBlock.recordHash : '0000000000000000000000000000000000000000000000000000000000000000';

    const newRecord = {
      id: `COC-ENTRY-${String(state.chainOfCustody.length + 1).padStart(3, '0')}`,
      evidenceId: state.currentEvidence.evidenceId,
      caseNumber: state.currentEvidence.caseNumber,
      stage,
      timestamp: new Date().toISOString(),
      custodian,
      organization: 'SBJITMR Cyber Forensics & Investigation Lab',
      storageLocation: location,
      writeBlockerUsed: wb,
      evidenceHashSHA256: state.currentEvidence.hashes.sha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      evidenceHashMD5: state.currentEvidence.hashes.md5 || 'd41d8cd98f00b204e9800998ecf8427e',
      previousBlockHash: prevHash,
      notes,
    };

    newRecord.recordHash = calculateRecordHash(newRecord);
    state.chainOfCustody.push(newRecord);

    modal.classList.remove('active');
    renderChainOfCustodyTimeline();
    renderCertificate();
    showToast('Appended signed block to Chain-of-Custody!');
  });

  document.getElementById('btn-verify-coc-chain').addEventListener('click', () => {
    const res = verifyChainOfCustody(state.chainOfCustody);
    renderChainOfCustodyTimeline();
    if (res.isValid) {
      confetti({ particleCount: 60, spread: 60 });
      showToast('Chain-of-Custody verified 100% sound!');
    } else {
      showToast('Integrity failure detected in chain!', '⚠️');
    }
  });

  document.getElementById('btn-tamper-coc-simulate').addEventListener('click', () => {
    if (state.chainOfCustody.length >= 2) {
      // Intentionally alter Entry #2's custodian without recalculating the chained hashes
      state.chainOfCustody[1].custodian = 'UNAUTHORIZED_INTRUDER [BAD_ACTOR]';
      renderChainOfCustodyTimeline();
      showToast('Simulated malicious edit in Entry #2! Audit engine detects broken link.', '🚨');
    }
  });

  document.getElementById('btn-reset-coc-chain').addEventListener('click', () => {
    state.chainOfCustody = JSON.parse(JSON.stringify(initialChainOfCustody));
    renderChainOfCustodyTimeline();
    renderCertificate();
    showToast('Reset Chain-of-Custody to validated initial state.');
  });
}

// ----------------------------------------------------
// TAB 4: EVIDENCE VERIFICATION STATION
// ----------------------------------------------------
function initVerificationEvents() {
  const dropzone = document.getElementById('verify-dropzone');
  const fileInput = document.getElementById('verify-file-input');
  const rawContent = document.getElementById('verify-raw-content');
  const expectedHashInput = document.getElementById('verify-expected-hash');
  const expectedAlgoSelect = document.getElementById('verify-expected-algo');
  const btnExecute = document.getElementById('btn-execute-verification');

  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async (e) => {
    if (e.target.files.length > 0) {
      const f = e.target.files[0];
      const text = await f.text();
      rawContent.value = text;
      showToast(`Loaded ${f.name} into verification station.`);
    }
  });

  btnExecute.addEventListener('click', async () => {
    const content = rawContent.value;
    const expected = expectedHashInput.value.trim().toLowerCase();
    const algo = expectedAlgoSelect.value;

    if (!expected) {
      showToast('Please provide an expected baseline hash to audit.', '⚠️');
      return;
    }

    const hashObj = await computeAllHashes(content || '');
    let computed = '';
    if (algo === 'SHA-256') computed = hashObj.hashes.sha256;
    else if (algo === 'MD5') computed = hashObj.hashes.md5;
    else if (algo === 'SHA-1') computed = hashObj.hashes.sha1;
    else if (algo === 'SHA-512') computed = hashObj.hashes.sha512;
    else if (algo === 'CRC32') computed = hashObj.hashes.crc32;

    const isMatch = computed.toLowerCase() === expected.toLowerCase();

    const banner = document.getElementById('verdict-banner');
    const title = document.getElementById('verdict-title');
    const msg = document.getElementById('verdict-msg');
    const pill = document.getElementById('verdict-pill');

    document.getElementById('verdict-expected-val').textContent = expected;
    document.getElementById('verdict-computed-val').textContent = computed;

    if (isMatch) {
      banner.className = 'audit-alert-box pass';
      title.textContent = '✓ FORENSIC INTEGRITY VERIFIED (PASS)';
      msg.textContent = 'Working copy hash matches master acquisition baseline bit-for-bit. Evidence is authentic, untampered, and admissible.';
      pill.className = 'status-pill pass';
      pill.textContent = 'PASS';
      document.getElementById('verdict-match-status').innerHTML = '<span class="status-pill pass">100% BIT-FOR-BIT IDENTICAL</span>';
      document.getElementById('verdict-admissibility').innerHTML = '<span class="status-pill pass">ADMISSIBLE (SEC 65B READY)</span>';

      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      showToast('Evidence integrity audit PASSED!');
    } else {
      banner.className = 'audit-alert-box fail';
      title.textContent = '⚠️ INTEGRITY FAILURE DETECTED (FAIL)';
      msg.textContent = 'Cryptographic mismatch! Working copy does NOT match the acquisition baseline. Artifact was modified, corrupted, or tampered with.';
      pill.className = 'status-pill fail';
      pill.textContent = 'FAIL / TAMPERED';
      document.getElementById('verdict-match-status').innerHTML = '<span class="status-pill fail">INTEGRITY MISMATCH</span>';
      document.getElementById('verdict-admissibility').innerHTML = '<span class="status-pill fail">INADMISSIBLE (CHAIN COMPROMISED)</span>';

      showToast('Integrity failure! Tampering detected.', '🚨');
    }
  });

  // Presets
  document.getElementById('btn-load-sample-pass').addEventListener('click', () => {
    const sample = SampleEvidenceFiles[1]; // original procurement contract
    rawContent.value = sample.content;
    expectedHashInput.value = sample.baselineMD5;
    expectedAlgoSelect.value = 'MD5';
    btnExecute.click();
  });

  document.getElementById('btn-load-sample-fail').addEventListener('click', () => {
    const tamperedSample = SampleEvidenceFiles[2]; // tampered procurement contract
    const originalSample = SampleEvidenceFiles[1];
    rawContent.value = tamperedSample.content;
    expectedHashInput.value = originalSample.baselineMD5; // checking tampered against original baseline!
    expectedAlgoSelect.value = 'MD5';
    btnExecute.click();
  });
}

// ----------------------------------------------------
// TAB 5: RISK & INCIDENT ANALYTICS
// ----------------------------------------------------
function initAnalytics() {
  // Populate Table 1
  const t1 = document.querySelector('#table-algorithms tbody');
  if (t1) {
    t1.innerHTML = HashingAlgorithmsData.map(a => `
      <tr>
        <td><strong>${a.name}</strong><br><small class="text-dim">${a.family}</small></td>
        <td><code>${a.digestBits}-bit</code></td>
        <td>${a.typicalUse}</td>
        <td>${a.recommendedPractice}</td>
        <td><span class="status-pill ${a.riskScore >= 7 ? 'fail' : (a.riskScore >= 3 ? 'pass' : 'info')}">${a.riskScore}/10 Risk</span></td>
        <td><span class="badge ${a.badgeClass}">${a.status}</span></td>
      </tr>
    `).join('');
  }

  // Populate Table 2
  const t2 = document.querySelector('#table-risks tbody');
  if (t2) {
    t2.innerHTML = IntegrityRisksData.map(r => `
      <tr>
        <td><strong>${r.category}</strong></td>
        <td>${r.description}</td>
        <td><span style="color: #38bdf8;">✓ ${r.mitigation}</span></td>
      </tr>
    `).join('');
  }

  // Populate Observations
  const obsList = document.getElementById('list-observations');
  if (obsList) {
    obsList.innerHTML = KeyObservations.map(o => `<li style="margin-bottom: 0.5rem;">${o}</li>`).join('');
  }

  // Populate Recommendations
  const recList = document.getElementById('list-recommendations');
  if (recList) {
    recList.innerHTML = ForensicRecommendations.map(r => `<li style="margin-bottom: 0.5rem;">${r}</li>`).join('');
  }
}

// ----------------------------------------------------
// TAB 6: OFFICIAL FORENSIC CERTIFICATE
// ----------------------------------------------------
function renderCertificate() {
  const container = document.getElementById('certificate-output-container');
  if (!container) return;
  container.innerHTML = generateForensicCertificateHTML(state.currentEvidence, state.chainOfCustody);
}

function initCertificateEvents() {
  document.getElementById('btn-print-cert').addEventListener('click', () => {
    window.print();
  });

  document.getElementById('btn-download-cert-json').addEventListener('click', () => {
    const certData = {
      institution: ReportMetadata.institution,
      department: ReportMetadata.department,
      course: `${ReportMetadata.courseName} (${ReportMetadata.courseCode})`,
      investigator: `${ReportMetadata.studentName} [${ReportMetadata.studentRoll}]`,
      guide: `${ReportMetadata.guideName} (${ReportMetadata.guideDesignation})`,
      session: ReportMetadata.academicSession,
      timestampGenerated: new Date().toISOString(),
      evidence: state.currentEvidence,
      chainOfCustody: state.chainOfCustody,
      auditVerification: verifyChainOfCustody(state.chainOfCustody)
    };

    const blob = new Blob([JSON.stringify(certData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Forensic_Certificate_${state.currentEvidence.evidenceId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Forensic Certificate JSON downloaded!');
  });
}

// ----------------------------------------------------
// APPLICATION INITIALIZATION
// ----------------------------------------------------
window.addEventListener('DOMContentLoaded', async () => {
  initNavigation();
  initIngestionEvents();
  initAvalancheEvents();
  initChainOfCustodyEvents();
  initVerificationEvents();
  initAnalytics();
  initCertificateEvents();

  // Load default sample
  const defaultSample = SampleEvidenceFiles[0];
  document.getElementById('raw-evidence-text').value = defaultSample.content;
  await processEvidenceInput(defaultSample.content, defaultSample.name, defaultSample.type);

  // Initialize Avalanche lab with sample
  const origText = document.getElementById('avalanche-original-text');
  const tamperedText = document.getElementById('avalanche-tampered-text');
  origText.value = defaultSample.content;
  tamperedText.value = TamperPresets.flipSingleBit(defaultSample.content);
  await updateAvalancheAnalysis();

  // Render initial timeline
  renderChainOfCustodyTimeline();
  renderCertificate();
});
