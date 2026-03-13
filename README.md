# Contact Manager

A web application for managing contacts built with ASP.NET Core 8 MVC and TypeScript.

## Features

- View all contacts in a clean table with avatar initials
- Add, edit, and delete contacts
- Bulk delete via checkbox selection
- Search contacts by name or email (debounced, no page reload)
- Duplicate email detection with inline error feedback
- All interactions handled via AJAX — no full page reloads

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
├── ContactManager/                   # Main application
│   ├── Controllers/
│   │   ├── ContactController.cs      # Handles all contact endpoints
│   │   └── HomeController.cs         # Redirects root to contacts
│   ├── Models/
│   │   ├── Contact.cs                # Contact model with validation
│   │   ├── Exceptions/
│   │   │   └── DuplicateEmailException.cs
│   │   └── Validation/
│   │       └── OptionalPhoneAttribute.cs
│   ├── Services/
│   │   ├── Interfaces/
│   │   │   ├── Interface_ContactService.cs
│   │   │   └── Interface_ContactRepository.cs
│   │   ├── ContactService.cs         # Business logic
│   │   └── InMemoryContactRepository.cs  # Thread-safe in-memory store
│   └── Views/
│       └── Contact/
│           └── Index.cshtml          # Single page UI
└── ContactManager.Tests/             # Unit tests
    ├── Controllers/
│   │   └── ContactControllerTests.cs # 14 controller tests
    ├── Models/Validation/
    │   └── OptionalPhoneAttributeTests.cs
    └── Services/
        ├── ContactRepositoryTests.cs  # 19 repository tests
        └── ContactServiceTests.cs     # 15 service tests
```

## Assumptions & Trade-offs

- **No database** — contacts are stored in memory and reset on app restart. This was the stated requirement.
- **Thread safety** — `InMemoryContactRepository` uses `ConcurrentDictionary` to handle concurrent requests safely.
- **Duplicate email prevention** — enforced at the service layer. The controller returns `409 Conflict` and the UI highlights the email field inline.
- **Phone validation** — ASP.NET's built-in `[Phone]` attribute rejects empty strings even when the field is optional. A custom `OptionalPhoneAttribute` handles this by skipping validation when no value is provided.
- **No authentication** — the app is open to anyone. Not a concern for this exercise but required in production.
- **CSRF protection** — JSON AJAX endpoints rely on the browser's same-origin policy. This would need revisiting for a production app.
- **TypeScript compiled to wwwroot** — `contacts.js` is committed so the app runs without a separate build step after cloning. In a real CI/CD pipeline this would be generated at build time.
