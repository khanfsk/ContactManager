# Contact Manager

A web application for managing contacts built with ASP.NET Core 8 MVC and TypeScript.

## Features

- View all contacts in a clean table with avatar initials
- Add, edit, and delete contacts
- Bulk delete via checkbox selection
- Search contacts by name or email (debounced, no page reload)
- All interactions are handled via AJAX — no full page reloads

## Tech Stack

- **Back-end:** ASP.NET Core 8 MVC (C#)
- **Front-end:** TypeScript, jQuery, Bootstrap 5
- **Testing:** xUnit, Moq, FluentAssertions
- **Storage:** In-memory (no database required)

## Setup

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js](https://nodejs.org) (for compiling TypeScript)

### Running the app

1. Clone the repository

```bash
git clone https://github.com/khanfsk/ContactManager.git
cd ContactManager
```

2. Install front-end dependencies and compile TypeScript

```bash
cd ContactManager
npm install
npm run build
cd ..
```

3. Run the application

```bash
dotnet run --project ContactManager/ContactManager.csproj
```

4. Open your browser and go to `http://localhost:5036`

### Running the tests

```bash
dotnet test ContactManager.Tests/ContactManager.Tests.csproj
```

## Project Structure

```
ContactManager/
├── ContactManager/                 # Main application
│   ├── Controllers/
│   │   ├── ContactController.cs    # Handles all contact endpoints
│   │   └── HomeController.cs       # Redirects to contacts
│   ├── Models/
│   │   └── Contact.cs              # Contact model with validation
│   ├── Services/
│   │   ├── Interface_ContactService.cs
│   │   └── ContactService.cs       # In-memory business logic
│   └── Views/
│       └── Contact/
│           └── Index.cshtml        # Single page UI
└── ContactManager.Tests/           # Unit tests
    ├── Services/
    │   └── ContactServiceTests.cs  # 25 service tests
    └── Controllers/
        └── ContactControllerTests.cs  # 10 controller tests
```

## Assumptions & Trade-offs

- **No database** — contacts are stored in memory and will reset on app restart. This was the stated requirement.
- **No authentication** — the app is open to anyone. Not a concern for this exercise but would be required in production.
- **Phone validation** — ASP.NET's built-in `[Phone]` attribute rejects empty strings even when the field is optional, so front-end validation handles phone format instead.
- **CSRF protection** — JSON AJAX endpoints are not CSRF-protected since browsers block cross-origin JSON requests by default. This would need to be revisited for a production app.
- **TypeScript compiled to wwwroot** — the compiled `contacts.js` is committed to the repo so the app runs without needing a separate build step once cloned, though in a real CI/CD pipeline this would be generated at build time.
