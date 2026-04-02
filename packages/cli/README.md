# UI Grab CLI

Interactive CLI to install and configure UI Grab in your project.

## Usage

```bash
npx ui-grab@latest init
```

## Commands

- `ui-grab init` configures UI Grab in your app
- `ui-grab add mcp` installs the `ui-grab-mcp` entry in your agent config
- `ui-grab remove mcp` removes the MCP entry from your agent config guidance
- `ui-grab configure` updates an existing installation

### Interactive Setup

```bash
npx ui-grab@latest init
```

### Non-Interactive Setup

Pass options to skip prompts or force a reconfiguration:

```bash
# Auto-detect everything and install without prompts
npx ui-grab@latest init -y

# Reconfigure an existing install
npx ui-grab@latest init --force

# Set a custom activation key
npx ui-grab@latest init --key "Meta+Shift+G"
```

## Init Options

| Option           | Alias | Description                                      |
| ---------------- | ----- | ------------------------------------------------ |
| `--yes`          | `-y`  | Skip interactive confirmation prompts            |
| `--force`        | `-f`  | Reconfigure when UI Grab is already installed    |
| `--key <key>`    | `-k`  | Override the activation key                      |
| `--skip-install` | -     | Modify files without installing npm dependencies |
| `--pkg <pkg>`    | -     | Use a custom package source                      |
| `--cwd <cwd>`    | `-c`  | Run the CLI against a different working tree     |
| `--help`         | `-h`  | Show help                                        |
| `--version`      | `-v`  | Show version                                     |

## Examples

```bash
# Interactive setup
npx ui-grab@latest init

# Quick install with auto-detection
npx ui-grab@latest init -y

# Install MCP support into your agent config
npx ui-grab@latest add mcp

# Reconfigure with a custom activation key
npx ui-grab@latest init --force --key "Meta+Shift+G"

# Only modify files (skip npm install)
npx ui-grab@latest init --skip-install -y
```

## Supported Frameworks

| Framework              | File Modified                     |
| ---------------------- | --------------------------------- |
| Next.js (App Router)   | `app/layout.tsx`                  |
| Next.js (Pages Router) | `pages/_document.tsx`             |
| Vite                   | `index.html`                      |
| Webpack                | `src/index.tsx` or `src/main.tsx` |

## Manual Installation

If the CLI doesn't work for your setup, visit the docs:

[Yongtaek-Ryu/ui-grab](https://github.com/Yongtaek-Ryu/ui-grab)
