# ForensiGuard: Digital Evidence Cryptographic Integrity & Chain-of-Custody Verification Suite

**Problem-Based Learning Project (PBL TAE-I)**  
**Course:** Cyber Forensics and Investigation (`N-PECCM704T`)  
**Department:** Department of Emerging Technologies CSE (Artificial Intelligence & Machine Learning)  
**Institution:** S. B. Jain Institute of Technology, Management and Research, Nagpur  
**Student:** Shourya Choure [CM23049]  
**Course Incharge & Guide:** Ms. Sweta Bokade (Assistant Professor)  
**Academic Session:** 2026–2027 (ODD)  

---

## 🎯 Project Aim & Objectives
This project translates the research report into a fully working, state-of-the-art forensic investigation workstation. It addresses the fundamental forensic requirement: **proving, beyond reasonable doubt, that a piece of digital evidence is bit-for-bit identical to its state at collection**.

### Key Modules Implemented:
1. **Multi-Algorithm Evidence Ingestion & Hashing Engine**:
   - Computes **SHA-256 (NIST FIPS 180-4)**, **MD5 (RFC 1321)**, **SHA-1**, **SHA-512**, **SHA-3 (Keccak-256)**, and **CRC32**.
   - Implements the **Dual-Hash Forensic Standard (MD5 + SHA-256)** recommended in forensic practice.
   - Calculates file size, ingestion latency, and **Shannon Entropy** to detect encryption or hidden payloads.
   - 1-click downloads `.sha256` forensic manifests.

2. **Forensic Avalanche Effect & Tamper Detection Laboratory**:
   - Demonstrates the mathematical principle: *altering even a single bit in the evidence produces a completely changed digest*.
   - Live bit-level tamper simulations:
     - ⚡ Flip 1 Single Bit (Bitwise XOR)
     - 🔀 Modify 1 Byte
     - ␣ Append Subtle Trailing Whitespace
     - ⏱️ Simulate Mounting Without Hardware Write-Blocker (Timestamp Touch)
     - 🚫 Inject Null Byte (`\0`)
   - Computes **Hamming Distance** and **Avalanche Diffusion Rate** (optimal ~50%).
   - Interactive **256-cell visual bit matrix / heatmap** highlighting all changed bits in red.

3. **Tamper-Evident Cryptographic Chain-of-Custody (CoC)**:
   - Solves the report's critical observation: *"A hash value is only as trustworthy as the record that stores it; an unsecured hash log can itself become a point of tampering."*
   - Blockchain-grade ledger where each custody handover (Seizure ➔ Storage Locker ➔ Lab Imaging ➔ Analysis ➔ Court) stores `previousBlockHash` and signs the block with `SHA-256(prev_hash + data)`.
   - Includes interactive **"Simulate Ledger Tampering"** demonstration: modifying any past record instantly breaks the cryptographic chain and flags the breach in red!

4. **Forensic Verification Audit Station**:
   - Compares working evidence copies against master baseline hashes.
   - Immediate **PASS / FAIL** audit verdicts with Section 65B court admissibility declarations.

5. **Risk & Incident Analytics (Interactive Figures 2 & 3)**:
   - Recreates **Figure 2**: *Illustrative Integrity-Failure Risk by Hashing Algorithm (1–10 scale)* using Chart.js with vulnerability tooltips.
   - Recreates **Figure 3**: *Distribution of Evidence-Integrity Incident Categories* (Legacy algorithms 28%, CoC gaps 24%, evidence mishandling 20%, tool misconfiguration 16%, skipped verification 12%).
   - Interactive data tables for **Table 1** (Algorithm vs Forensic Practice) and **Table 2** (Integrity Risks).

6. **Official Forensic Certificate Generator (Section 65B & ISO/IEC 27037)**:
   - Generates a court-admissible electronic evidence certificate pre-filled with institutional details, student roll number, guide designation, timestamps, and signature blocks.
   - Ready for print / PDF export (`window.print()`) or JSON manifest download.

---

## 🚀 Running the Project Locally

The application runs on Vite with zero external runtime server requirements:

```bash
# 1. Install dependencies
npm install

# 2. Run development server
npm run dev

# Access the application in your browser at:
# http://localhost:5173/
```

### Running Automated Test Suite
To verify all cryptographic hashing, avalanche calculations, and ledger audit algorithms:
```bash
node test/forensic_suite.test.js
```
