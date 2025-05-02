param(
    [int]$Port = 5000,
    [string]$Tool = "",
    [string]$JsonInput = "{}"
)

if ($Tool) {
    $Uri = "http://127.0.0.1:$Port/mcp/execute"
    # Build request body
    $payload = @{ tool = $Tool; input = (ConvertFrom-Json $JsonInput) } | ConvertTo-Json
    try {
        $response = Invoke-RestMethod -Uri $Uri -Method POST -Body $payload -ContentType "application/json" -ErrorAction Stop
        Write-Output "MCP Execute Response: $($response | ConvertTo-Json -Depth 5)"
    } catch {
        Write-Error "Failed to invoke MCP execute endpoint at ${Uri}: $_"
    }
} else {
    $Uri = "http://127.0.0.1:$Port/mcp/test"
    try {
        $response = Invoke-RestMethod -Uri $Uri -ErrorAction Stop
        Write-Output "MCP Response: $($response.message)"
    } catch {
        Write-Error "Failed to invoke MCP endpoint at ${Uri}: $_"
    }
} 