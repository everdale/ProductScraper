using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// Generic MCP execute endpoint
app.MapPost("/mcp/execute", (McpRequest req) =>
    Results.Json(new { tool = req.tool, output = req.input, status = "success" })
);

// Test endpoint for verifying the MCP skeleton is running
app.MapGet("/mcp/test", () => Results.Json(new { message = "MCP skeleton is working on .NET 8!" }));

app.Run();

// Request model for MCP execution
public record McpRequest(string tool, JsonElement input); 