# BC Delegate Dashboard (Custom Roles Fork)

A fork of [coder13/delegateDashboard](https://github.com/coder13/delegateDashboard) with support for **custom competition roles** that export into WCIF — including roles outside the base WCIF specification.

Originally created by Cailyn Sinclair; forked and adapted by Heewon Hwang.

## What's New in This Fork

### Custom Roles

- Define competition-specific roles from **Custom Roles** in the sidebar (or Staff page → Manage Custom Roles)
- Assign custom roles on the **Staff** page alongside built-in staff roles (scrambler, judge, runner, data entry)
- Enable **Assign per group** to paint custom roles onto specific groups in **Configure Assignments** (same flow as judging)
- Choose how each role is exported to WCIF:

| Strategy | Where it's stored | When to use |
|----------|-------------------|-------------|
| **Both** (default) | `person.roles` + `person.extensions` | Maximum compatibility |
| **Standard WCIF roles** | `person.roles` only | Roles the WCA API accepts |
| **Extension only** | `person.extensions` only | Roles outside the base WCIF spec |

### WCIF Extensions

Custom role data is stored using Delegate Dashboard WCIF extensions:

- **Competition level:** `delegateDashboard.customRoleDefinitions` — role definitions for the competition
- **Person level:** `delegateDashboard.customRoles` — extension-only role assignments

Schemas live in `public/wcif-extensions/`.

## Getting Started

```bash
cd delegate-dashboard-fork
yarn install
yarn dev
```

Open http://localhost:5173

### Environment

All secrets and deployment-specific values belong in environment variables — never commit them to the repo.

**Local:** copy `.env.example` to `.env` and fill in values.

**Netlify:** Site settings → Environment variables:

| Variable | Required | Notes |
|----------|----------|-------|
| `VITE_WCA_OAUTH_CLIENT_ID` | Yes | WCA Application ID (not the secret) |
| `VITE_WCA_ORIGIN` | No | Defaults to `https://www.worldcubeassociation.org` |
| `VITE_GA_MEASUREMENT_ID` | No | Google Analytics ID if you want page tracking |

Register callback URLs on your [WCA OAuth application](https://www.worldcubeassociation.org/oauth/applications):

- `http://localhost:5173`
- `https://bc-delegate-dashboard.netlify.app`

Scopes: `public`, `manage_competitions`

Redeploy after changing Netlify env vars (Vite bakes them in at build time).

### Windows note

The `dev` script uses bash-style env vars. On Windows, use Git Bash/WSL or run:

```powershell
$env:VITE_GIT_SHA = (git rev-parse --short HEAD)
$env:GENERATE_SOURCEMAP = "false"
yarn vite
```

## Usage

1. Log in with your WCA account
2. Open a competition you manage
3. Go to **Custom Roles** and add roles (e.g. "Commentator", "Medical Officer")
4. Enable **Assign per group** for roles that should be painted per-group (like judging)
5. Go to **Configure Staff** and toggle competition-wide roles for each person
6. Open a round → **Configure Assignments** to paint per-group roles onto specific groups
7. Save (Ctrl+S) — roles export into WCIF via PATCH

For roles the WCA API may reject, use **Extension only** export strategy. They will still be stored in `person.extensions` and included in CSV exports.

## Scripts

| Command | Description |
|---------|-------------|
| `yarn dev` | Development server |
| `yarn build` | Production build |
| `yarn test` | Unit tests |
| `yarn check:type` | TypeScript check |

## Upstream

Based on delegateDashboard v0.2.7. See the [original README](https://github.com/coder13/delegateDashboard) for core features.
