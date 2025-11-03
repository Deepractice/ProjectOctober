# Release Workflow Documentation

This document describes the complete release workflow for DeepracticeInfra packages.

## Overview

Our release process follows a structured approach that separates concerns:

- **Release** (Concept): Version marking and release notes
- **Publish** (Artifact): Publishing static artifacts (npm packages)
- **Deploy** (Runtime): Deploying live services (future)

## Workflow Architecture

```text
Issue → Development → PR
                      ↓
                  CI Workflow (lint/typecheck/test/build)
                      ↓
                  Merge to main
                      ↓
            [Changesets Accumulated]
                      ↓
            Manual: Version Workflow
                      ↓
               Release PR Created
                      ↓
            CI Workflow (验证)
                      ↓
         Review & Merge Release PR
                      ↓
            Auto: Release Workflow
            ├─ Create Git Tag
            └─ Create GitHub Release
                      ↓
            Auto: Publish Workflow
            └─ Publish to npm
```

## Prerequisites

### Required Secrets

Configure the following secrets in GitHub repository settings (`Settings → Secrets and variables → Actions`):

| Secret Name | Description                                           | How to Generate                                                                                                                                                                                                                                                            | Required For                |
| ----------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `NPM_TOKEN` | npm automation token for publishing packages          | 1. Login to [npmjs.com](https://www.npmjs.com)<br>2. Go to Access Tokens<br>3. Generate New Token → Automation<br>4. Copy token                                                                                                                                            | Publish Workflow            |
| `GH_PAT`    | GitHub Personal Access Token for triggering workflows | 1. GitHub Settings → Developer settings → Personal access tokens → Fine-grained tokens<br>2. Generate new token<br>3. Repository access: Only select repositories → DeepracticeInfra<br>4. Permissions: Contents (Read/Write), Pull requests (Read/Write)<br>5. Copy token | Version & Release Workflows |

### Required Permissions

Ensure the following permissions are configured:

1. **GitHub Actions Permissions** (`Settings → Actions → General`):
   - Allow GitHub Actions to create and approve pull requests: ✅ Enabled
   - Workflow permissions: Read and write permissions

2. **npm Organization Access**:
   - You must be a member of `@deepracticex` organization on npm
   - Organization must have public package publishing enabled

3. **Repository Branch Protection** (`Settings → Branches`):
   - Branch name pattern: `main`
   - Require pull request reviews before merging
   - Require status checks to pass before merging:
     - `Lint`
     - `Type Check`
     - `Test`
     - `Build`
   - Require branches to be up to date before merging
   - Require linear history

### Environment Variables (Used in Workflows)

The workflows use the following environment variables (automatically provided by GitHub Actions):

| Variable                | Source                      | Usage                                                            |
| ----------------------- | --------------------------- | ---------------------------------------------------------------- |
| `GITHUB_TOKEN`          | Set from `GH_PAT` secret    | Creating PRs, releases, tags (must use PAT to trigger workflows) |
| `NODE_AUTH_TOKEN`       | Set from `NPM_TOKEN` secret | npm authentication                                               |
| `NPM_CONFIG_PROVENANCE` | Hardcoded `true`            | Enable npm provenance                                            |

**Why GH_PAT instead of auto-generated GITHUB_TOKEN?**

The default `GITHUB_TOKEN` cannot trigger other workflows (GitHub security feature to prevent infinite loops). We need a Personal Access Token (PAT) so that:

- Version Workflow creates PR → Can trigger CI checks
- Release Workflow creates GitHub Release → Can trigger Publish Workflow

## Workflows

### 0. CI Workflow (`.github/workflows/ci.yml`)

**Trigger**: Automatic on PR and push to `main`

**Purpose**: Ensure code quality and correctness before merging

**Jobs**:

1. **Lint**: Run ESLint and Prettier format check
2. **Type Check**: Run TypeScript type checking
3. **Test**: Run Cucumber BDD tests and upload reports
4. **Build**: Build all packages and verify artifacts

**Usage**:

- Automatically runs on every PR
- Automatically runs on push to `main`
- All checks must pass before PR can be merged (if branch protection is enabled)

**Required for**: All PRs (including Release PRs)

---

### 1. Version Workflow (`.github/workflows/version.yml`)

**Trigger**: Manual (`workflow_dispatch`)

**Purpose**: Start a new release by creating a Release PR

**Steps**:

1. Create release branch (`release/YYYYMMDD-HHMMSS`)
2. Run `pnpm changeset version` to:
   - Consume all changesets in `.changeset/`
   - Update package versions in `package.json`
   - Update `CHANGELOG.md` files
3. Commit version changes
4. Push release branch
5. Create Release PR to `main`

**Usage**:

```bash
# Via GitHub UI
Go to Actions → Version → Run workflow

# Or manually
git checkout main
git pull
pnpm changeset version
git checkout -b release/$(date +%Y%m%d-%H%M%S)
git add .
git commit -m "chore: version packages"
git push origin HEAD
gh pr create --base main --title "chore: release packages"
```

---

### 2. Release Workflow (`.github/workflows/release.yml`)

**Trigger**: Automatic when Release PR is merged to `main`

**Purpose**: Mark the release with tags and GitHub Release (conceptual milestone)

**Steps**:

1. Extract version information from all `package.json` files
2. Create Git tag (`release-YYYYMMDD-HHMMSS`)
3. Generate release notes from `CHANGELOG.md` files
4. Create GitHub Release with:
   - Tag
   - Release notes
   - Package versions

**Outputs**:

- Git tag (e.g., `release-20251008-112015`)
- GitHub Release page

**Note**: This workflow does NOT publish packages. It only marks the release.

---

### 3. Publish Workflow (`.github/workflows/publish.yml`)

**Trigger**: Automatic when GitHub Release is published

**Purpose**: Publish static artifacts (npm packages) to registry

**Steps**:

1. Checkout code
2. Setup Node.js and pnpm
3. Install dependencies
4. Build all packages (`pnpm build`)
5. Publish to npm registry (`pnpm publish -r`)

**Features**:

- Recursive publishing of all packages
- Public access (`--access public`)
- npm provenance for supply chain security
- No git checks (already validated)

**Requirements**:

- `NPM_TOKEN` secret in GitHub repository settings

---

## Development Workflow

### Daily Development

```bash
# 1. Create feature branch
git checkout -b feature/add-new-utility

# 2. Make changes
# ... code ...

# 3. Create changeset
pnpm changeset
# Select packages to version
# Select bump type (major/minor/patch)
# Write summary of changes

# 4. Commit and push
git add .
git commit -m "feat: add new utility function"
git push origin feature/add-new-utility

# 5. Create PR and merge to main
gh pr create --base main
```

### Starting a Release

```bash
# 1. Go to GitHub Actions → Version → Run workflow
# This creates a Release PR

# 2. Review Release PR
# - Check version bumps in package.json files
# - Review CHANGELOG.md updates
# - Verify CI checks pass

# 3. Merge Release PR
# This automatically triggers Release + Publish workflows
```

### What Happens After Merge

```text
Release PR Merged
  ↓
Release Workflow (automatic)
  ├─ Tags: release-20251008-112015
  └─ Creates GitHub Release
      ↓
Publish Workflow (automatic)
  └─ Publishes to npm:
      - @deepracticex/error-handling@0.1.0
      - @deepracticex/logger@0.1.0
      - @deepracticex/eslint-config@0.1.0
      - @deepracticex/prettier-config@0.1.0
      - @deepracticex/typescript-config@0.1.0
```

---

## Changeset Guidelines

### When to Create Changesets

Create a changeset when your PR includes:

- New features (minor)
- Bug fixes (patch)
- Breaking changes (major)
- Documentation updates (patch, if published)

### Changeset Format

```markdown
---
"@deepracticex/package-name": minor
---

Brief summary of changes

- Detailed change 1
- Detailed change 2
```

### Changeset Types

- **major**: Breaking changes (1.0.0 → 2.0.0)
- **minor**: New features (1.0.0 → 1.1.0)
- **patch**: Bug fixes (1.0.0 → 1.0.1)

---

## Package Versioning Strategy

We use **independent versioning**:

- Each package maintains its own version number
- Packages can be released independently
- Version bumps only affect changed packages

Example:

```text
Before Release:
- @deepracticex/error-handling: 0.1.0
- @deepracticex/logger: 0.1.0

After Release (only error-handling changed):
- @deepracticex/error-handling: 0.2.0
- @deepracticex/logger: 0.1.0 (unchanged)
```

---

## Release Checklist

### Before Starting Release

- [ ] All PRs merged to `main`
- [ ] All changesets created
- [ ] CI passes on `main` branch
- [ ] Local testing completed

### During Release

- [ ] Run Version Workflow
- [ ] Review Release PR:
  - [ ] Version bumps are correct
  - [ ] CHANGELOG.md entries are accurate
  - [ ] No unexpected changes
- [ ] Approve and merge Release PR

### After Release

- [ ] Verify GitHub Release created
- [ ] Verify packages published to npm
- [ ] Test installation: `pnpm add @deepracticex/package-name`
- [ ] Update dependent projects

---

## Troubleshooting

### Version Workflow Failed

**Problem**: No changesets found

**Solution**: Make sure `.changeset/*.md` files exist (excluding README.md)

```bash
# Check changesets
ls .changeset/*.md | grep -v README.md

# Create a changeset if missing
pnpm changeset
```

---

### Release Workflow Failed

**Problem**: Cannot create tag (already exists)

**Solution**: Delete existing tag and re-run

```bash
git tag -d release-YYYYMMDD-HHMMSS
git push origin :refs/tags/release-YYYYMMDD-HHMMSS
```

---

### Publish Workflow Failed

**Problem**: `npm ERR! 401 Unauthorized`

**Solution**: Check NPM_TOKEN secret

1. Generate new token at <https://www.npmjs.com/settings/tokens>
2. Add to GitHub: Settings → Secrets → Actions → NPM_TOKEN
3. Token must have "Automation" or "Publish" permission

**Problem**: `npm ERR! 403 Forbidden`

**Solution**: Check package scope ownership

```bash
# Check who owns @deepracticex scope
npm owner ls @deepracticex/package-name

# Add yourself if needed
npm owner add YOUR_NPM_USERNAME @deepracticex/package-name
```

---

## Security

### npm Provenance

We enable npm provenance for supply chain security:

- Proves packages are built from this GitHub repository
- Links packages to specific commits and workflows
- Visible on npm package pages

### Protected Branches

`main` branch should be protected with:

- Require pull request reviews
- Require status checks to pass
- Require branches to be up to date
- Require linear history

---

## Future Enhancements

### Deploy Workflow (Planned)

For services and applications:

```yaml
name: Deploy

on:
  release:
    types: [published]

jobs:
  deploy:
    # Deploy services to production
    # - Build Docker images
    # - Push to container registry
    # - Deploy to Kubernetes
    # - Health checks
```

### Automated Canary Releases

```yaml
name: Canary

on:
  push:
    branches:
      - main

jobs:
  canary:
    # Publish @next tag to npm
    # For early testing
```

---

## References

- [Changesets Documentation](https://github.com/changesets/changesets)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [npm Provenance](https://docs.npmjs.com/generating-provenance-statements)
- [GitHub Actions](https://docs.github.com/en/actions)
