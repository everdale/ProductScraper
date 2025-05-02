# Svea AI Application

## Overview
This application is an AI-powered solution built with Supabase and Python. It leverages the MCP (Machine Cognition Protocol) to automate development tasks and provide a seamless experience for developers.

## Getting Started
Simply ask the agent to start the application, and it will:
1. Install all required dependencies from `requirements.txt`
2. Set up the Supabase environment
3. Initialize the application

## Development Roadmap

### Phase 1: Initial Setup
- [x] Create project structure
- [x] Define dependencies
- [x] Create .NET 8 generic MCP skeleton with test and execute endpoints
- [x] Add PowerShell lifecycle (start/stop) and invocation scripts

### Phase 2: Core MCP Modules
- [ ] Define and scaffold hosted MCP (production service)
- [ ] Define and scaffold developer-tool MCP (local tooling for building hosted MCPs)
- [ ] Implement initial tool handlers (e.g. echo, ping)

### Phase 3: Modularization & Streaming
- [ ] Support registering and running multiple MCPs in the same application
- [ ] Add SSE or WebSocket transport for real-time streams
- [ ] Integrate middleware for logging, validation, and authentication

### Phase 4: Testing & Deployment
- [ ] Write comprehensive unit and integration tests for each MCP module and script
- [ ] Configure CI/CD pipelines to build, test, and deploy hosted MCP services
- [ ] Containerize MCP modules (Docker) and publish the hosted service

#### Docker Build & Run
Once your Dockerfile is in place, build and run the container:
```bash
docker build -t mcp-skeleton .
docker run --rm -d -p 5000:5000 --name mcp-skeleton mcp-skeleton
```
Then verify:
```bash
curl http://localhost:5000/mcp/test
```

## Agent Instructions

### Git Version Control
The agent should:
- Automatically determine when to commit, push, pull, and fetch without user intervention
- Commit with descriptive messages that explain what was changed and why
- Indicate if a commit contains non-working code
- Ask the developer if the code is working as intended before making major commits
- Pull before pushing to avoid conflicts
- Fetch regularly to stay updated with remote changes

### Code Standards
- Keep files under 300 lines of code
- Refactor when necessary to maintain clean architecture
- Follow existing patterns before introducing new ones
- Write thorough tests for all major functionality
- Document code appropriately

### Environment Management
- Respect different environments (dev, test, prod)
- Never overwrite .env files without explicit confirmation
- Use supabase-mcp-server for database changes
- Make Supabase changes as needed unless removing tables or data

### Development Workflow
- Start/kill servers as needed for testing
- Look for existing code to iterate on before creating new
- Focus on areas relevant to the current task
- Avoid duplication by checking for similar existing functionality
- Use MCP when appropriate for tasks
- Consider PowerShell as the primary shell environment

### MCP Lifecycle Scripts
The repository includes two PowerShell scripts to manage the MCP skeleton:
- **start-mcp.ps1**: Kills any process on port 5000 and starts the .NET 8 MCP in the background, saving its PID to `mcp.pid`.
  ```powershell
  .\start-mcp.ps1
  ```
- **stop-mcp.ps1**: Stops the MCP process using the PID from `mcp.pid` and removes the PID file.
  ```powershell
  .\stop-mcp.ps1
  ```

### Generic MCP Execution
The MCP skeleton now exposes a POST `/mcp/execute` endpoint taking a JSON body:
```json
{ "tool": "<toolName>", "input": { /* arbitrary JSON */ } }
```
Use the `invoke-mcp.ps1` script to call it:
```powershell
# Test the generic execute endpoint
.\invoke-mcp.ps1 -Port 5000 -Tool "echo" -JsonInput '{"msg":"Hello MCP!"}'
```
This will POST to `/mcp/execute` and display the returned payload (echoing input by default).