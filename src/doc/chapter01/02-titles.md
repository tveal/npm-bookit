62ea9091-d535-4ff9-a15f-7d2c384b8df8
# Titles

In the Table of Contents (generated on the home page of the book), there are two
different types of titles to control:
1. Chapter Title
2. Chapter Page Title (or chapter section)

Generic page numbers are used for the other non-chapter sections of the book in
the TOC.

**Chapter titles** are set in the `bookit.yml` file

```yaml
chapterTitles:
  '1': Let's Get Started!
```

**Chapter page titles** are detected from each *.md file, the first occurrence
of a [markdown level 1 header](https://www.markdownguide.org/basic-syntax/)
(line starts with one `#`). NOTE: this title must be within the _first 5 lines of
the file_. For example:

```md
# Title of Page

content goes here...
```

Would have title: **Title of Page**

but, if it wasn't a level 1 title,

```md
## Level 2 Header

content goes here...
```

then the title would be derived from the filename; stripped of numbers and file
extension

Filename                       | TOC Title
-------------------------------|----------
00-getting-started-1.md        | getting started
00-file-with-second-dot.and.md | file with second dot

(just give each file a proper level 1 header and you're good to go)