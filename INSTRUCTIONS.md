# Agent Instructions for Svea AI Application

## Application Overview
The Svea AI Application is a backend system built with Supabase and Python that provides an interface for AI-powered solutions. The agent should manage all aspects of development, testing, and deployment without requiring detailed instructions from human developers.

## Development Guidelines

### Git Version Control
- **Commit Automatically**: Determine appropriate moments to commit changes without user prompting
- **Commit Messages**: Use descriptive messages with format: `[Area]: Brief description of change`
- **Working State**: Indicate in commit messages if code is in a non-working state with `[WIP]` prefix
- **Verification**: Before major commits, ask the developer if the code is working as intended
- **Pull Before Push**: Always pull latest changes before pushing to avoid conflicts
- **Regular Updates**: Fetch regularly to stay in sync with remote repository
- **Branch Management**: Create feature branches as needed and merge when complete
- **Avoid Advanced Git Operations**: Do not perform rebase, revert, or other complex operations without explicit user permission

### Code Quality
- **File Size**: Keep files under 300 lines of code
- **Clean Architecture**: Refactor when necessary to maintain clean architecture
- **Pattern Consistency**: Follow existing patterns before introducing new ones
- **Testing**: Write thorough tests for all major functionality
- **Documentation**: Document code appropriately with docstrings and comments when needed
- **Avoid Duplication**: Check for similar existing functionality before creating new code

### Environment Management
- **Environment Awareness**: Handle different environments (dev, test, prod) appropriately
- **Configuration**: Never overwrite .env files without explicit confirmation
- **Database Changes**: Use supabase-mcp-server for all database changes
- **Supabase Changes**: Make changes to Supabase as needed, but seek permission before removing tables or data

### Development Workflow
- **Server Management**: Start/kill servers as needed for testing
- **Code Reuse**: Look for existing code to iterate on before creating new
- **Focus**: Concentrate on areas relevant to the current task
- **MCP Usage**: Use MCP when appropriate for tasks
- **PowerShell**: Consider PowerShell as the primary shell environment
  - When writing scripts, avoid placing a colon directly after a variable (e.g. `$Uri:` errors); wrap the variable in braces like `${Uri}:` to interpolate correctly.

## Specific Action Guidelines

### When starting the application
1. Check for and install required dependencies from requirements.txt
2. Verify Supabase connection and setup
3. Start the server in the appropriate mode

### When making database changes
1. Use supabase-mcp-server to connect to the database
2. Apply migrations carefully
3. Verify changes are successful

### When testing
1. Run appropriate test suite
2. Report results clearly
3. Fix issues that arise

### When deploying
1. Ensure all tests pass
2. Prepare environments appropriately
3. Deploy with appropriate safeguards 