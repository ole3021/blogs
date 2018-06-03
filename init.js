const path = require("path");
const GHBlog = require("ghp-blogs");

const blogRoot = path.join(__dirname, "./blogs");
const dbFile = path.join(__dirname, "./blogs.db");

const blogs = new GHBlog("http://ole3021.me", blogRoot, dbFile);

const saveToFile = async () => {
  try {
    await blogs.generateIndex();
  } catch (error) {
    console.log(">>> failed with error", err);
  }
};

saveToFile();
