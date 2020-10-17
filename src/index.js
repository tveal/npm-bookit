#!/usr/bin/env node
import { FileConnector } from './utils';

// TODO: this is outdated; update before intended use...

// get from config loader
const titles = {
  1: 'Dev Tool Setup',
};

const cx = new FileConnector('src', 'book');

cx.getChapters()
  .map((uow) => ({
    ...uow,
    title: `Chapter ${uow.chapter}: **${titles[uow.chapter] || ''}**`,
  }))
  .flatMap((chapter) => {
    console.log(chapter);
    return chapter.files;
  })
  .map((f) => console.log(f));
