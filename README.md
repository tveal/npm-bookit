# npm-bookit

IMPORTANT: Requires Node v12.19.0+

If using nvm, install with:
```
nvm install --lts
```

Goal: An npm package to generate markdown books compatible with:
- view from source code servers such as GitHub, GitLab, BitBucket, etc.
- served as a webpage

Features:
- generate view-ready markdown book from src files
- use uuid as filenames in generated book to retain url when src filenames change
- allow chapter title config

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

Recommended: add a script to your package.json file
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

Supported Parts of a Book
- [Front Matter](https://scribewriting.com/preface-vs-foreword-vs-introduction/)
  - Preface
  - Foreword
  - Introduction
- Body Matter
  - chapters
- Back Matter
  - Glossary
  - Appendix

## Install/Test Plugin From Source

1. In a new/empty folder, initialize a new npm package
    ```
    npm init -y
    ```

2. Clone this repo to a subfolder, "plugin", and change directory to it
    ```
    git clone https://github.com/tveal/npm-bookit.git plugin
    cd plugin/
    ```

3. (Optional) checkout to a different branch in the plugin
    ```
    git checkout first-draft
    ```

4. Install deps, build plugin, then move back to the parent directory
    ```
    npm ci
    npm run build
    cd ..
    ```

5. Install the plugin to your new npm package
    ```
    npm i plugin/
    ```

When you make changes to the plugin, you'll need to repeat the following steps to get the changes in your npm package

1. Build the plugin
    ```
    cd plugin/
    npm run build
    cd ..
    ```

2. Install the newly built plugin
    ```
    npm i plugin/
    ```

## ToDo:
- ~~turn formatLine into array series of map for adorning things~~
- ~~img path sub~~
- ~~clean bookDir before build~~
- ~~add TOC header~~
- ~~figure out logging~~
- ~~cli pattern~~
- ~~bookit --init flag~~
  - ~~create src dir~~
  - ~~create book dir~~
  - ~~create bookit.yml~~
  - ~~create/append dev notes to README.md~~
  - ~~use CLI prompter for book sections to create~~
  - ~~create home.md~~
- ~~add line formatter to replace uuid src-to-book links~~
- ~~fix chapter-section numbering~~
- ~~add section page nav~~
- ~~remove logging on missing uuid in building meta~~
- add more logging
- yargs testing?
- cleanup connector logic/testing
  - improve test fixtures
    - TEST_FILE_FIXTURE = { srcFile, bookFile.split('\r\n') }
  - pull out formatting logic to formatter
  - standardize shared data (class?)
- make compatible with older node? (delete non-empty dir)
- add CI/CD
- formalize/polish doc
  - plugin readme
    - what is it?
    - how to install
    - how to use; dir structure, links, etc.
    - how to contrib
  - init doc
    - add link in readme to TOC
    - add link in readme to bookit.md
      - how to build the book
      - how to dev book; config directories, etc.
- add src file linter
  - ~~replace filename links with uuid links~~
- create bookit handbook