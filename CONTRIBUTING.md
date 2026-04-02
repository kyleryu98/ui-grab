# Contributing to UI Grab

Thanks for your interest in contributing to UI Grab. This repository is an independent fork of React Grab, focused on the reusable runtime, CLI, MCP bridge, and built-in Shift multi-select support.

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm >= 8

### Setup

1. Fork and clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/ui-grab.git
cd ui-grab
```

2. Install dependencies using [@antfu/ni](https://github.com/antfu/ni):

```bash
ni
```

3. Build all packages:

```bash
nr build
```

4. Start development mode:

```bash
nr dev
```

## Project Structure

```
packages/
├── react-grab/          # Internal runtime source package
├── grab/                # Public distribution package, published as `ui-grab`
├── cli/                 # Internal CLI source bundle
├── mcp/                 # MCP bridge package, published as `ui-grab-mcp`
└── e2e-app/             # E2E test target app (Vite)
```

## Development Workflow

### Running Tests

```bash
# Run CLI tests
pnpm --filter @react-grab/cli test
```

### Linting & Formatting

```bash
nr lint        # Check for lint errors
nr lint:fix    # Fix lint errors
nr format      # Format code with oxfmt
```

## Code Style

- **Use TypeScript interfaces** over types
- **Use arrow functions** over function declarations
- **Use kebab-case** for file names
- **Use descriptive variable names** — avoid shorthands or 1-2 character names
  - Example: `innerElement` instead of `el`
  - Example: `didPositionChange` instead of `moved`
- **Avoid type casting** (`as`) unless absolutely necessary
- **Keep interfaces/types** at the global scope
- **Remove unused code** and follow DRY principles
- **Avoid comments** unless absolutely necessary
  - If a hack is required, prefix with `// HACK: reason for hack`

## Submitting Changes

### Creating a Pull Request

1. Create a new branch:

```bash
git checkout -b feat/your-feature-name
```

2. Make your changes and commit with a descriptive message:

```bash
git commit -m "feat: add new feature"
```

3. Push to your fork and open a pull request

### Commit Convention

We use conventional commits:

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation changes
- `chore:` — Maintenance tasks
- `refactor:` — Code refactoring
- `test:` — Test additions or changes
- Commit messages must be written in English

## Reporting Issues

Found a bug? Have a feature request? [Open an issue](https://github.com/Yongtaek-Ryu/ui-grab/issues) with:

- Clear description of the problem or request
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Environment details (OS, browser, Node version)

## Community

- Join our [Discord](https://discord.com/invite/G7zxfUzkm7) to discuss ideas and get help
- Check existing [issues](https://github.com/Yongtaek-Ryu/ui-grab/issues) before opening new ones

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
