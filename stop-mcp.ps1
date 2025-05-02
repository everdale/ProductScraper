# stop-mcp.ps1
param(
    [int]$Port = 5000
)

# Kill any process listening on the MCP port
$connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
if ($connections) {
    $connections | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
    Write-Output "Stopped process(es) listening on port $Port."
} else {
    Write-Warning "No process found on port $Port."
}

# Clean up PID file
if (Test-Path mcp.pid) {
    Remove-Item mcp.pid -Force
    Write-Output "Removed PID file."
} 