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

#### Connection string example

```sh
ssh://deploy@192.168.42.1;pkcs11=/usr/lib/librtpkcs11ecp.so;ttl=1h;wsl=Debian
```

#### mirta.config.json structure

```json
{
  "connections": {
    "work": "ssh://user@10.200.200.1;pkcs11=/path/to/rutoken.so"
  },
  "deploy": {
    "mappings": {
      "wb-rules-es5": [
        {
          "from": "dist/es5/wb-rules",
          "to": "/mnt/data/etc/wb-rules",
          "cleanup": true,
          "protect": ["alarms.conf"]
        }
      ]
    },
    "profiles": {
      "default": {
        "mappings": ["wb-rules-es5"],
        "connection": "work"
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
