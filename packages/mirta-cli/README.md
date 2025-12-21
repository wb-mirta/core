# @mirta/cli

[![en](https://img.shields.io/badge/lang-en-olivedrab.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-cli/README.md)
[![ru](https://img.shields.io/badge/lang-ru-dimgray.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-cli/README.ru.md)
[![NPM Version](https://img.shields.io/npm/v/@mirta/cli?style=flat-square)](https://npmjs.com/package/@mirta/cli)
[![NPM Downloads](https://img.shields.io/npm/dm/@mirta/cli?style=flat-square&logo=npm)](https://npmjs.com/package/@mirta/cli)

> Universal CLI tool for versioning, publishing, and deployment in monorepos with synchronized semantic versioning.

`@mirta/cli` is a process orchestrator that:
- Synchronously updates versions across monorepo packages,
- Runs `CHANGELOG` generation (if configured),
- Publishes packages to NPM with `--provenance` support in CI,
- Synchronizes artifacts with Wiren Board controllers via `rsync`.

Works in any monorepo using `pnpm` and synchronized semantic versioning.

To recognize the monorepo structure, `@mirta/cli` relies on the packages `@mirta/workspace` and `@mirta/package`, which read the configuration from the workspaces field in the root `package.json`.

**Not intended for execution in Duktape environment on Wiren Board controllers.**

## 📦 Installation

```sh
pnpm add -wD @mirta/cli
```

✅ This package is designed for the Mirta framework but works in any `pnpm` monorepo with synchronized versioning.

## 🚀 Quick Start

**Run a release**:

```sh
pnpm mirta release
```
Select the update type → versions will be updated.

**Publish (in CI or locally)**:

```sh
pnpm mirta publish
```
All public packages will be published to NPM.

## 🧰 Commands

### `mirta [options]`

These global options are available for all commands:
- `--help` (`-h`) — displays help on available commands and options.
- `--version` (`-v`) — prints `@mirta/cli` version.
- `--locale <loc>` — sets the interface language (`en`, `ru`).

### `pnpm mirta release`

Prepares a release: detects the current version, prompts to select an update type (`patch`, `minor`, `major`, `pre*`), and applies it to all packages with the `version` field.

<details>
<summary>Technical Details</summary>

The process is divided into stages:

**Stage 1: Git state check** (if project is under git)
- Ensures synchronization with `origin`.
- Verifies CI success (via `build` workflow).

**Stage 2: Dependency update**
- Recursively discovers `package.json` in paths specified in `mirta.config.json#project.templates`.
- Updates monorepo dependencies (`dependencies`, `devDependencies`) to the current version.

**Stage 3: CHANGELOG generation**
- Runs `pnpm run changelog` if the script exists.

**Stage 4: Commit and tag**
- If GitHub access is via `ssh`, creates a commit and tag:
  ```sh
  git commit -m "release: vX.X.X"
  git tag vX.X.X
  ```
- If access is via `https`, changes remain in the working directory for manual commit.

</details>

#### Supported Options

- `--dry-run` (`--dry`) — simulation mode, shows changes without applying them.
- `--preid` `<id>` — custom prerelease identifier (`alpha.0`, `beta.1`).
- `--skip-prompts` — skips interactive prompts, uses defaults.
- `--skip-git` — skips commit and tag creation.

#### Frequently Asked Questions

<details>
<summary>Why synchronized versioning?</summary>

All packages receive the same version on release. This ensures:
- Guaranteed compatibility (`@mirta/cli@0.4.0` works with `@mirta/package@0.4.0`),
- Atomic releases,
- Simplified dependency management.

💡 When using `workspace:*`, all references are replaced with the concrete version during release.

</details>

<details>
<summary>What is "semantic" versioning?</summary>

Format: `major.minor.patch`:
- `major` — breaking changes,
- `minor` — new features without breaking compatibility,
- `patch` — bug fixes.

Versions below `1.0.0` (e.g., `0.4.0`) are experimental: any update may include breaking changes.

More: [semver.org](https://semver.org/)

</details>

<details>
<summary>How to set up CHANGELOG.md generation?</summary>

Add `conventional-changelog-cli` to devDependencies in the root `package.json` and define the script:

```json
{
  "scripts": {
    "changelog": "conventional-changelog -p angular -i CHANGELOG.md -s"
  }
}
```

The changelog is generated from commit messages. Requirements:
- Subject line ≤ 50 characters,
- Use prefixes: `fix:`, `feat:`, `docs:`, `chore:`, etc.

See: [Commit Convention](https://github.com/wb-mirta/core/blob/latest/.github/commit-convention.md)

</details>

#### Advanced Usage

<details>
<summary>Explicit version</summary>

Sets the exact version passed as an argument:

```sh
pnpm mirta release 1.2.3
```
⚠️ **Never overwrite published versions — NPM will reject them.**

</details>

<details>
<summary>Increment: patch, minor, major</summary>

```sh
pnpm mirta release patch
# 0.0.1
```

```sh
pnpm mirta release minor
# 0.1.0
```

```sh
pnpm mirta release major
# 1.0.0
```
</details>

<details>
<summary>Pre-releases: alpha, beta, rc</summary>

```sh
pnpm mirta release prepatch --preid alpha
# 0.0.1-alpha.0
```

```sh
pnpm mirta release preminor --preid alpha
# 0.1.0-alpha.0
```

```sh
pnpm mirta release premajor --preid alpha
# 1.0.0-alpha.0
```

#### Incrementing pre-release version

```sh
pnpm mirta release prerelease --preid alpha
# 0.0.1-alpha.1
```
</details>

---

### `pnpm mirta publish`

Publishes packages to NPM, skipping those with `private: true`.

<details>
<summary>Technical Details</summary>

⚠️ Typically runs in CI after `git push` of the `vX.X.X` tag.

The publish tag is determined automatically:
- `alpha` → `--tag alpha`
- `beta` → `--tag beta`
- `rc` → `--tag rc`

In CI, `--provenance` is added to attest package origin.

</details>

#### Supported Options

- `--dry-run` (`--dry`) — simulation mode.
- `--skip-build` — skips running `pnpm run build`.
- `--skip-git` — disables git checks (equivalent to `--no-git-checks` in `pnpm publish`).

---

### `pnpm mirta deploy`

Synchronizes files with Wiren Board controllers via `rsync` over SSH.

<details>
<summary>Technical Details</summary>

- Transport: `rsync -rtzgO` (recursive, compressed, preserves timestamps and group, omits directory timestamps — safe for overlayfs).
- WSL2 support: on Windows, commands run inside WSL.
- Authentication:
  - Uses an isolated `ssh-agent`.
  - Supports PKCS#11 (Rutoken) and SSH keys.
  - `ttl` — key lifetime (e.g., `1h`).
- `--dry-run` mode: shows changes without applying.
- Symbolic links are not transferred — should be created on the controller manually.

</details>

#### Supported Options

- `--config`, `-c <path>` — path to `mirta.config.json`.
- `--profile`, `-p <name>` — deployment profile (default: `default`).
- `--to <conn>` — override connection string.
- `--dry-run` — simulate synchronization.
Parameter `--to` accepts:
- Connection name from `mirta.config.json`,
- Connection string starting with `ssh://`.

#### Environment variables and secrets

For secure credential storage, use `.env.local` (git-ignored):

```sh
# .env.local

SSH_KEY=~/.ssh/id_ed25519

# Available in config:
WB_CONN_OPTIONS=`key=${SSH_KEY};ttl=1h30m`
WB_CONN_WORK=`ssh://user@mycompany.local;${WB_CONN_OPTIONS}`
```

Supported prefixes:
- `WB_` — CLI-specific variables
- `MIRTA_` — general Mirta context
- `NODE_ENV` — standard environment value

#### Connection string format

```sh
ssh://[user@]host[:port][;param1=value1;param2=value2...]
```

Supported parameters:

| Parameter | Description | Example |
|---------|-------------|---------|
| `pkcs11` | Path to PKCS#11 library (Rutoken) | `pkcs11=/usr/lib/librtpkcs11ecp.so` |
| `key` | Path to SSH key (ED25519, RSA) | `key=~/.ssh/id_ed25519` |
| `ttl` | Key lifetime in ssh-agent | `ttl=1h` |
| `wsl` | WSL2 distribution for Windows | `wsl=Debian` |

> Note: `pkcs11` takes precedence over `key` if both are specified.

Examples:

```sh
# ED25519 SSH key
ssh://deploy@192.168.42.1;key=~/.ssh/id_ed25519;ttl=30m
```

```sh
# PKCS#11 token (Rutoken) with WSL2 on Windows
ssh://deploy@192.168.42.1;pkcs11=/usr/lib/librtpkcs11ecp.so;wsl=Ubuntu-22.04
```

```sh
# With environment variables
ssh://deploy@${WB_HOST};key=${MIRTA_SSH_KEY}
```

<details>
<summary>PKCS#11 nuances</summary>

If `ssh-agent` throws `agent refused operation`:

- PKCS#11 module path must be real — symlinks are rejected
- PIN code attempt limit exceeded, token is locked

</details>

#### Example and structure of `mirta.config.json`

```json5
{
  // Connection strings to controllers
  "connections": {
    // Omitted details in public repository
    "work": "${WB_CONN_WORK}",
    // Partial detail hiding
    "home": "ssh://user@192.168.42.1;${WB_CONN_OPTIONS};wsl=Ubuntu"
  },
  "deploy": {
    // File sync rule sets
    "mappings": {
      "wb-rules-es5": [
        {
          // Local folder (relative to project root)
          "from": "dist/es5/wb-rules-rules",
          // Target folder on controller
          "to": "/mnt/data/etc/wb-rules-rules",
          // User group with access on controller (optional)
          "toGroup": "developers",
          // Delete files in target if missing in source
          "cleanup": true,
          // List of files/dirs to protect from deletion when cleanup: true
          "protect": ["alarms.conf"]
        },
        // {
        //   Next sync rule...
        // }
      ]
    },
    // Predefined deployment profiles
    "profiles": {
      "default": {
        // Array of rule set names from deploy.mappings
        "mappings": ["wb-rules-es5"],
        // Connection name or string
        "connection": "work",
        // User group with access on controller (optional)
        "toGroup": "developers"
      }
    }
  }
}
```

## ✅ Testing

The tool has been tested manually and in CI:
- Interactive and automated releases.
- Error handling (version rollback on failure).
- Git state and CI checks.
- Support for `--dry-run`.

Additional tests:
- Deployment using `Rutoken`, deployment with `ED25519` key in WSL2 on Windows and standalone Linux Debian (Trixie).

## ⚠️ Limitations

**Runs only in Node.js** (not in Duktape).<br/>
Automatic commit and tag creation works only with `ssh` access to GitHub.<br/>
WSL2 is required for deployment from Windows.

## 🛠 Mirta Configuration

The `mirta.config.json` file configures `@mirta/cli` behavior.

Supported fields:

- `project.templates` — paths to templates (e.g., for `create-mirta`).
- `connections` — named connections.
- `deploy.mappings` — file sync rules.
- `deploy.profiles` — deployment profiles.
