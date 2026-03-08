param(
    [switch]$Strict
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$templatesPath = Join-Path $repoRoot 'Templates.html'
$scriptPath = Join-Path $repoRoot 'src\templates.js'
$fixturesPath = Join-Path $repoRoot 'tests\note-fixtures.json'

if (-not (Test-Path $templatesPath)) {
    Write-Host "[FAIL] Missing Templates.html at $templatesPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $scriptPath)) {
    Write-Host "[FAIL] Missing src/templates.js at $scriptPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $fixturesPath)) {
    Write-Host "[FAIL] Missing tests/note-fixtures.json at $fixturesPath" -ForegroundColor Red
    exit 1
}

$templates = Get-Content -Raw -Path $templatesPath
$script = Get-Content -Raw -Path $scriptPath
$fixturesRaw = Get-Content -Raw -Path $fixturesPath

try {
    $fixturesData = $fixturesRaw | ConvertFrom-Json
}
catch {
    Write-Host "[FAIL] Invalid JSON in tests/note-fixtures.json" -ForegroundColor Red
    exit 1
}

$checks = @()
${warnings} = @()
function Add-Check {
    param(
        [string]$Name,
        [bool]$Pass
    )
    $script:checks += @{ Name = $Name; Pass = $Pass }
}

function Add-Warning {
    param(
        [string]$Message
    )
    $script:warnings += $Message
}

# Core file/script integrity
Add-Check -Name 'Single script source active' -Pass (($templates -match '<script src="\./src/templates\.js"></script>') -and -not ($templates -match '(?s)<script>(?!\s*</script>)'))
Add-Check -Name 'updateFinalNote exists' -Pass ($script -match 'function updateFinalNote\(')
Add-Check -Name 'noteType change listener exists' -Pass ($script -match "noteTypeSelect\.addEventListener\('change'")

# High-risk paths
Add-Check -Name 'Injections branch exists' -Pass ($script -match "selectedNoteType === 'injections'")
Add-Check -Name 'Injections options handled' -Pass (($script -match "case 'vivitrol'") -and ($script -match "case 'sublocade'") -and ($script -match "case 'brixadi'"))
Add-Check -Name 'Injections listeners update on input+change' -Pass (($script -match "injectionTypeSelect\.addEventListener\('change'") -and ($script -match "el\.addEventListener\('input', updateFinalNote\)") -and ($script -match "el\.addEventListener\('change', updateFinalNote\)"))
Add-Check -Name 'Discharge Plan branch exists' -Pass ($script -match "selectedNoteType === 'discharge-plan'")
Add-Check -Name 'Discharge helper functions exist' -Pass (($script -match 'function updateDischargeOtherNeedsSummary\(') -and ($script -match 'function initializeDischargeMedicationRows\('))
Add-Check -Name 'Discharge listeners wired' -Pass (($script -match 'dischargeAddMedicationBtn') -and ($script -match 'dischargeSummaryCopyBtn\.addEventListener'))
Add-Check -Name 'Copy area hides for Discharge Plan' -Pass ($script -match 'hideCopyAreaForDischargePlan')
Add-Check -Name 'DTC branch exists' -Pass ($script -match "selectedNoteType === 'drug-treatment-court-report'")
Add-Check -Name 'DTC dual-copy wiring exists' -Pass (($script -match 'dtc-progress-note-copy') -and ($script -match 'dtc-court-note-copy'))
Add-Check -Name 'DTC validation hook exists' -Pass ($script -match 'validateDtcRequiredFields')

# All note types configured in staffNoteOptions
$configuredTypes = [regex]::Matches($script, "\{ value: '([^']+)', label:") |
    ForEach-Object { $_.Groups[1].Value } |
    Sort-Object -Unique

$configuredRoleNotePairs = [regex]::Matches($script, "(?s)(counseling|medical|psychiatric):\s*\[(.*?)\]") |
    ForEach-Object {
        $role = $_.Groups[1].Value
        $block = $_.Groups[2].Value
        [regex]::Matches($block, "\{ value: '([^']+)', label:") |
            ForEach-Object { "$role::$($_.Groups[1].Value)" }
    } |
    Sort-Object -Unique

$generatedTypes = [regex]::Matches($script, "selectedNoteType === '([^']+)'") |
    ForEach-Object { $_.Groups[1].Value } |
    Sort-Object -Unique

Add-Check -Name 'At least one configured note type found' -Pass ($configuredTypes.Count -gt 0)

$fixtureTypes = @()
$fixtureRoleNotePairs = @()
if ($fixturesData -and $fixturesData.fixtures) {
    $fixtureTypes = $fixturesData.fixtures |
        Where-Object { $_.noteType } |
        ForEach-Object { $_.noteType } |
        Sort-Object -Unique

    $fixtureRoleNotePairs = $fixturesData.fixtures |
        Where-Object { $_.staffRole -and $_.noteType } |
        ForEach-Object { "$($_.staffRole)::$($_.noteType)" } |
        Sort-Object -Unique
}
Add-Check -Name 'At least one runtime fixture found' -Pass ($fixtureTypes.Count -gt 0)
Add-Check -Name 'At least one fixture role/note pair found' -Pass ($fixtureRoleNotePairs.Count -gt 0)

foreach ($noteType in $configuredTypes) {
    $containerId = "$noteType-container"
    $containerPattern = 'id="' + [regex]::Escape($containerId) + '"'
    $containerExists = $templates -match $containerPattern
    $branchExists = $generatedTypes -contains $noteType
    $fixtureExists = $fixtureTypes -contains $noteType
    Add-Check -Name "Container exists for '$noteType'" -Pass $containerExists
    Add-Check -Name "Generator branch exists for '$noteType'" -Pass $branchExists
    Add-Check -Name "Runtime fixture exists for '$noteType'" -Pass $fixtureExists
}

$unconfiguredBranches = $generatedTypes | Where-Object { $_ -notin $configuredTypes }
Add-Check -Name 'No unexpected note branches outside configured list' -Pass ($unconfiguredBranches.Count -eq 0)

$unexpectedFixtureTypes = $fixtureTypes | Where-Object { $_ -notin $configuredTypes }
Add-Check -Name 'No runtime fixtures outside configured list' -Pass ($unexpectedFixtureTypes.Count -eq 0)

$invalidFixtureRolePairs = $fixtureRoleNotePairs | Where-Object { $_ -notin $configuredRoleNotePairs }
Add-Check -Name 'All fixture role/note pairs exist in configured options' -Pass ($invalidFixtureRolePairs.Count -eq 0)

# Detect duplicate adjacent selectedNoteType branches (common copy/paste bug)
$lineArray = Get-Content -Path $scriptPath
$hasAdjacentDuplicateBranch = $false
for ($i = 0; $i -lt $lineArray.Count - 1; $i++) {
    if ($lineArray[$i] -match "\} else if \(selectedNoteType === '([^']+)'\) \{") {
        $first = $Matches[1]
        for ($j = $i + 1; $j -lt [Math]::Min($i + 4, $lineArray.Count); $j++) {
            if ($lineArray[$j] -match "\} else if \(selectedNoteType === '([^']+)'\) \{") {
                $second = $Matches[1]
                if ($first -eq $second) {
                    $hasAdjacentDuplicateBranch = $true
                }
                break
            }
        }
    }
}
Add-Check -Name 'No duplicate adjacent selectedNoteType branches' -Pass (-not $hasAdjacentDuplicateBranch)

# Branch-depth check: each configured note type branch should contain output logic
$updateStart = -1
$updateEnd = -1
for ($i = 0; $i -lt $lineArray.Count; $i++) {
    if ($updateStart -lt 0 -and $lineArray[$i] -match '^\s*function\s+updateFinalNote\s*\(') {
        $updateStart = $i
        continue
    }
    if ($updateStart -ge 0 -and $lineArray[$i] -match '^\s*function\s+toggleSafetyPlan\s*\(') {
        $updateEnd = $i - 1
        break
    }
}
if ($updateStart -ge 0 -and $updateEnd -lt 0) {
    $updateEnd = $lineArray.Count - 1
}

if ($updateStart -ge 0 -and $updateEnd -ge $updateStart) {
    $updateLines = $lineArray[$updateStart..$updateEnd]
    $generationEnd = $updateLines.Count - 1
    for ($i = 0; $i -lt $updateLines.Count; $i++) {
        if ($updateLines[$i] -match 'Toggle copy area visibility based on note type') {
            $generationEnd = $i - 1
            break
        }
    }
    if ($generationEnd -lt 0) {
        $generationEnd = $updateLines.Count - 1
    }
    $generationLines = $updateLines[0..$generationEnd]

    $branchIndices = @()
    for ($i = 0; $i -lt $generationLines.Count; $i++) {
        if ($generationLines[$i] -match "\b(?:if|else if)\s*\(selectedNoteType === '([^']+)'\)") {
            $noteType = $Matches[1]
            if ($configuredTypes -contains $noteType) {
                $branchIndices += [PSCustomObject]@{ Index = $i; NoteType = $noteType }
            }
        }
    }

    for ($k = 0; $k -lt $branchIndices.Count; $k++) {
        $noteType = $branchIndices[$k].NoteType
        $start = $branchIndices[$k].Index
        $end = if ($k -lt $branchIndices.Count - 1) { $branchIndices[$k + 1].Index - 1 } else { $generationLines.Count - 1 }

        $segment = ($generationLines[$start..$end] -join "`n")
        $hasOutputLogic = (
            $segment -match '\bfinalNote\b' -or
            $segment -match 'updateDischargeOtherNeedsSummary\(' -or
            $segment -match 'dtc-progress-note-copy' -or
            $segment -match 'dtc-court-note-copy'
        )

        Add-Check -Name "Output logic present in '$noteType' branch" -Pass $hasOutputLogic
    }
}
else {
    Add-Check -Name 'Located updateFinalNote boundaries for deep branch checks' -Pass $false
}

# Entry-note slot/wiring checks (dynamic goal slots)
Add-Check -Name 'Entry-CD client goal container exists' -Pass ($templates -match 'id="client-goals-container"')
Add-Check -Name 'Entry-CD treatment goal container exists' -Pass ($templates -match 'id="treatment-goals-container"')
Add-Check -Name 'Entry-SO client goal container exists' -Pass ($templates -match 'id="so-client-goals-container"')
Add-Check -Name 'Entry-SO treatment goal container exists' -Pass ($templates -match 'id="so-treatment-goals-container"')
Add-Check -Name 'resetGoalRows helper exists' -Pass ($script -match 'function resetGoalRows\(')
Add-Check -Name 'createDynamicRow helper exists' -Pass ($script -match 'function createDynamicRow\(')
Add-Check -Name 'createClientGoalRow helper exists' -Pass ($script -match 'function createClientGoalRow\(')
Add-Check -Name 'Entry-CD/Entry-SO reset on note-type change' -Pass (($script -match "selection === 'entry-cd'") -and ($script -match "selection === 'entry-so'"))
Add-Check -Name 'Entry goal rows initialized on load' -Pass (($script -match 'resetGoalRows\(clientGoalsContainer, treatmentGoalsContainer\)') -and ($script -match 'resetGoalRows\(soClientGoalsContainer, soTreatmentGoalsContainer\)'))

# Slot-level reference scan: report potential unbound form IDs (warning-only)
$formIds = [regex]::Matches($templates, '(?is)<(?:input|select|textarea)\b[^>]*\bid="([^"]+)"') |
    ForEach-Object { $_.Groups[1].Value } |
    Sort-Object -Unique

$ignoredIdPatterns = @(
    '^ciwa-modal-q-\d+$' # created dynamically in JS
)

$isCoveredByDynamicPattern = {
    param(
        [string]$Id,
        [string]$ScriptText
    )

    if ($Id -match '^auds-(amt|date)-') {
        return $ScriptText -match 'auds-(amt|date)-\$\{key\}'
    }
    if ($Id -match '^ouds-(amt|date)-') {
        return $ScriptText -match 'ouds-(amt|date)-\$\{key\}'
    }
    if ($Id -match '^auds-sub-') {
        return $ScriptText -match 'auds-sub-\$\{key\}'
    }
    if ($Id -match '^ouds-sub-') {
        return $ScriptText -match 'ouds-sub-\$\{key\}'
    }
    if ($Id -match '^auds-med-') {
        return $ScriptText -match 'auds-med-\$\{id\}'
    }
    if ($Id -match '^ouds-med-') {
        return $ScriptText -match 'ouds-med-\$\{id\}'
    }

    return $false
}

$unboundIds = @()
foreach ($id in $formIds) {
    $ignore = $false
    foreach ($pattern in $ignoredIdPatterns) {
        if ($id -match $pattern) {
            $ignore = $true
            break
        }
    }

    if ($ignore) { continue }

    $directReference = $script -match [regex]::Escape($id)
    $dynamicReference = & $isCoveredByDynamicPattern $id $script

    if (-not $directReference -and -not $dynamicReference) {
        $unboundIds += $id
    }
}

if ($unboundIds.Count -gt 0) {
    Add-Warning -Message "Potentially unbound form IDs (not found in src/templates.js): $($unboundIds.Count)"
    $preview = ($unboundIds | Select-Object -First 20) -join ', '
    Add-Warning -Message "Sample: $preview"
}

$failed = @()
foreach ($check in $checks) {
    if ($check.Pass) {
        Write-Host "[PASS] $($check.Name)" -ForegroundColor Green
    }
    else {
        Write-Host "[FAIL] $($check.Name)" -ForegroundColor Red
        $failed += $check
    }
}

if ($failed.Count -gt 0) {
    if ($warnings.Count -gt 0) {
        Write-Host "`nWarnings:" -ForegroundColor Yellow
        foreach ($warning in $warnings) {
            Write-Host "[WARN] $warning" -ForegroundColor Yellow
        }
    }
    Write-Host "`nSmoke check failed: $($failed.Count) check(s) failed." -ForegroundColor Red
    exit 1
}

if ($warnings.Count -gt 0) {
    Write-Host "`nWarnings:" -ForegroundColor Yellow
    foreach ($warning in $warnings) {
        Write-Host "[WARN] $warning" -ForegroundColor Yellow
    }
}

if ($Strict -and $warnings.Count -gt 0) {
    Write-Host "`nStrict mode: warnings are treated as failures." -ForegroundColor Red
    exit 1
}

Write-Host "`nSmoke check passed." -ForegroundColor Green
exit 0