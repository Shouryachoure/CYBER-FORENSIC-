import { Chart, registerables } from 'chart.js';
import { Figure2Data, Figure3Data } from '../data/reportData.js';

Chart.register(...registerables);

let figure2ChartInstance = null;
let figure3ChartInstance = null;

export function renderReportCharts() {
  const ctxFig2 = document.getElementById('chart-figure-2');
  const ctxFig3 = document.getElementById('chart-figure-3');

  if (ctxFig2) {
    if (figure2ChartInstance) figure2ChartInstance.destroy();
    figure2ChartInstance = new Chart(ctxFig2, {
      type: 'bar',
      data: {
        labels: Figure2Data.labels,
        datasets: [{
          label: 'Relative Integrity-Failure Risk (Scale 1-10)',
          data: Figure2Data.scores,
          backgroundColor: [
            'rgba(239, 68, 68, 0.75)',   // CRC32 - High Risk
            'rgba(249, 115, 22, 0.75)',  // MD5 - High Risk
            'rgba(234, 179, 8, 0.75)',   // SHA-1 - Medium-High
            'rgba(16, 185, 129, 0.85)',  // SHA-256 - Recommended
            'rgba(6, 182, 212, 0.85)',   // SHA-512 - High Assurance
            'rgba(99, 102, 241, 0.85)'   // SHA-3 - Next Gen
          ],
          borderColor: [
            '#ef4444',
            '#f97316',
            '#eab308',
            '#10b981',
            '#06b6d4',
            '#6366f1'
          ],
          borderWidth: 2,
          borderRadius: 8,
          barThickness: 24,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#111827',
            titleColor: '#f3f4f6',
            bodyColor: '#9ca3af',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: (context) => {
                const score = context.raw;
                const algorithm = context.label;
                let desc = '';
                if (algorithm === 'CRC32') desc = 'CRITICAL: Non-cryptographic; zero collision resistance';
                else if (algorithm === 'MD5') desc = 'SEVERE: Cryptographically broken; collision attack in seconds';
                else if (algorithm === 'SHA-1') desc = 'HIGH: Deprecated; SHAttered collision demonstrated';
                else if (algorithm === 'SHA-256') desc = 'ROBUST: NIST recommended standard for modern forensics';
                else if (algorithm === 'SHA-512') desc = 'MAXIMUM: High-assurance standard for long-term retention';
                else if (algorithm === 'SHA-3') desc = 'NEXT-GEN: Keccak sponge structure, quantum-resistant margin';
                return [`Risk Score: ${score}/10`, desc];
              }
            }
          }
        },
        scales: {
          x: {
            min: 0,
            max: 10,
            grid: {
              color: 'rgba(255, 255, 255, 0.06)'
            },
            ticks: {
              color: '#94a3b8',
              stepSize: 2
            },
            title: {
              display: true,
              text: 'Relative Integrity-Failure Risk (Illustrative Scale 1-10)',
              color: '#94a3b8'
            }
          },
          y: {
            grid: {
              display: false
            },
            ticks: {
              color: '#f8fafc',
              font: {
                weight: 'bold',
                family: 'JetBrains Mono, monospace'
              }
            }
          }
        }
      }
    });
  }

  if (ctxFig3) {
    if (figure3ChartInstance) figure3ChartInstance.destroy();
    figure3ChartInstance = new Chart(ctxFig3, {
      type: 'doughnut',
      data: {
        labels: Figure3Data.categories.map(c => c.label),
        datasets: [{
          data: Figure3Data.categories.map(c => c.percentage),
          backgroundColor: [
            '#3b82f6',
            '#06b6d4',
            '#10b981',
            '#f59e0b',
            '#8b5cf6'
          ],
          borderColor: '#0f172a',
          borderWidth: 3,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#cbd5e1',
              padding: 16,
              font: {
                size: 11
              },
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: '#111827',
            titleColor: '#f3f4f6',
            bodyColor: '#9ca3af',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: (context) => ` ${context.label}: ${context.raw}% of forensic incidents`
            }
          }
        },
        cutout: '62%'
      }
    });
  }
}
