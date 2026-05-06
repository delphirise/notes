# Delphi Rise Outpatient User Manual

Version: 1.0
Date: 2026-04-23
Audience: Delphi Rise outpatient counseling, medical, and psychiatric staff

## Purpose

This manual explains how to use Delphi Rise Outpatient tools for day-to-day documentation and clinical workflow support.

The guide is focused on the current application experience in the main workspace, including:
- MSE
- DARP
- Templates
- SUD Dx and DSM-V-TR Dx
- Planner
- Letters
- Safety Plan

## Important Use Notes

- This tool supports documentation workflow and draft generation.
- Final clinical notes remain the responsibility of the treating clinician.
- Follow Delphi Rise policy, payer requirements, and supervisory guidance.
- Do not include unnecessary PHI in free-text fields.
- Review all generated text before placing into the legal health record.

## Getting Started

### Open the app

1. Open the Delphi Rise workspace.
2. Open the main app page (index.html).
3. Use the top tab row to move between tools.

### Top navigation overview

Main tabs:
- MSE
- DARP
- Templates
- SUD Dx (dropdown includes DSM-V-TR Dx)
- Planner
- Letters
- Safety Plan

Other top controls:
- Clear All: reloads the page and clears unsaved in-memory form state.

## Data Handling and Persistence

### What is session-only

Most text-entry fields are session-based and can be lost on reload unless copied/saved externally.

### What is persisted locally

The following are stored in local browser storage on the current machine/profile:
- DARP custom modality categories and custom interventions
- DARP intern information and intern note auto-check preference

### Security reminder

Local persistence is device/browser specific. Use approved devices and follow workstation security policy.

## MSE Tab (Mental Status Exam)

### Primary workflow

1. Use Presets if applicable:
- Normal MSE
- Telehealth Normal MSE
2. Select findings in each clinical category.
3. Add custom notes where needed.
4. Review generated MSE text in the output area.
5. Click COPY MSE.

### Main controls

- Presets section with checkboxes for common normal sets
- Category checkboxes and custom inputs
- Clear Form button
- COPY MSE button

### Tips

- Use custom fields to capture patient-specific observations.
- Keep entries objective and behavior-based.
- If using MSE inside DARP, verify final wording in the DARP note preview.

## DARP Tab (Progress Note)

The DARP note is structured as:
- Data
- Assessment
- Response
- Plan

### Primary workflow

1. (Optional) Check Intern Note when applicable.
2. Complete Data fields:
- Diagnoses (when needed)
- Session Content and Problems Addressed
- Toxicology screen checkbox
3. Select interventions used.
4. Complete Assessment, Response, and Plan.
5. Verify Goal Verification checkbox.
6. Review generated note.
7. Click COPY DARP NOTE.

### Intern Note workflow

If Intern Note is checked:
- The intern statement appears in the generated note.
- Intern signature block fields are included.
- Use Save Information to store intern/supervisor details for future sessions.
- Use Clear Information to remove saved intern details.

### Interventions workflow

You can manage intervention categories and items directly in DARP:
- Add New Modality Category
- Add custom interventions within categories
- Rename category (pencil icon)
- Delete category or intervention (X icon)
- Add modality-level rationale for selected items

Persistence behavior:
- Custom categories/interventions now persist across reloads.
- Reset returns intervention categories to default set.

### Validation behavior

- The note is blocked until Goal Verification is checked.
- If not checked, the output displays a reminder instead of full note text.

### DARP documentation tips

- Use specific client response language, not generic statements.
- Tie interventions to treatment goals and barriers.
- Keep plan statements actionable and measurable.

## Templates Tab

Templates opens the full note-template workspace.

### Primary workflow

1. Select Staff Role.
2. Select Note Type.
3. Complete required fields/checklists.
4. Review generated text.
5. Use Copy controls for final note transfer.

### Staff roles

- Counseling
- Medical
- Psychiatric

### Example note types by role

Counseling includes:
- Evaluation - Chemical Dependency
- Evaluation - Significant Other
- Entry Session notes
- Discharge Plan
- Closing Notes
- Telehealth
- Crisis Intervention
- Complex Coordination of Care
- Drug Treatment Court Report

Medical includes:
- Medical Screening
- MAT Education
- Injections
- Nurse Follow Up
- OP Alcohol Detox
- CIWA-Ar Assessment
- OUD/SUD short forms
- Smoking cessation notes
- Crisis Intervention

Psychiatric includes:
- Psychiatric Assessment
- Psychiatric Follow-Up
- Crisis Intervention
- Complex Coordination of Care

### Crisis Intervention template highlights

The Crisis Intervention note includes:
- Structured triage and qualifying indicators
- Suicide risk plus SI Risk Indicators (Thoughts, Plan, Intent)
- MSE and emergency response sections
- Interventions and disposition/outcome
- Eligibility review, billing support, and validation checks
- Generated crisis note with Copy note button

Copy enable rule:
- Copy note remains disabled until validation requirements are met.

### Template usage tips

- Always match note type to encounter type and staff role.
- Use built-in prompts as scaffolding, then edit for patient-specific accuracy.
- For billing-sensitive encounters, verify coding recommendations before final submission.

## SUD Dx and DSM-V-TR Dx

These tools support diagnostic criteria review and summary drafting.

### SUD Dx workflow

1. Choose diagnosis/category.
2. Select criteria and specifiers.
3. Review ICD code output.
4. Review Generated Report text.
5. Click Copy to Clipboard.

### Best practices

- Document criteria with evidence from the current episode of care.
- Ensure diagnostic language aligns with clinical interview and collateral data.

## Planner Tab (Treatment Plan Builder)

The planner helps staff build treatment components by area of focus.

### Workflow

1. Select Area of Focus.
2. Review and select from:
- Behavioral Definitions
- Diagnostic Suggestions
- Long Term Goals
- Short Term Objectives
3. Copy individual items using inline copy controls.
4. Paste selected material into the treatment plan or note.

### Notes

- The planner uses structured content libraries.
- Copy confirmation appears as a visual toast notification.

## Letters Tab

Letters provides structured templates and PDF export.

### Access

- Letters opens with a password prompt.
- Use the current password issued by Delphi Rise leadership.

### Workflow

1. Select Letter Type.
2. Complete template fields (dates, salutation, patient and treatment details).
3. Review Generated Report Text.
4. Use:
- Copy Text for chart/workflow transfer
- Download PDF for document delivery

### Available letter types include

- General Use
- Discharge Letter - External / Referral Source
- Discharge Letter - Client
- Discharge Letter - Client (Successful Completion)
- Enrollment Verification
- Evaluation in Progress
- Re-Engagement
- Treatment Not Recommended
- Treatment Recommended

### Letters tips

- Confirm dates, names, and salutation before export.
- Validate inclusion/exclusion options (for example, referral or toxicology sections).
- Re-open downloaded PDF and visually verify formatting before distribution.

## Safety Plan Tab

The Safety Plan tool supports structured crisis/safety planning and PDF output.

### Workflow

1. Enter patient header information:
- Patient Name
- Date
- Created with help from
2. Complete each safety plan section:
- Warning signs
- Internal coping strategies
- People/settings for distraction
- People to ask for help
- Environmental safety actions
- Professional agencies/resources
- Additional resources
3. Review pre-listed national and NYS resources checkboxes.
4. Click Save as PDF.

### Safety planning tips

- Document means-safety steps clearly.
- Confirm phone numbers and resource entries before printing/sending.
- Use patient-centered language and concrete action steps.

## Recommended Clinical Workflow

For routine outpatient sessions:

1. Start with MSE for current presentation.
2. Move to DARP for encounter documentation.
3. Use Templates when a specific structured note is required.
4. Use Planner for treatment-plan updates.
5. Use Letters only when communication documentation is needed.
6. Use Safety Plan for risk-focused interventions and crisis readiness.

## Quality Review Checklist Before Finalizing Any Note

- Patient identifiers are correct.
- Note type matches service and role.
- Required fields are complete.
- Language is objective, clear, and clinically specific.
- Interventions are linked to goals/problems.
- Risk and safety language is documented when indicated.
- Generated text was reviewed and edited before copy/export.

## Troubleshooting

### DARP note will not generate full text

Cause:
- Goal Verification is not checked.

Fix:
- Check Goal Verification and re-review output.

### Custom interventions disappeared

Possible causes:
- Browser storage cleared
- Different browser profile/device
- Reset to defaults was used

Fix:
- Recreate custom categories/interventions as needed.
- Use approved workstation/profile consistently.

### Copy button did not copy expected content

Fix:
- Click into output box and verify text first.
- Re-click copy control.
- Paste into a plain text destination to confirm exact output.

### Letter PDF formatting issue

Fix:
- Re-generate after checking salutation/field completeness.
- Download again and open the saved PDF for final validation.

## Governance and Compliance Reminder

This platform supports documentation efficiency. It does not replace:
- Clinical judgment
- Supervisor review
- Regulatory requirements
- Payer policy review

When in doubt, escalate to a supervisor, QA lead, or compliance lead before finalizing documentation.

## Quick Reference (At a Glance)

- MSE: Build mental status text and copy.
- DARP: Build full progress note with interventions and goal verification.
- Templates: Role-based structured notes and generated outputs.
- SUD/DSM Dx: Criteria-driven diagnostic summaries.
- Planner: Copy-ready treatment planning statements.
- Letters: Password-protected letter templates with PDF export.
- Safety Plan: Structured crisis plan with Save as PDF.

End of Manual
