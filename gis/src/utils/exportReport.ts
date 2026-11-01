import type { Project } from '../types';

const csvCell = (value: string | number | boolean | null | undefined): string => {
  if (value === null || value === undefined) return '""';

  const text = String(value);
  const spreadsheetSafe =
    typeof value === 'string' && /^[\u0000-\u0020]*[=+\-@]/.test(text)
      ? `'${text}`
      : text;
  return `"${spreadsheetSafe.replace(/"/g, '""')}"`;
};

const riskScoreText = (score: number | null): string =>
  score !== null && Number.isFinite(score) && score >= 0 && score <= 100
    ? score.toFixed(2)
    : '';

const safeFilename = (filename: string): string =>
  filename
    .replace(/[<>:"\/\\|?*\u0000-\u001f]/g, '_')
    .replace(/^\.+/, '')
    .slice(0, 120) || 'land_acquisition_report.txt';

const downloadText = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = safeFilename(filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

export const buildProjectsCsv = (projects: Project[]): string => {
  const headers = [
    'Project ID',
    'Project Name',
    'State',
    'District',
    'Project Type',
    'Land Area (Acres)',
    'Affected Families (PAFs)',
    'Budget (Crores)',
    'Risk Score (%)',
    'Risk Category',
    'Current Status',
    'Compensation Status',
    'Legal Dispute',
    'Approval Status',
    'Rehabilitation Status',
    'Estimated Delay (Months)',
    'Date Registered',
  ];

  const rows = projects.map((project) =>
    [
      project.id,
      project.name,
      project.state,
      project.district,
      project.projectType,
      project.landArea,
      project.affectedFamilies,
      project.budgetCr,
      riskScoreText(project.riskScore),
      project.riskCategory,
      project.status,
      project.compensationStatus,
      project.legalDispute ? 'Yes' : 'No',
      project.approvalStatus,
      project.rehabilitationStatus,
      project.estimatedDelayMonths,
      project.createdDate,
    ]
      .map(csvCell)
      .join(',')
  );

  return [headers.map(csvCell).join(','), ...rows].join('\r\n');
};

export const exportProjectsCSV = (
  projects: Project[],
  filename = 'land_acquisition_delay_report.csv'
) => {
  downloadText(buildProjectsCsv(projects), filename, 'text/csv');
};

export const buildExecutiveAssessment = (
  projects: Project[],
  stateFilter = 'All States',
  districtFilter = 'All Districts',
  generatedAt = new Date()
): string => {
  const predictedProjects = projects.filter(
    (project) =>
      project.riskScore !== null &&
      Number.isFinite(project.riskScore) &&
      project.riskScore >= 0 &&
      project.riskScore <= 100
  );
  const riskAverage =
    predictedProjects.length > 0
      ? (
          predictedProjects.reduce(
            (total, project) => total + (project.riskScore ?? 0),
            0
          ) / predictedProjects.length
        ).toFixed(2)
      : 'N/A';
  const count = (category: Project['riskCategory']) =>
    projects.filter((project) => project.riskCategory === category).length;
  const totalAcres = projects.reduce(
    (total, project) =>
      total +
      (Number.isFinite(project.landArea) && project.landArea > 0
        ? project.landArea
        : 0),
    0
  );
  const affectedFamilies = projects.reduce(
    (total, project) =>
      total +
      (Number.isFinite(project.affectedFamilies) && project.affectedFamilies > 0
        ? project.affectedFamilies
        : 0),
    0
  );

  return [
    'EXECUTIVE SUMMARY: LAND ACQUISITION DELAY MONITORING',
    `Generated: ${generatedAt.toISOString()}`,
    `Jurisdiction: ${stateFilter} / ${districtFilter}`,
    '',
    `Projects in scope: ${projects.length}`,
    `Projects with saved model probabilities: ${predictedProjects.length}`,
    `Projects without a valid saved probability: ${projects.length - predictedProjects.length}`,
    `High risk: ${count('High')}`,
    `Medium risk: ${count('Medium')}`,
    `Low risk: ${count('Low')}`,
    `Not predicted: ${count('Not Predicted')}`,
    `Average saved delay probability: ${riskAverage}${riskAverage === 'N/A' ? '' : '%'}`,
    `Land area recorded: ${totalAcres.toFixed(2)} acres`,
    `Affected families recorded: ${affectedFamilies.toLocaleString()}`,
    `Projects with legal disputes: ${projects.filter((project) => project.legalDispute).length}`,
    '',
    'High-risk projects:',
    ...projects
      .filter((project) => project.riskCategory === 'High')
      .map(
        (project) => {
          const score = riskScoreText(project.riskScore);
          return `- ${project.id}: ${project.name} (${project.district}, ${project.state}); saved risk ${score ? `${score}%` : 'N/A'}`;
        }
      ),
    '',
    'Risk percentages are saved model probabilities. Delay duration is not estimated by the model.',
  ].join('\n');
};

export const exportExecutiveAssessment = (
  projects: Project[],
  stateFilter = 'All States',
  districtFilter = 'All Districts'
) => {
  const scope = `${stateFilter}_${districtFilter}`
    .toLowerCase()
    .replace(/\s+/g, '_');
  downloadText(
    buildExecutiveAssessment(projects, stateFilter, districtFilter),
    `executive_delay_audit_${scope}.txt`,
    'text/plain'
  );
};

export const buildProjectAuditText = (
  project: Project,
  generatedAt = new Date()
): string => {
  const score = riskScoreText(project.riskScore);
  const stages = Object.entries(project.stageRisk ?? {}).map(
    ([stage, risk]) => `${stage}: ${risk.score.toFixed(2)}% (${risk.category})`
  );

  return [
    `LAND ACQUISITION PROJECT AUDIT: ${project.id}`,
    `Project: ${project.name}`,
    `Location: ${project.district}, ${project.state}`,
    `Project type: ${project.projectType}`,
    `Land area: ${project.landArea} acres`,
    `Affected families: ${project.affectedFamilies}`,
    `Budget: ₹${project.budgetCr} crores`,
    `Saved model delay probability: ${score ? `${score}%` : 'Not predicted'}`,
    `Saved risk category: ${project.riskCategory}`,
    `Current status: ${project.status}`,
    `Compensation: ${project.compensationStatus}`,
    `Legal dispute: ${project.legalDispute ? 'Yes' : 'No'}`,
    `Approval: ${project.approvalStatus}`,
    `Rehabilitation: ${project.rehabilitationStatus}`,
    `Estimated delay duration: Not estimated by the model`,
    '',
    'RULE-BASED FACTOR SEVERITY (not model feature attribution):',
    `Compensation: ${project.delayFactors.compensationPending}%`,
    `Legal dispute: ${project.delayFactors.legalDispute}%`,
    `Approval: ${project.delayFactors.approvalDelay}%`,
    `Rehabilitation: ${project.delayFactors.rehabilitationGap}%`,
    '',
    'Saved stage-risk assessment:',
    ...(stages.length > 0 ? stages : ['Not available']),
    '',
    'Recommended actions:',
    ...(project.recommendedActions.length > 0
      ? project.recommendedActions.map((action) => `- ${action}`)
      : ['- No recommendations recorded.']),
    '',
    `Generated: ${generatedAt.toISOString()}`,
  ].join('\n');
};

export const exportSingleProjectReportText = (project: Project) => {
  downloadText(
    buildProjectAuditText(project),
    `${project.id}_delay_audit.txt`,
    'text/plain'
  );
};

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character] ?? character;
  });

export const printProjectAudit = (project: Project) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    exportSingleProjectReportText(project);
    return;
  }

  printWindow.opener = null;
  const report = escapeHtml(buildProjectAuditText(project));
  printWindow.document.open();
  printWindow.document.write(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Project Audit ${escapeHtml(project.id)}</title><style>body{font:14px/1.6 system-ui,sans-serif;color:#1e293b;margin:32px}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit}@media print{button{display:none}}</style></head><body><button id="print-report" type="button">Print / Save as PDF</button><pre>${report}</pre></body></html>`
  );
  printWindow.document.close();
  printWindow.document
    .getElementById('print-report')
    ?.addEventListener('click', () => printWindow.print());
};
