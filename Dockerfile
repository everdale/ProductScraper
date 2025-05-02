# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project and restore
COPY ["dotnet8-mcp/McpSkeleton.csproj", "dotnet8-mcp/"]
RUN dotnet restore "dotnet8-mcp/McpSkeleton.csproj"

# Copy everything else and build
COPY . .
WORKDIR "/src/dotnet8-mcp"
RUN dotnet publish "McpSkeleton.csproj" -c Release -o /app/publish

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# Expose port
EXPOSE 5000

# Entry point
ENTRYPOINT ["dotnet", "McpSkeleton.dll"] 