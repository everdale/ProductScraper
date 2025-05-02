# start-mcp.ps1
param(
    [string]$ProjectPath = "dotnet8-mcp",
    [int]$Port = 5000
)

# Kill any process listening on the MCP port
Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

# Start the .NET 8 MCP skeleton as a background process
$process = Start-Process -FilePath "dotnet" -ArgumentList "run --project $ProjectPath --urls http://127.0.0.1:$Port" -PassThru

# Save the process ID for later
$process.Id | Set-Content -Path mcp.pid

Write-Output "MCP started with PID $($process.Id) on port $Port" 