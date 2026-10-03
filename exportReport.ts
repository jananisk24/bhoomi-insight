import { Project } from '../types';

/**
 * Exports a list of projects as a structured, RFC-4180 compliant CSV file.
 */
export function exportProjectsCSV(projects: Project[], filename: string = 'land_acquisition_delay_report.csv') {
  const headers = [
    'Project ID',
    'Project Name',
    'State',
    'District',
    'Project Type',
    'Land Area (Acres)',
    'Affected Families (PAFs)',
    'Budget (Cr INR)',
    'Risk Score (%)',
    'Risk Category',
    'Current Status',
    'Compensation Status',
    'Legal Dispute',
    'Approval Status',
    'Rehabilitation Status',
    'Estimated Delay (Months)',
    'Date Registered'
  ];

  const escapeCSV = (val: string | number | boolean | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = projects.map((p) => [
    escapeCSV(p.id),
    escapeCSV(p.name),
    escapeCSV(p.state),
    escapeCSV(p.district),
    escapeCSV(p.projectType),
    escapeCSV(p.landArea),
    escapeCSV(p.affectedFamilies),
    escapeCSV(p.budgetCr),
    escapeCSV(`${p.riskScore}%`),
    escapeCSV(p.riskCategory),
    escapeCSV(p.status),
    escapeCSV(p.compensationStatus),
    escapeCSV(p.legalDispute ? 'Yes (Court Injunction)' : 'No'),
    escapeCSV(p.approvalStatus),
    escapeCSV(p.rehabilitationStatus),
    escapeCSV(p.estimatedDelayMonths),
    escapeCSV(p.createdDate)
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates and downloads an Executive Assessment Brief report as CSV/Text.
 */
export function exportExecutiveAssessment(
  projects: Project[], 
  stateFilter: string = 'All States',
  districtFilter: string = 'All Districts'
) {
  const total = projects.length;
  const high = projects.filter((p) => p.riskCategory === 'High').length;
  const med = projects.filter((p) => p.riskCategory === 'Medium').length;
  const low = projects.filter((p) => p.riskCategory === 'Low').length;
  const totalAcres = projects.reduce((acc, p) => acc + p.landArea, 0);
  const totalBudget = projects.reduce((acc, p) => acc + p.budgetCr, 0);
  const totalPAFs = projects.reduce((acc, p) => acc + p.affectedFamilies, 0);
  const disputes = projects.filter((p) => p.legalDispute).length;
  const avgRisk = total > 0 ? Math.round(projects.reduce((acc, p) => acc + p.riskScore, 0) / total) : 0;

  const content = [
    'EXECUTIVE SUMMARY REPORT: PREDICTIVE ANALYTICS FOR LAND ACQUISITION DELAYS',
    `Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
    `Jurisdiction Scope: State: ${stateFilter} | District: ${districtFilter}`,
    '=========================================================================',
    '',
    'KEY MONITORING INDICATORS:',
    `Total Infrastructure Parcels Monitored: ${total}`,
    `High Risk (Critical Delay Probability > 70%): ${high} (${total > 0 ? Math.round((high/total)*100) : 0}%)`,
    `Medium Risk (Moderate Observation 40-69%): ${med} (${total > 0 ? Math.round((med/total)*100) : 0}%)`,
    `Low Risk (Scheduled Track < 40%): ${low} (${total > 0 ? Math.round((low/total)*100) : 0}%)`,
    `Average Acquisition Delay Risk: ${avgRisk}%`,
    `Total Land Area Tracked: ${totalAcres.toLocaleString()} Acres`,
    `Total Capital at Risk: Rs. ${totalBudget.toLocaleString()} Crores`,
    `Total Project Affected Families (PAFs): ${totalPAFs.toLocaleString()}`,
    `Parcels with Active Court/Litigation Injunctions: ${disputes}`,
    '',
    '=========================================================================',
    'CRITICAL BOTTLENECK PARCELS (HIGH RISK REQUIRING IMMEDIATE INTERVENTION):',
    ...projects
      .filter((p) => p.riskCategory === 'High')
      .map((p, idx) => 
        `${idx + 1}. [${p.id}] ${p.name} | ${p.district}, ${p.state} | Risk: ${p.riskScore}% | Est. Delay: ${p.estimatedDelayMonths} mos | Budget: Rs. ${p.budgetCr} Cr\n` +
        `   Bottlenecks: Compensation: ${p.compensationStatus} | Legal Dispute: ${p.legalDispute ? 'Yes' : 'No'} | Clearances: ${p.approvalStatus}\n` +
        `   Recommended Actions:\n` +
        p.recommendedActions.map((act) => `     - ${act}`).join('\n')
      ),
    '',
    '=========================================================================',
    'Statutory Compliance: Real-time alignment with RFCTLARR Act 2013 provisions.'
  ].join('\n');

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `executive_delay_audit_${stateFilter.replace(/\s+/g, '_').toLowerCase()}.txt`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Triggers a clean print dialog for an individual project's predictive audit report.
 */
export function printProjectAudit(project: Project) {
  const printWindow = window.open('', '_blank', 'width=850,height=900');
  if (!printWindow) {
    // If popups are blocked, download text report instead
    exportSingleProjectReportText(project);
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Land Acquisition Delay Audit Report - ${project.id}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 32px; color: #1e293b; line-height: 1.5; }
          .header { border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; }
          .title { font-size: 20px; font-weight: bold; color: #0f172a; margin: 0; }
          .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
          .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: bold; }
          .badge-high { background: #fee2e2; color: #991b1b; }
          .badge-medium { background: #fef3c7; color: #92400e; }
          .badge-low { background: #d1fae5; color: #065f46; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
          .card-title { font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; }
          .card-value { font-size: 16px; font-weight: bold; color: #0f172a; margin-top: 4px; }
          .factors { margin-top: 20px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
          .bar-row { margin-bottom: 12px; }
          .bar-label { display: flex; justify-content: space-between; font-size: 12px; font-weight: 600; margin-bottom: 4px; }
          .bar-bg { background: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden; }
          .bar-fill { height: 100%; border-radius: 4px; }
          .actions-list { margin-top: 16px; padding-left: 20px; font-size: 13px; }
          .footer { margin-top: 36px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <div style="text-align: right; margin-bottom: 12px;">
          <button onclick="window.print()" style="padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px;">Print / Save as PDF</button>
        </div>
        <div class="header">
          <div class="title">Predictive Land Acquisition Delay Audit Report</div>
          <div class="subtitle">Decision Support System • Generated on ${new Date().toLocaleDateString()}</div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h2 style="margin: 0; font-size: 16px; color: #1e293b;">${project.name}</h2>
            <div style="font-size: 12px; color: #64748b; font-family: monospace;">Parcel ID: ${project.id} | ${project.projectType}</div>
          </div>
          <span class="badge ${project.riskCategory === 'High' ? 'badge-high' : project.riskCategory === 'Medium' ? 'badge-medium' : 'badge-low'}">
            ${project.riskCategory.toUpperCase()} RISK (${project.riskScore}%)
          </span>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-title">Jurisdiction & Location</div>
            <div class="card-value">${project.district}, ${project.state}</div>
          </div>
          <div class="card">
            <div class="card-title">Land Area & Affected Families</div>
            <div class="card-value">${project.landArea} Acres (${project.affectedFamilies} PAFs)</div>
          </div>
          <div class="card">
            <div class="card-title">Project Budget</div>
            <div class="card-value">₹ ${project.budgetCr} Crores</div>
          </div>
          <div class="card">
            <div class="card-title">Forecasted Delay Duration</div>
            <div class="card-value" style="color: ${project.estimatedDelayMonths > 6 ? '#b91c1c' : '#047857'}">
              ~${project.estimatedDelayMonths} Months Delay
            </div>
          </div>
        </div>

        <div class="factors">
          <div style="font-size: 13px; font-weight: bold; margin-bottom: 12px;">QUANTITATIVE DELAY BOTTLENECK CONTRIBUTIONS</div>
          <div class="bar-row">
            <div class="bar-label"><span>Compensation Disbursement Pendency</span><span>${project.delayFactors.compensationPending}%</span></div>
            <div class="bar-bg"><div class="bar-fill" style="width: ${project.delayFactors.compensationPending}%; background: #ef4444;"></div></div>
          </div>
          <div class="bar-row">
            <div class="bar-label"><span>Court Litigation & Title Injunctions</span><span>${project.delayFactors.legalDispute}%</span></div>
            <div class="bar-bg"><div class="bar-fill" style="width: ${project.delayFactors.legalDispute}%; background: #f97316;"></div></div>
          </div>
          <div class="bar-row">
            <div class="bar-label"><span>Statutory & Environmental Clearances</span><span>${project.delayFactors.approvalDelay}%</span></div>
            <div class="bar-bg"><div class="bar-fill" style="width: ${project.delayFactors.approvalDelay}%; background: #eab308;"></div></div>
          </div>
          <div class="bar-row">
            <div class="bar-label"><span>Rehabilitation & Resettlement Gap</span><span>${project.delayFactors.rehabilitationGap}%</span></div>
            <div class="bar-bg"><div class="bar-fill" style="width: ${project.delayFactors.rehabilitationGap}%; background: #3b82f6;"></div></div>
          </div>
        </div>

        <div style="margin-top: 20px;">
          <div style="font-size: 13px; font-weight: bold; color: #1e293b;">STATUTORY RECOMMENDED ADMINISTRATIVE ACTIONS</div>
          <ul class="actions-list">
            ${project.recommendedActions.map((a) => `<li>${a}</li>`).join('')}
          </ul>
        </div>

        <div class="footer">
          Land Acquisition Early Warning System • RFCTLARR 2013 Governance Protocol
        </div>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Downloads a structured text report for a single project.
 */
export function exportSingleProjectReportText(project: Project) {
  const content = [
    `LAND ACQUISITION DELAY AUDIT REPORT: ${project.id}`,
    `Project: ${project.name}`,
    `Location: ${project.district}, ${project.state}`,
    `Project Type: ${project.projectType}`,
    `Area: ${project.landArea} Acres | PAFs: ${project.affectedFamilies} Families | Budget: Rs. ${project.budgetCr} Cr`,
    `Delay Risk Score: ${project.riskScore}% (${project.riskCategory} Risk)`,
    `Forecasted Delay: ~${project.estimatedDelayMonths} Months`,
    `Current Stage Status: ${project.status}`,
    '-------------------------------------------------------------------------',
    'DELAY FACTOR BREAKDOWN:',
    `1. Compensation Disbursement Pendency: ${project.delayFactors.compensationPending}% (Status: ${project.compensationStatus})`,
    `2. Court Litigation & Stay Risk: ${project.delayFactors.legalDispute}% (Active Injunction: ${project.legalDispute ? 'Yes' : 'No'})`,
    `3. Statutory Clearances & Approvals: ${project.delayFactors.approvalDelay}% (Status: ${project.approvalStatus})`,
    `4. R&R Resettlement Colony Status: ${project.delayFactors.rehabilitationGap}% (Status: ${project.rehabilitationStatus})`,
    '-------------------------------------------------------------------------',
    'STATUTORY RECOMMENDED ACTIONS:',
    ...project.recommendedActions.map((act, i) => `${i + 1}. ${act}`),
    '-------------------------------------------------------------------------',
    `Report Generated: ${new Date().toISOString()}`
  ].join('\n');

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${project.id}_delay_audit.txt`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
