const fs = require('fs');
const url = require('url');
const path = require('path');
const sh = require('shorthash');

const fm = require('front-matter');

exports.stats = (path) => fs.statSync(path);

const isExist = (source) => fs.existsSync(source);
const isDirectory = (source) => fs.lstatSync(source).isDirectory();
const getDirectories = (source, root = source) => {
  return fs.readdirSync(source).reduce((allItems, name) => {
    const itemPath = path.join(source, name);
    if (isDirectory(itemPath))
      return allItems.concat(getDirectories(itemPath, root));

    const info = Object.assign(path.parse(itemPath.replace(root, '')), {
      stats: fs.statSync(itemPath)
    });
    return allItems.concat([info]);
  }, []);
};

exports.loadBlogs = (blogFolderPath) => {
  if (!isExist(blogFolderPath)) throw new Error('Blog folder not exist');
  if (!isDirectory(blogFolderPath)) throw new Error('Path is not folder');

  const blogsInfo = getDirectories(blogFolderPath);
  return blogsInfo;
};

const loadYamlInfo = (blogFilePath) => {
  const meta = fm(fs.readFileSync(blogFilePath, 'utf8')).attributes;

  return { meta };
};

const name2Id = (name) => {
  const result = name.replace(/[\W_]+/g, '-');
  if (name.length != result.length) return sh.unique(name); // Non alphaBet name will convert to short hashId
  return result;
};

exports.generateMetaInfo = (info, blogPath) =>
  info
    .filter((item) => item.ext === '.md') // read .md file only
    .map((item) => ({
      _id: name2Id(item.name),
      name: item.name,
      path: '/' + item.dir + '/' + item.name + item.ext,
      category: item.dir.split('/').filter((item) => item.length > 0),
      createdAt: item.stats.birthtime,
      updateAt: item.stats.mtime,
      size: item.stats.size,
      ...loadYamlInfo(path.join(blogPath, item.dir, item.base))
    }));

exports.getRepoInfo = (repo) => {
  const urlInfo = url.parse(repo);
  return urlInfo;
};
