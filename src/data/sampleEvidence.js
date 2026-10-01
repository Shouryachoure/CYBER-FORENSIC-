export const SampleEvidenceFiles = [
  {
    id: 'sample-log',
    name: 'server_auth.log',
    type: 'Security Event Log',
    description: 'Linux secure authentication log capturing an unauthorized SSH privilege escalation attempt.',
    content: `Oct  1 02:14:22 sec-srv-01 sshd[19420]: Failed password for invalid user admin from 198.51.100.42 port 52194 ssh2
Oct  1 02:14:25 sec-srv-01 sshd[19420]: Failed password for invalid user admin from 198.51.100.42 port 52194 ssh2
Oct  1 02:14:28 sec-srv-01 sshd[19422]: Accepted password for deployer from 198.51.100.42 port 52200 ssh2
Oct  1 02:14:30 sec-srv-01 sudo: deployer : TTY=pts/1 ; PWD=/home/deployer ; USER=root ; COMMAND=/bin/bash
Oct  1 02:15:02 sec-srv-01 kernel: [48921.102] Audit alert: unauthorized write to /etc/shadow attempted by PID 19445`,
    baselineMD5: '5b1dc0cbbff31a89c3bc82136052be19',
  },
  {
    id: 'sample-contract',
    name: 'procurement_contract_v4.txt',
    type: 'Financial & Legal Artifact',
    description: 'Signed institutional procurement agreement under dispute for unauthorized clause modification.',
    content: `SBJITMR INSTITUTIONAL RESEARCH PROCUREMENT AGREEMENT #2026-N-704
PARTIES: S. B. Jain Institute of Technology, Management and Research & CyberTech Corp.
DATE: 2026-09-15
STIPULATION 4.2: The total approved sum for digital forensic hardware and software licensing
shall be exact INR 1,500,000 (Fifteen Lakhs Only).
AUTHORIZED SIGNATORY: Shourya Choure [CM23049]
VERIFIED BY: Course Incharge, CSE (AI&ML)`,
    baselineMD5: '7d32a93910f5456f91d8487771e84dfa',
  },
  {
    id: 'sample-tampered-contract',
    name: 'procurement_contract_v4_TAMPERED.txt',
    type: 'Tampered Evidence Comparison',
    description: 'Fraudulent modified version where $1,500,000 was subtly altered to INR 2,500,000 to commit fraud.',
    content: `SBJITMR INSTITUTIONAL RESEARCH PROCUREMENT AGREEMENT #2026-N-704
PARTIES: S. B. Jain Institute of Technology, Management and Research & CyberTech Corp.
DATE: 2026-09-15
STIPULATION 4.2: The total approved sum for digital forensic hardware and software licensing
shall be exact INR 2,500,000 (Twenty Five Lakhs Only).
AUTHORIZED SIGNATORY: Shourya Choure [CM23049]
VERIFIED BY: Course Incharge, CSE (AI&ML)`,
    baselineMD5: 'f87d46317bc2d44faea32631525e9e04',
  },
  {
    id: 'sample-c2',
    name: 'threat_c2_telemetry.json',
    type: 'Malware Forensics Telemetry',
    description: 'Extracted C2 beaconing json configuration from memory dump of compromised workstation.',
    content: JSON.stringify({
      campaign: 'OPERATION-SHADOW-BYTE',
      c2_nodes: ['198.51.100.23:8443', '203.0.113.88:443'],
      exfiltration_protocol: 'DNS-Tunneling-v2',
      target_subnets: ['10.14.0.0/16', '172.20.10.0/24'],
      timestamp_epoch: 1790852000,
      forensic_seizure_tag: 'SBJITMR-CFI-2026-EXTRACT'
    }, null, 2),
    baselineMD5: '',
  }
];
