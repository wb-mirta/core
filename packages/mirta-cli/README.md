# @mirta/cli

[![en](https://img.shields.io/badge/lang-en-olivedrab.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-cli/README.md)
[![ru](https://img.shields.io/badge/lang-ru-dimgray.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-cli/README.ru.md)
[![NPM Version](https://img.shields.io/npm/v/@mirta/globals?style=flat-square)](https://npmjs.com/package/@mirta/cli)
[![NPM Downloads](https://img.shields.io/npm/dm/@mirta/cli?style=flat-square&logo=npm)](https://npmjs.com/package/@mirta/cli)

Utility for efficient release management and automated package publishing in NPM, supports work in monorepositories.

### Key Features

- Convenient system for updating project versions;
- Easy integration with existing CI/CD processes;
- Access to all necessary operations through intuitive commands;
- Support for customizing workflows specific to your infrastructure.

## Installation and Initial Setup

Add `@mirta/cli` as a development dependency to your project using the following command:

```sh
pnpm add -wD @mirta/cli
```
You can configure additional parameters by adding a configuration file named `mirta.config.json` at the root of your main project. For example:

```json
{
  "scope": "myscope",
  "scopeAsPackagePrefix": false
}
```
### Main Configuration Options

- `scope`

  ```
  Sets the correspondence to an account or organization name in the NPM registry.
  ```
- `scopeAsPackagePrefix`

  ```
  Enables transformation of module paths by prefixing the specified `scope` before the package name. Default is `false`.
  ```

Example of `scopeAsPackagePrefix` for the package `@myscope/globals`:

- Value `false`

  ```
  Location: `packages/globals`
  ```
- Value `true`

  ```
  Location: `packages/myscope-globals`
  ```

Activating this option helps prevent collisions with third-party NPM packages without a `scope`.

If you are satisfied with the default behavior of the tool, creating a separate configuration file is not required. Simply specify the scope in the main `package.json` file like so:

```json
{
  "name": "@myscope/myproject"
}
```

### Special Mirta Framework Options

- `templates` contains a set of paths to templates used by the project generation wizard. Performs recursive search for `package.json` files within the listed locations.

Example Mirta configuration:

```json
{
  "scopeAsPackagePrefix": true,
  "templates": [
    "packages/create-mirta/public/templates"
  ]
}
```
## Release Management

Performing the release procedure interactively:

```sh
pnpm mirta release
```
The command will prompt you to select an appropriate version. If the project is managed by Git, it will prepare a list of changes in the `CHANGELOG.md` file, check the CI status, and create a commit.

During operation with Git, the needed repository is automatically recognized, but two checks are performed:

1. Local changes have been synchronized with the remote storage beforehand;
2. The CI process named `Build` for the last commit has completed successfully.

To generate a change log file, add the [conventional-changelog-cli](https://www.npmjs.com/package/conventional-changelog-cli) package as a dev dependency in the root `package.json`. Additionally, include a `changelog` script in the `scripts` section:

```json
{
  "scripts": {
    "changelog": "conventional-changelog -p angular -i CHANGELOG.md -s"
  }
}
```
The changelog entries are based on commits made within the version range. There are requirements for commit headers:

1. Line length should not exceed 50 characters;
2. Use prefixes such as `fix:`, `feat:`, `docs:`, `chore:`, etc.

For the full list of requirements, refer to the framework's [Commit Convention](https://github.com/wb-mirta/core/blob/latest/.github/commit-convention.md).

### Semantic Versioning

A semantic version follows the format `major.minor.patch` (for example, `1.2.3`), where each segment represents different levels of changes:

- `major` increases when incompatible changes are introduced;
- `minor` increases when new functionality is added while maintaining backward compatibility;
- `patch` increases when bug fixes are applied, preserving backward compatibility.

Releasing with a specific version:

```sh
pnpm mirta release 1.2.3
```
Release specifying the incremented part:

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
Pre-release version specifying the type:

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
Incrementing an already existing pre-release version is done via

```sh
pnpm mirta release prerelease --preid alpha
# 0.0.1-alpha.1
```
## Automatic Publishing

Publish ready-made packages to the NPM repository:

```sh
pnpm mirta publish
```

This operation will initiate the build and publication process for the prepared packages.

If the process is triggered from a CI environment on GitHub, then every file inside the published package will be automatically enriched with [provenance information](https://docs.npmjs.com/generating-provenance-statements) - hash values and metadata that confirm its integrity and authenticity.

The primary goal of this feature is to enhance trust and security for published packages. When a package is published using this option, users can verify whether the content of the downloaded package matches the original source provided by the author.

## Auxiliary options

### `release` options

--dry

    Runs the command in simulation mode ("dry run"), showing changes that would be made without actually applying them. Useful for previewing changes before application.

--preid <custom-pre-release-id>

    Sets a custom prefix for the pre-release version, which is appended to the package version number (e.g., beta.1). This option allows creating pre-release versions such as alpha, beta, RC, etc., before the official stable release.

--skipPrompts

    Skips interactive user queries. The command runs automatically using default values or predefined settings.

--skipGit

    Ignores actions related to the Git version control system, such as committing changes, creating commit tags, or pushing updates to a remote repository. Might be useful if you wish to manage Git operations manually later.

### `publish` options

--dry

    Runs the command in simulation mode ("dry run"), showing changes that would be made without actually applying them. Useful for previewing changes before application.

--skipBuild

    Excludes running the build process after updating package versions. Skips executing tasks defined in the build pipeline, allowing you to decide whether recompilation is necessary after changing version numbers.

--skipGit

    Ignores actions related to the Git version control system, such as committing changes, creating commit tags, or pushing updates to a remote repository. Might be useful if you wish to manage Git operations manually later.
