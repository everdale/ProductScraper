# check-repo.ps1
param(
    [string]$StateFile = ".gitmonitor.json"
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
$remotes = git branch -r --format='%(refname:short)' | Where-Object { $_ -like 'origin/*' }
foreach ($remote in $remotes) {
    $branch = $remote -replace '^origin/', ''
    $sha = git rev-parse $remote
    $newState[$branch] = $sha

    if (-not $oldState.ContainsKey($branch)) {
        $remoteSummary += "New branch detected: $branch"
    } elseif ($oldState[$branch] -ne $sha) {
        $log = git log $oldState[$branch]..$sha --oneline
        $remoteSummary += "Branch '$branch' has new commits:`n$log"
    }
}

# Step 4: Persist new state
ConvertTo-Json $newState -Depth 10 | Set-Content $StateFile

# Step 5: Determine working state by building the project
$workingState = $false
if (Test-Path "dotnet8-mcp") {
    dotnet build "./dotnet8-mcp" -nologo > $null 2>&1
    if ($LASTEXITCODE -eq 0) { $workingState = $true }
}

# Step 6: Check local workspace status
$localChanges = git status --porcelain

# Auto-commit descriptive summary if there are local changes
if ($localChanges) {
    # Categorize changes for commit message
    $added = @(); $modified = @(); $deleted = @(); $renamed = @(); $others = @()
    foreach ($line in $localChanges) {
        $status = $line.Substring(0,2)
        $file = $line.Substring(3)
        switch ($status) {
            'A ' { $added += $file }
            'M ' { $modified += $file }
            'D ' { $deleted += $file }
            'R ' { $renamed += $file }
            default { $others += "$status $file" }
        }
    }
    $parts = @()
    if ($added)    { $parts += $added -join ', ' }
    if ($modified) { $parts += $modified -join ', ' }
    if ($deleted)  { $parts += $deleted -join ', ' }
    if ($renamed)  { $parts += $renamed -join ', ' }
    if ($others)   { $parts += $others -join ', ' }
    $description = $parts -join '; '
    # Prefix with [WIP] if build failed
    if (-not $workingState) { $description = "[WIP] $description" }
    git add -A
    git commit -m $description
    git push
    $pushSummary = "Committed and pushed changes: $description"
} else {
    # No local changes: sync remote commits if any
    $pushSummary = '' ; $pullSummary = ''
    $counts = git rev-list --left-right --count HEAD...@{u} 2>$null
    if ($counts) {
        $parts = $counts -split "\s+"
        $behind = [int]$parts[0]; $ahead = [int]$parts[1]
        if ($ahead -gt 0) { git push; $pushSummary = "Pushed $ahead local commit(s)" }
        if ($behind -gt 0) { git pull --rebase; $pullSummary = "Pulled $behind remote commit(s)" }
    }
}

# Step 7: Compile summary output";
echo "=== Repository Monitor Summary ==="
if ($remoteSummary) { $remoteSummary | ForEach-Object { echo "- $_" } }
else { echo "- No new branches or remote commits" }
if ($pushSummary) { echo "- $pushSummary" }
elif ($pullSummary) { echo "- $pullSummary" }
else { echo "- Local branch is up to date" } 