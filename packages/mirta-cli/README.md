# @mirta/cli

[![en](https://img.shields.io/badge/lang-en-olivedrab.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-cli/README.md)
[![ru](https://img.shields.io/badge/lang-ru-dimgray.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-cli/README.ru.md)
[![NPM Version](https://img.shields.io/npm/v/@mirta/globals?style=flat-square)](https://npmjs.com/package/@mirta/cli)
[![NPM Downloads](https://img.shields.io/npm/dm/@mirta/cli?style=flat-square&logo=npm)](https://npmjs.com/package/@mirta/cli)

> A universal command-line tool for releasing and publishing versions in monorepos with synchronized semantic versioning.

`@mirta/cli` is a release orchestrator that:
- Synchronously updates versions across all packages in a monorepo,
- Generates `CHANGELOG` (if configured),
- Publishes packages to NPM with `--provenance` support in CI.

Works in any monorepo using `pnpm` and following the principle of synchronized semantic versioning.

To automatically detect project structure, `@mirta/cli` uses `@mirta/workspace` and `@mirta/package`, reading the `workspaces` field from the root `package.json`.

**Not intended for execution in Duktape environment on Wiren Board controllers.**

## 📦 Installation

```sh
pnpm add -wD @mirta/cli
```

✅ This package was designed for the Mirta framework but works in any `pnpm` monorepo with synchronized versioning.

## 🚀 Quick Start

**Trigger a release**:

```sh
pnpm mirta release
```
Select the update type → all versions will be updated.

**Publish (in CI or locally)**:

```sh
pnpm mirta publish
```
All public packages will be published to NPM.

## 🧰 Commands

### `pnpm mirta release`

Prepares a release: detects the current version, prompts you to choose an update type (`patch`, `minor`, `major`, `pre*`), and applies it to all packages containing the `version` field.

<details>
  <summary>Technical Details</summary>

  The process is divided into several steps.

  Step 1: If the project is git-connected, it first checks:
  - Sync status with `origin`.
  - CI pipeline success (via the `build` workflow).

  Step 2: For paths listed in `mirta.config.json#templates`, performs recursive discovery of `package.json` files and updates monorepo dependencies (`dependencies`, `devDependencies`) accordingly.

  Step 3: Runs `pnpm run changelog` if the script exists.

  Step 4: If GitHub connection is via `ssh`, creates a commit and a tag:
  ```sh
  git commit -m "release: vX.X.X"
  git tag vX.X.X
  ```
  If connected via `https`, changes remain in the working directory. You can commit them manually or use a GUI client (e.g., GitHub Desktop).

</details>

#### Supported Options

`--dry` — runs the command in simulation mode. Shows what would change but does not apply modifications.

`--preid` `<id>` — sets a custom pre-release identifier (e.g., `alpha`, `beta.1`, `rc`).

`--skipPrompts` — skips interactive prompts, using default values.

`--skipGit` — disables creating a commit and tag. Git changes remain uncommitted.

#### Frequently Asked Questions

<details>
  <summary>Why synchronized versioning?</summary>

  All packages in the monorepo receive the same version upon release.

  This is useful when:
  - Packages are tightly coupled (e.g., parts of the same framework),
  - Compatibility matters: `@mirta/cli@0.4.0` is guaranteed to work with `@mirta/package@0.4.0`,
  - Dependency management needs to be simplified.

  Compared to independent versioning, synchronized versioning:
  - Simplifies publishing,
  - Reduces version conflicts,
  - Makes releases atomic: all packages update together.

  💡 If you use `workspace:*`, during release all such references are replaced with the exact version — this is synchronized versioning in action.
</details>

<details>
  <summary>What is "semantic" versioning?</summary>

  Semantic version follows the format `major.minor.patch`, where each segment indicates different levels of change:
  - `major` — breaking changes or major updates,
  - `minor` — new features without breaking compatibility,
  - `patch` — bug fixes.

  Versions before `1.0.0` (e.g., `0.4.0`) are considered experimental:<br/>
  any update may include breaking changes.

  Learn more at [semver.org](https://semver.org/)
</details>

<details>
  <summary>How to set up CHANGELOG.md generation?</summary>

  To generate a changelog file, add the [conventional-changelog-cli](https://www.npmjs.com/package/conventional-changelog-cli) package to devDependencies in the root `package.json`, and include the `changelog` script:

  ```json
  {
    "scripts": {
      "changelog": "conventional-changelog -p angular -i CHANGELOG.md -s"
    }
  }
  ```

  The automatically generated changelog is based on commits within the version range. Commit messages must follow these rules:
  1. Total line length must not exceed 50 characters;
  2. Use prefixes like `fix:`, `feat:`, `docs:`, `chore:`, etc.

  See full requirements in the [Commit Convention](https://github.com/wb-mirta/core/blob/latest/.github/commit-convention.md) document.
</details>

#### Advanced Usage

<details>
  <summary>Explicit version specification</summary>

  Sets exactly the version passed as an argument:

  ```sh
  pnpm mirta release 1.2.3
  ```
  ⚠️ **Warning!** Do not attempt to overwrite already published versions — NPM registry will reject them.
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

  **Incrementing pre-release version:**

  ```sh
  pnpm mirta release prerelease --preid alpha
  # 0.0.1-alpha.1
  ```
</details>

---

### `pnpm mirta publish`

Publishes packages to NPM, skipping those marked as `private: true`.

<details>
  <summary>Technical Details</summary>

  ⚠️ Typically executed in CI/CD after pushing the `vX.X.X` git tag.

  The NPM dist tag is determined automatically:
  - `alpha` → `--tag` `alpha`
  - `beta` → `--tag` `beta`
  - `rc` → `--tag` `rc`

  In CI environments (when `process.env.CI` is set), adds `--provenance`.
</details>

#### Supported Options

`--dry` — runs in simulation mode. Shows what would happen, but does not publish.

`--skipBuild` — skips running `pnpm run build` before publishing.

`--skipGit` — disables git state checks (equivalent to `--no-git-checks` in `pnpm publish`).

## ✅ Testing

The tool has been tested manually and in CI:
- Interactive and automated releases,
- Error handling (version rollback on failure),
- Git state and CI checks,
- Support for `--dry-run`.

## ⚠️ Limitations

**Runs only in Node.js** (not in Duktape).<br/>
Automatic commit and tag creation — only when connected to GitHub via `ssh`.

## Mirta Framework Special Options

Additional functionality is available by placing a `mirta.config.json` file in the repo root:

- `templates` — a list of paths to project template directories.<br/>
  Performs recursive scanning for `package.json` files in specified locations.

Example Mirta configuration:

```json
{
  "templates": [
    "packages/create-mirta/public/templates"
  ]
}
```