const fs = require('fs');
const { loadBlogs, generateMetaInfo } = require('./utils');

const info = loadBlogs('./blogs');
console.info('>>> load blog success');
const meta = generateMetaInfo(info, './');
console.info('>>> generate meta info success');

const blogIndex = meta
  .map((item) => ({
    id: item._id,
    cover: item.meta.cover,
    path: item.path,
    title: item.meta.title,
    intro: item.meta.meta,
    category: item.meta.category,
    tags: item.meta.tags,
    createdAt: item.meta.created
  }))
  .filter((item) => item.id && item.cover && item.path && item.title);

fs.writeFileSync('./index.json', JSON.stringify(blogIndex, 2), 'utf8');

console.log('>>> write to index success');

process.exit(0);
