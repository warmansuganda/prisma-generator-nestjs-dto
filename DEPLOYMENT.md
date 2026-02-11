# Deployment Guide

This guide covers how to build, test, and publish `@inofix/prisma-generator-nestjs-dto` to npm.

## Prerequisites

- **Node.js** ≥ 14 (see `.nvmrc`)
- **npm** account with publish access to the package scope
- **npm login** completed (`npm whoami` should succeed)

## Pre-deployment Checklist

Before publishing a new version:

1. **Run quality checks**
   ```sh
   npm run lint
   npm test
   npm run generate
   ```

2. **Update documentation**
   - Bump version in `README.md` examples if needed
   - Add release notes to `CHANGELOG.md`

3. **Verify package contents**
   ```sh
   npm pack --dry-run
   ```
   Only `dist/` and `package.json` are included (see `files` in `package.json`).

## Version Bumping

Update the version in `package.json` following [Semantic Versioning](https://semver.org/):

- **Patch** (1.0.**x**): Bug fixes, no breaking changes
- **Minor** (1.**x**.0): New features, backward compatible
- **Major** (**x**.0.0): Breaking changes

```sh
npm version patch   # 2.0.0 → 2.0.1
npm version minor   # 2.0.1 → 2.1.0
npm version major   # 2.1.0 → 3.0.0
```

This also creates a git tag and commit.

## Publishing to npm

### 1. Build

```sh
npm run build
```

### 2. Publish

```sh
# Dry run (no publish)
npm publish --dry-run

# Publish
npm publish
```

For scoped packages (`@inofix/...`), `publishConfig.access: "public"` ensures the package is public on npm.

### 3. Verify

```sh
npm view @inofix/prisma-generator-nestjs-dto
```

## Using a Local Path (Development)

To test the generator in another project before publishing:

```sh
# In the generator repo
npm run build
npm pack
# Creates prisma-generator-nestjs-dto-2.0.0.tgz

# In your NestJS project
npm install /path/to/prisma-generator-nestjs-dto/prisma-generator-nestjs-dto-2.0.0.tgz
```

Or use a relative path in `package.json`:

```json
{
  "devDependencies": {
    "@inofix/prisma-generator-nestjs-dto": "file:../prisma-generator-nestjs-dto"
  }
}
```

## CI/CD (Optional)

The project includes a GitHub Actions workflow (`.github/workflows/main.yml`) that runs on pull requests:

- Lint
- Tests
- Prisma generate

To automate publishing, add a release workflow that triggers on tags or manual dispatch:

```yaml
# .github/workflows/release.yml (example)
name: Release
on:
  push:
    tags:
      - 'v*'
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Store `NPM_TOKEN` in GitHub Secrets (from npm → Access Tokens → Generate New Token).

## Troubleshooting

### `npm publish` fails with 403

- Ensure you are logged in: `npm login`
- Check you have publish access to `@inofix/*`
- Scoped packages require `--access public` if not set in `package.json` (already configured)

### Build fails

- Run `npm ci` for a clean install
- Ensure Node.js ≥ 14
- Check `tsconfig.build.json` and `tsconfig.json` for path/config issues

### Generated output differs locally

- Ensure Prisma version matches: `prisma@^7.3.0`
- Run `npm run generate` in the generator repo to verify output
