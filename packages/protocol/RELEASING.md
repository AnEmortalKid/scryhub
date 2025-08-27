# Steps to release this for myself

## Samples

Change package version then 

```bash
git add package.json package-lock.json
git commit -m "release: bump protocol to vX.Y.Z"
git tag protocol-vX.Y.Z
```

Install / test and build

```bash
npm ci
npm test --if-present
```

Publish just the `protocol` package

```
cd packages/protocol
npm publish --access public
cd -
```

Save our tags and branch

```
git push origin main
git push origin protocol-vX.Y.Z
```