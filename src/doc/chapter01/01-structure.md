bcfe3d7d-28e8-4c6c-8e9d-8e24498c983a


# Structure

## Supported Parts of a Book
- [Front Matter](https://scribewriting.com/preface-vs-foreword-vs-introduction/)
  - Foreword
  - Preface
  - Introduction
- Body Matter
  - chapters
- Back Matter
  - Glossary
  - Appendix

## Source Folder Structure
```
home.md
foreword
  (*.md files)
preface
  (*.md files)
introduction
  (*.md files)
chapter<number>
  (*.md files)
glossary
  (*.md files)
appendix
  (*.md files)
```

Book pages (*.md files) are ordered by the default directory ordering
(filename). A good practice is to start your filenames with a number, and pad
with leading zeros as necessary. Often two-digits is sufficient (supports 0-99
proper order).

Examples:
```
chapter01
  00-first-page.md
  01-second-page.md
  99-last-page.md
```

They don't have to be sequential; just named such that they alphanumerically
sort as desired.