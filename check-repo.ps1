# check-repo.ps1
param(
    [string]$StateFile = ".gitmonitor.json",
    [string]$CommitMessage = ""  # optional AI-generated commit message
)

# Step 1: Fetch remotes
git fetch

# Step 2: Load previous monitor state
$oldState = @{}
if (Test-Path $StateFile) {
    try { $oldState = Get-Content $StateFile | ConvertFrom-Json } catch { $oldState = @{} }
}

# Prepare new state dictionary
$newState = @{}
$remoteSummary = @()

# Step 3: Check each remote branch for new branches or commits
$remotes = git branch -r --format='%(refname:short)' | Where-Object { $_ -like 'origin/*' -and $_ -ne 'origin/HEAD' }
foreach ($remote in $remotes) {
    $branch = $remote -replace '^origin/', ''
    $sha = git rev-parse $remote
    $newState[$branch] = $sha

    # Check if branch existed in previous state
    $branchExists = $oldState.PSObject.Properties.Name -contains $branch
    if (-not $branchExists) {
        $remoteSummary += "New branch detected: $branch"
    } elseif ($branchExists -and ($oldState.$branch -ne $sha)) {
        $log = git log $oldState.$branch..$sha --oneline
        $remoteSummary += "Branch '$branch' has new commits:`n$log"
    }
}

# Step 3.1: Build remote summary table for developer
$remoteTable = foreach ($kvp in $newState.GetEnumerator()) {
    $branch = $kvp.Key
    $oldSha = if ($oldState.PSObject.Properties.Name -contains $branch) { $oldState.$branch } else { $null }
    $newSha = $kvp.Value
    if (-not $oldSha) {
        $status = 'New'
        $commits = ''
    } elseif ($oldSha -ne $newSha) {
        $status = 'Updated'
        $commits = (git log $oldSha..$newSha --oneline | Out-String).Trim()
    } else {
        $status = ''
        $commits = ''
    }
    [PSCustomObject]@{ Branch = $branch; Status = $status; Commits = $commits }
}

# Step 3.2: compute age for each branch and add Age & AgeSeconds
$now = Get-Date
$remoteTableWithAge = $remoteTable | ForEach-Object {
    $branch = $_.Branch
    $ts = git log -1 --format=%ct origin/$branch 2>$null
    if ($ts) {
        $commitDate = [DateTimeOffset]::FromUnixTimeSeconds([int]$ts).LocalDateTime
        $delta = $now - $commitDate
        if ($delta.TotalDays -gt 6) {
            if ($commitDate.Year -eq $now.Year) {
                $age = $commitDate.ToString('MMM dd', [System.Globalization.CultureInfo]::InvariantCulture)
            } else {
                $age = $commitDate.ToString('MMM dd, yyyy', [System.Globalization.CultureInfo]::InvariantCulture)
            }
        } elseif ($delta.TotalDays -ge 1) {
            $age = '{0}d ago ({1})' -f [int]$delta.TotalDays, $commitDate.ToString('ddd', [System.Globalization.CultureInfo]::InvariantCulture)
        } elseif ($delta.TotalHours -ge 1) {
            $age = '{0}h ago' -f [int]$delta.TotalHours
        } else {
            $age = '{0}m ago' -f [int]$delta.TotalMinutes
        }
        $_ | Add-Member -NotePropertyName Age -NotePropertyValue $age -PassThru |
             Add-Member -NotePropertyName AgeSeconds -NotePropertyValue $delta.TotalSeconds -PassThru
    } else {
        $_ | Add-Member -NotePropertyName Age -NotePropertyValue 'n/a' -PassThru |
             Add-Member -NotePropertyName AgeSeconds -NotePropertyValue [double]::MaxValue -PassThru
    }
}

# Step 3.3: detect remote HEAD branch for sorting
try { $rawHead = git rev-parse --abbrev-ref origin/HEAD 2>$null; $headBranch = $rawHead -replace '^origin/', '' } catch { $headBranch = '' }
$orderedRemoteTable = $remoteTableWithAge |
    Sort-Object @{Expression={ if ($_.Branch -eq $headBranch) { 0 } else { 1 } }}, @{Expression={$_.AgeSeconds}}

# Step 4: Persist new state
ConvertTo-Json $newState -Depth 10 | Set-Content $StateFile

# Step 5: Determine working state by building the project
$workingState = $false
if (Test-Path "dotnet8-mcp") {
    dotnet build "./dotnet8-mcp" -nologo > $null 2>&1
    if ($LASTEXITCODE -eq 0) { $workingState = $true }
}

# Step 6: Check local workspace status and optionally commit
$localChanges = git status --porcelain

if ($CommitMessage) {
    # Always pull first, abort on conflict
    git pull 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Pull failed due to conflicts or errors. Aborting."
        exit 1
    }
    $pullSummary = "Pulled remote changes successfully"
    # Commit if there are local changes
    if ($localChanges) {
        git add -A
        git commit -m "$CommitMessage"
        git push
        $pushSummary = "Committed and pushed with message: $CommitMessage"
    } else {
        $pushSummary = 'No local changes to commit'
    }
} else {
    # No commit message: sync remote only if ahead/behind
    $pushSummary = ''; $pullSummary = ''
    $counts = git rev-list --left-right --count HEAD...@{u} 2>$null
    if ($counts) {
        $parts = $counts -split "\s+"
        $behind = [int]$parts[0]; $ahead = [int]$parts[1]
        if ($ahead -gt 0) { git push; $pushSummary = "Pushed $ahead local commit(s)" }
        if ($behind -gt 0) { git pull; $pullSummary = "Pulled $behind remote commit(s)" }
    }
}

# Step 7: compile summary output
$orderedRemoteTable = $orderedRemoteTable  # no header, table prints immediately
$orderedRemoteTable | Format-Table Branch,Status,Age,Commits -AutoSize
Write-Host ''
Write-Host '=== Local Sync Summary ==='
if ($pushSummary) { Write-Host "- $pushSummary" }
if ($pullSummary) { Write-Host "- $pullSummary" }
if (-not $pushSummary -and -not $pullSummary) { Write-Host '- Local branch is up to date' } 