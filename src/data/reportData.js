export const ReportMetadata = {
  title: 'Digital Evidence Cryptographic Hash Verification & Chain-of-Custody System',
  reportType: 'Problem-Based Learning Report For “TAE-I”',
  courseName: 'Cyber Forensics and Investigation',
  courseCode: 'N-PECCM704T',
  department: 'Department of Emerging Technologies CSE (Artificial Intelligence & Machine Learning)',
  institution: 'S. B. Jain Institute of Technology, Management and Research, Nagpur',
  affiliation: 'An Autonomous Institute Affiliated to R. T. M. Nagpur University',
  studentName: 'Shourya Choure',
  studentRoll: 'CM23049',
  guideName: 'Ms. Sweta Bokade',
  guideDesignation: 'Assistant Professor, Course Incharge',
  academicSession: '2026-2027 (ODD)',
  evaluationCriteria: [
    { label: 'Faculty Assessment', max: 4 },
    { label: 'Submission', max: 3 },
    { label: 'Presentation / Viva / Video', max: 3 },
  ]
};

export const HashingAlgorithmsData = [
  {
    name: 'CRC32',
    family: 'Cyclic Redundancy Check',
    digestBits: 32,
    digestChars: 8,
    isCryptographic: false,
    typicalUse: 'Basic transmission / storage integrity check',
    recommendedPractice: 'Not a cryptographic hash; never rely on it for evidentiary integrity.',
    riskScore: 9,
    status: 'Forbidden for Forensics',
    badgeClass: 'danger',
    vulnerabilityNote: 'Trivially reverse-engineered; zero pre-image resistance, instant intentional collisions.'
  },
  {
    name: 'MD5',
    family: 'Message Digest (Rivest)',
    digestBits: 128,
    digestChars: 32,
    isCryptographic: true,
    typicalUse: 'Legacy checksum / quick file verification',
    recommendedPractice: 'Use only as a secondary cross-check; not sufficient alone for new evidentiary hashing.',
    riskScore: 8,
    status: 'Deprecated / Secondary Only',
    badgeClass: 'danger',
    vulnerabilityNote: 'Broken collision resistance (Wang et al. attack, Flame malware signed MD5 rogue certificate).'
  },
  {
    name: 'SHA-1',
    family: 'Secure Hash Algorithm 1',
    digestBits: 160,
    digestChars: 40,
    isCryptographic: true,
    typicalUse: 'Default in many older forensic imaging tools',
    recommendedPractice: 'Migrate to SHA-256 or higher; avoid as the sole hash for new cases.',
    riskScore: 7,
    status: 'Phasing Out',
    badgeClass: 'warning',
    vulnerabilityNote: 'SHAttered attack (2017) demonstrated practical identical SHA-1 hash for two different PDFs.'
  },
  {
    name: 'SHA-256',
    family: 'SHA-2 (NIST FIPS 180-4)',
    digestBits: 256,
    digestChars: 64,
    isCryptographic: true,
    typicalUse: 'Standard evidence-acquisition hash (SHA-2 family)',
    recommendedPractice: 'Use as the primary algorithm for current digital forensics investigations.',
    riskScore: 3,
    status: 'Forensic Gold Standard',
    badgeClass: 'success',
    vulnerabilityNote: 'Cryptographically robust; no known collision attacks; universally accepted in legal jurisdictions.'
  },
  {
    name: 'SHA-512',
    family: 'SHA-2 (NIST FIPS 180-4)',
    digestBits: 512,
    digestChars: 128,
    isCryptographic: true,
    typicalUse: 'High-assurance verification for sensitive evidence',
    recommendedPractice: 'Use for high-value or long-retention evidentiary data sets.',
    riskScore: 2,
    status: 'High Assurance Standard',
    badgeClass: 'success',
    vulnerabilityNote: 'Extremely high bit security (256-bit collision security), optimized for 64-bit architectures.'
  },
  {
    name: 'SHA-3 (Keccak)',
    family: 'SHA-3 (NIST FIPS 202)',
    digestBits: 256,
    digestChars: 64,
    isCryptographic: true,
    typicalUse: 'Emerging forensic standard, structurally independent of SHA-2',
    recommendedPractice: 'Adopt where supporting tools are available.',
    riskScore: 1,
    status: 'Next-Gen Standard',
    badgeClass: 'success',
    vulnerabilityNote: 'Sponge construction; immune to length-extension attacks and mathematical weaknesses of Merkle-Damgård.'
  }
];

export const IntegrityRisksData = [
  {
    id: 'risk-1',
    category: 'Evidence Tampering',
    description: 'Undetected modification of evidence during handling or storage undermines the validity of any resulting analysis.',
    mitigation: 'Implement mandatory bit-for-bit SHA-256 baseline hashing at seizure and re-verify at every stage transition.'
  },
  {
    id: 'risk-2',
    category: 'Hash Collision Exploitation',
    description: 'Weak algorithms such as MD5 or SHA-1 can allow two different files to be crafted with matching hash values.',
    mitigation: 'Enforce dual-hashing (MD5 + SHA-256) during transitional phases and mandate SHA-256/SHA-512 as primary.'
  },
  {
    id: 'risk-3',
    category: 'Chain-of-Custody Gaps',
    description: 'Missing or inconsistent hash records weaken the provable history of who accessed evidence and when.',
    mitigation: 'Use immutable, cryptographic hash-chained audit ledgers where each custody log signs the previous entry.'
  },
  {
    id: 'risk-4',
    category: 'Tool / Process Error',
    description: 'Misconfigured hashing tools or rushed procedures can produce false “match” results that hide real changes.',
    mitigation: 'Standardize forensic scripts and validate imaging software against NIST Computer Forensic Tool Testing (CFTT).'
  },
  {
    id: 'risk-5',
    category: 'Legal Inadmissibility',
    description: 'Evidence lacking verifiable, well-documented hash values may be challenged or excluded in court.',
    mitigation: 'Produce standardized ISO/IEC 27037 & Section 65B forensic verification certificates with explicit timestamp logs.'
  },
  {
    id: 'risk-6',
    category: 'Data Corruption Misdiagnosis',
    description: 'Poor hashing practice can fail to distinguish genuine tampering from benign transmission or storage errors.',
    mitigation: 'Pair cryptographic digests with hardware-level SMART diagnostics and multi-tier parity checksums.'
  }
];

export const Figure2Data = {
  title: 'Figure 2: Illustrative Integrity-Failure Risk by Hashing Algorithm (Relative Scale 1-10)',
  labels: ['CRC32', 'MD5', 'SHA-1', 'SHA-256', 'SHA-512', 'SHA-3'],
  scores: [9, 8, 7, 3, 2, 1],
  colors: ['#ef4444', '#f97316', '#eab308', '#10b981', '#06b6d4', '#6366f1']
};

export const Figure3Data = {
  title: 'Figure 3: Illustrative Distribution of Evidence-Integrity Incident Categories',
  categories: [
    { label: 'Legacy / Weak Algorithm Use', percentage: 28, color: '#3b82f6' },
    { label: 'Chain-of-Custody Documentation Gaps', percentage: 24, color: '#06b6d4' },
    { label: 'Evidence Mishandling (Transfer / Storage)', percentage: 20, color: '#10b981' },
    { label: 'Tool Misconfiguration', percentage: 16, color: '#f59e0b' },
    { label: 'Verification Skipped Under Time Pressure', percentage: 12, color: '#8b5cf6' }
  ]
};

export const KeyObservations = [
  'Investigators often continue using MD5 or SHA-1 by default because older tools and training materials have not been updated.',
  'A hash value is only as trustworthy as the record that stores it; an unsecured hash log can itself become a point of tampering.',
  'Dual-hashing (e.g., pairing MD5 with SHA-256) remains a common practical safeguard during transitions to stronger algorithms.',
  'Minor, well-intentioned handling errors, such as opening a file without a write-blocker, can alter metadata and change its hash.',
  'Consistent, stage-by-stage hash documentation is often the weakest link in smaller or less formal investigations.',
  'Clear procedures and basic algorithm literacy significantly reduce integrity disputes without slowing down fieldwork.',
  'Hashing standards require ongoing review, since growing computational power steadily increases the feasibility of collision attacks.'
];

export const ForensicRecommendations = [
  'Use a strong, currently recommended hash algorithm (SHA-256 or higher) as the primary standard for new evidence.',
  'Avoid relying on MD5 or SHA-1 alone; retain them only as a secondary cross-check for continuity with legacy case records.',
  'Generate and record the hash value immediately upon evidence acquisition, before any analysis begins.',
  'Use write-blockers during acquisition to prevent inadvertent modification of source media.',
  'Store hash records securely and separately from the evidence itself so both cannot be altered together.',
  'Re-verify hash values at every major stage of handling: acquisition, storage, analysis, and presentation.',
  'Maintain detailed chain-of-custody logs pairing each hash value with a timestamp and the handler\'s identity.',
  'Conduct regular training so investigators understand what hash algorithms do and do not guarantee.'
];
