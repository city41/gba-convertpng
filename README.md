# GBA Convert png

This is a nodejs based tool for converting png images to the tile data format used in GBA games.

HEADS UP: I make games for the e-Reader, and so far have not done mainstream GBA development. So possibly this tool is missing things for GBA dev. If so, please let me know.

## Publishing

gba-convertpng uses [semantic versioning](https://semver.org/)

Publishing a new version is done by bumping the version in package.json

```bash
yarn version
yarn version v1.22.19
info Current version: 0.0.2
question New version: 0.0.3
info New version: 0.0.3
Done in 16.19s.

git push
git push --tags
```

Once [the Publish action](https://github.com/city41/ereader-tools/actions/workflows/publish.yml) notices the version has changed, it will run a build and publish to npm.
