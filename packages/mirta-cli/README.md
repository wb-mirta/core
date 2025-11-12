# @mirta/cli

[![en](https://img.shields.io/badge/lang-en-olivedrab.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-cli/README.md)
[![ru](https://img.shields.io/badge/lang-ru-dimgray.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-cli/README.ru.md)
[![NPM Version](https://img.shields.io/npm/v/@mirta/globals?style=flat-square)](https://npmjs.com/package/@mirta/cli)
[![NPM Downloads](https://img.shields.io/npm/dm/@mirta/cli?style=flat-square&logo=npm)](https://npmjs.com/package/@mirta/cli)

> A universal command-line tool for releasing and publishing packages in monorepositories with synchronized semantic versioning.

`@mirta/cli` is a release orchestrator that:
- Synchronously updates versions in monorepo packages,
- Generates `CHANGELOG` (if configured),
- Publishes packages to NPM with `--provenance` support in CI.

Version updates apply only to packages containing the `version` field in `package.json`.  
Packages with `private: true` are not published to NPM.

Works in any monorepository using `pnpm` and following the principle of synchronized semantic versioning.

To automatically detect project structure, `@mirta/cli` uses the packages `@mirta/workspace` and `@mirta/package`, reading the `workspaces` field in the root `package.json`.

**Not intended for execution in the Duktape environment on Wiren Board controllers.**

## 📦 Installation

```sh
pnpm add -wD @mirta/cli
```

✅ This package was developed for the Mirta framework but works in any `pnpm`-based monorepository with synchronized versioning.

## 🚀 Quick Start

**Add scripts to the root `package.json`**:

```json
{
  "scripts": {
    "release": "mirta release",
    "publish": "mirta publish"
  }
}
```

**Run the release**:

```sh
mirta release
```

Select the update type → versions will be updated.

**Publish (in CI or locally)**:

```sh
mirta publish
```

All public packages will be sent to NPM.

## 🧰 Commands

### `pnpm mirta release`

Prepares a release: determines the current version, prompts for the update type (`patch`, `minor`, `major`, `pre*`), and applies it to all packages that have the `version` field.

Before updating, if the project is linked to git, checks:
- Synchronization with `origin`.
- CI success (via the `build` workflow).

Also:
- Updates versions in templates (e.g., `create-mirta`) if specified in `mirta.config.json#templates`.
- Runs `pnpm run changelog` if the script exists.

If the GitHub connection uses `ssh`, creates a commit and tag:
```sh
git commit -m "release: vX.X.X"
git tag vX.X.X
```

With `https`, changes remain in the working directory.  
You can commit them manually or via a GUI client (e.g., GitHub Desktop).

#### Parameters

`--dry` — runs the command in simulation mode. Shows changes but does not apply them.

`--preid` `<id>` — sets a custom pre-release prefix (e.g., `alpha`, `beta.1`, `rc`).

`--skipPrompts` — skips interactive prompts. Uses default values.

`--skipGit` — does not create a commit or tag. Git changes remain in the working directory.

---

### `pnpm mirta publish`

Publishes all packages to NPM. Skips packages with `private: true`.

⚠️ Usually called in CI/CD after `git push` of the `vX.X.X` tag.

The tag is determined automatically:
- `alpha` → `--tag` `alpha`
- `beta` → `--tag` `beta`
- `rc` → `--tag` `next`

In CI (if `process.env.CI`), adds `--provenance`.

#### Parameters

`--dry` — runs the command in simulation mode. Shows changes but does not apply them.

`--skipBuild` — skips running `pnpm run build` before publishing.

`--skipGit` — disables git state checks (equivalent to `--no-git-checks` in `pnpm publish`).

## ✅ Testing

The tool has been tested manually and in CI:
- Interactive and automated releases.
- Error handling (version rollback on failure).
- Git state and CI checks.
- Support for `--dry-run`.

## ⚠️ Limitations

**Runs only in Node.js** (not in Duktape).  
Automatic commit and tag creation is supported only with `ssh` connection to GitHub.

## 🔄 Why Synchronized Versioning?

All monorepo packages receive the same version upon release.

This is useful when:
- Packages are tightly coupled (e.g., part of a single framework),
- Compatibility matters: `@mirta/cli@0.4.0` is guaranteed to work with `@mirta/package@0.4.0`,
- You want to simplify dependency management.

Compared to independent versioning, synchronized versioning:
- Simplifies publishing,
- Reduces version conflicts,
- Makes releases atomic: all packages are updated together.

💡 If you use `workspace:*`, during release all references are replaced with the exact version — this is synchronized versioning in action.

## Generating `CHANGELOG.md`

To generate a changelog file, add the [conventional-changelog-cli](https://www.npmjs.com/package/conventional-changelog-cli) package to dev dependencies, and include the `changelog` script in the `scripts` section:

```json
{
  "scripts": {
    "changelog": "conventional-changelog -p angular -i CHANGELOG.md -s"
  }
}
```

The changelog is generated based on commits within the current version scope. Commit message requirements:

1. Total line length must not exceed 50 characters.
2. Use prefixes like `fix:`, `feat:`, `docs:`, `chore:`, etc.

See the full requirements in the [Commit Convention](https://github.com/wb-mirta/core/blob/latest/.github/commit-convention.md) of the framework.

## Mirta Framework Specific Options

Additional settings are available by adding a `mirta.config.json` file to the repository root:

- `templates` contains paths to project template directories.<br/>
  Performs recursive search for `package.json` files in the listed locations.

Example Mirta configuration:

```json
{
  "templates": [
    "packages/create-mirta/public/templates"
  ]
}
```
