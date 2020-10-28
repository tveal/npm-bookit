# npm-bookit

> Generates a book from markdown files (*.md)

IMPORTANT: Requires Node **v12.19.0** or newer;
If using nvm, install node with: `nvm install --lts`

Install
```
npm i npm-bookit
```

Run from command-line
```
npx bookit init -i
```

Build
```
npx bookit build
```

Recommended: add a script to your package.json file, with debug mode on
```json
{
  "scripts": {
    "bookit": "bookit build -d"
  }
}
```
then you can run
```
npm run bookit
```

More at the [Bookit Handbook](doc/index.md)
