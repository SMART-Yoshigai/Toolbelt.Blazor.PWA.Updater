# Blazor PWA Updater

Blazor PWA Updater is a .NET library that provides "Update Now" UI and functionality for Blazor Progressive Web Applications when new versions become available. The library consists of two main NuGet packages: the UI components package and the service layer package.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

- Bootstrap, build, and test the repository:
  - Install .NET 8.0 and 9.0 SDKs (both required): 
    - `wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb && sudo dpkg -i packages-microsoft-prod.deb && rm packages-microsoft-prod.deb`
    - `sudo apt-get update && sudo apt-get install -y dotnet-sdk-8.0 dotnet-sdk-9.0`
  - Install Node.js 22+: `curl -fsSL https://nodejs.org/dist/v22.17.1/node-v22.17.1-linux-x64.tar.xz | sudo tar -xJ -C /usr/local --strip-components=1`
  - `dotnet restore` -- takes 13 seconds
  - `dotnet build` -- takes 10 seconds. NEVER CANCEL. Set timeout to 60+ minutes for safety.
- Run .NET tests: `dotnet test` -- takes 7.5 seconds. NEVER CANCEL. Set timeout to 30+ minutes for safety.
- Run TypeScript tests:
  - `cd Tests/Updater.Service`
  - `/usr/local/bin/npm install` -- takes 4 seconds on first run
  - `/usr/local/bin/npm test` -- takes 2 seconds. NEVER CANCEL. Set timeout to 15+ minutes for safety.
- Run sample applications for testing:
  - Blazor Server PWA: `cd SampleSites/BlazorServerPWA1 && dotnet run --urls="http://localhost:8080"`
  - Blazor WebAssembly PWA: `cd SampleSites/BlazorPWA1 && dotnet build` (outputs to bin/Debug/net9.0/wwwroot)

## Validation

- Always run both .NET and TypeScript tests after making changes
- ALWAYS run through at least one complete end-to-end scenario after making changes by running a sample application
- The BlazorServerPWA1 sample can be run and tested via HTTP requests to validate functionality
- You can build and run both sample applications for manual validation
- Pay special attention to PWA functionality, service worker behavior, and update notifications

## Common tasks

The following are outputs from frequently run commands. Reference them instead of viewing, searching, or running bash commands to save time.

### Repository structure
```
├── .github/workflows/unit-tests.yml   # CI/CD pipeline
├── Updater/                           # Main UI components package
│   ├── PWAUpdater.razor              # Main PWA updater component
│   ├── PWAUpdater.razor.css          # Component styles
│   └── Toolbelt.Blazor.PWA.Updater.csproj
├── Updater.Service/                   # Core service package
│   ├── IPWAUpdaterService.cs         # Service interface
│   ├── PWAUpdaterService.cs          # Service implementation
│   ├── script.ts                     # TypeScript service worker integration
│   └── Toolbelt.Blazor.PWA.Updater.Service.csproj
├── Tests/
│   ├── Updater/                      # .NET component tests (Bunit + NUnit)
│   └── Updater.Service/              # TypeScript service tests (Vitest)
├── SampleSites/                      # Demo applications
│   ├── BlazorPWA1/                   # Blazor WebAssembly PWA sample
│   └── BlazorServerPWA1/             # Blazor Server PWA sample
└── Toolbelt.Blazor.PWA.Updater.sln  # Main solution file
```

### Project dependencies
- **.NET 8.0 and 9.0**: Multi-target framework support
- **Microsoft.AspNetCore.Components.Web**: Blazor component framework
- **Microsoft.TypeScript.MSBuild**: TypeScript compilation
- **Node.js 22+**: Required for Promise.withResolvers in TypeScript tests
- **Bunit**: Blazor component testing framework
- **NUnit**: .NET testing framework
- **Vitest**: TypeScript testing framework

### Key features implemented
- **PWAUpdater Razor component**: UI for update notifications
- **PWAUpdaterService**: Core update detection and management
- **Service worker integration**: JavaScript bridge for PWA updates
- **Environment-aware display**: Only shows in Production by default
- **Customizable UI**: CSS custom properties and child content support
- **Multi-platform**: Works with both Blazor Server and WebAssembly

### Testing scenarios to validate
1. **Component rendering**: Test PWAUpdater component in different environments
2. **Service worker lifecycle**: Test update detection and notification flow
3. **User interaction**: Test "Update Now" button functionality
4. **Environment filtering**: Ensure UI only shows in appropriate environments
5. **Sample applications**: Run and manually test both Blazor Server and WebAssembly samples

### Common build issues and solutions
- **Missing .NET 9.0 SDK**: Install both .NET 8.0 and 9.0 SDKs as the project multi-targets
- **TypeScript test failures**: Ensure Node.js 22+ is installed for Promise.withResolvers support
- **Missing TypeScript dependencies**: Run `npm install` in Tests/Updater.Service directory
- **Sample app errors**: Build the solution first before running sample applications

### Important file locations
- **Main component**: `Updater/PWAUpdater.razor`
- **Service interface**: `Updater.Service/IPWAUpdaterService.cs`
- **TypeScript integration**: `Updater.Service/script.ts`
- **CI configuration**: `.github/workflows/unit-tests.yml`
- **Package configuration**: `nuget.config` (includes local _dist folder)
- **Component tests**: `Tests/Updater/PWAUpdaterTests.cs`
- **Service tests**: `Tests/Updater.Service/tests/script.test.ts`

### Performance expectations
- **Fresh clone to ready**: ~30 seconds (includes .NET restore + Node.js setup)
- **Incremental builds**: ~5-10 seconds
- **Full test suite**: ~10 seconds total (.NET + TypeScript)
- **Sample app startup**: ~2-3 seconds for Blazor Server, immediate for WebAssembly (after build)