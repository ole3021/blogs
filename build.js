const GHBlog = require('gh-blogs');

const blogRepo = 'https://github.com/ole3021/blogs';
const options = {
  folder: './blogs',
  dbFile: './blogs.db'
};

const myBlogs = new GHBlog(blogRepo, options);

const dumpFile = async () => {
  try {
    await myBlogs.dumpFile();
    console.log('>>> Generate successfully.');
  } catch (error) {
    console.log('>>> Faild to generate index', error);
  }
};

dumpFile();
