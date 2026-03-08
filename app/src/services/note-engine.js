import { formatDisplayDate } from '../utils/dates.js';
import { humanizeList, replaceTokens } from '../utils/strings.js';

export function buildMseSummary(sections, state) {
  const lines = sections.flatMap((section) => {
    const selected = state.selections?.[section.id] ?? [];
    const customNote = state.notes?.[section.id]?.trim();

    if (!selected.length && !customNote) {
      return [];
    }

    const summaryParts = [];

    if (selected.length) {
      summaryParts.push(humanizeList(selected));
    }

    if (customNote) {
      summaryParts.push(customNote);
    }

    return [`${section.label}: ${summaryParts.join('. ')}.`];
  });

  return lines.join('\n');
}

export function buildDarpNote({ sessionContent, mentalStatus, response, plan, goals, interventions }) {
  const selectedInterventions = humanizeList(interventions) || 'supportive counseling and clinical review';

  return [
    `DATA: ${sessionContent || 'Client and clinician reviewed current symptoms, stressors, and recovery priorities.'}`,
    `ASSESSMENT: ${mentalStatus || 'Client was alert, oriented, and able to participate in treatment planning.'}`,
    `RESPONSE: ${response || 'Client was engaged, receptive to feedback, and demonstrated insight into current needs.'}`,
    `INTERVENTIONS: ${selectedInterventions}.`,
    `PROGRESS: ${goals || 'Progress toward treatment goals was reviewed and updated during session.'}`,
    `PLAN: ${plan || 'Continue scheduled services, reinforce coping skills, and monitor safety needs.'}`,
  ].join('\n\n');
}

export function buildTemplateNote(template, values) {
  if (!template) {
    return '';
  }

  return replaceTokens(template.output, {
    ...values,
    date: formatDisplayDate(values.date),
  })
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function buildDiagnosticSummary(diagnosis, selectedCriteria) {
  if (!diagnosis) {
    return '';
  }

  const count = selectedCriteria.length;
  const severity = count >= 6 ? 'Severe' : count >= 4 ? 'Moderate' : count >= 2 ? 'Mild' : 'Subthreshold';

  return [
    `${diagnosis.name}`,
    `Criteria met: ${count}`,
    `Severity: ${severity}`,
    selectedCriteria.length ? `Selected findings: ${humanizeList(selectedCriteria)}.` : 'No criteria selected yet.',
    diagnosis.icd?.length ? `Common ICD-10 options: ${humanizeList(diagnosis.icd)}.` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildPlanSummary({ domain, objectives, interventions, targetDate }) {
  return [
    `Domain: ${domain || 'Not selected'}`,
    objectives.length ? `Objectives: ${humanizeList(objectives)}.` : 'Objectives: Pending selection.',
    interventions.length ? `Interventions: ${humanizeList(interventions)}.` : 'Interventions: Pending selection.',
    targetDate ? `Target review date: ${formatDisplayDate(targetDate)}.` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildLetter(letter, values) {
  if (!letter) {
    return '';
  }

  return replaceTokens(letter.body, {
    ...values,
    date: formatDisplayDate(values.date),
  })
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function buildSafetyPlan(sections, values) {
  return sections
    .map((section) => {
      const value = values[section.id]?.trim();
      return value ? `${section.label}: ${value}` : '';
    })
    .filter(Boolean)
    .join('\n\n');
}
