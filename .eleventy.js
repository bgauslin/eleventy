const Nunjucks = require('nunjucks');
const pluginRev = require('eleventy-plugin-rev');
const sass = require('eleventy-sass');

module.exports = (eleventyConfig) => {
  // Use nunjucks for templating.
  let nunjucksEnvironment = new Nunjucks.Environment(
      new Nunjucks.FileSystemLoader('src/_includes'));
  eleventyConfig.setLibrary('njk', nunjucksEnvironment);

  // Static files.
  eleventyConfig.addPassthroughCopy('src/.htaccess');
  eleventyConfig.addPassthroughCopy('src/apple-touch-icon.png');
  eleventyConfig.addPassthroughCopy('src/favicon.svg');
  eleventyConfig.addPassthroughCopy({'src/img/*.*': 'img'});

  // Sass stylesheet.
  eleventyConfig.addPlugin(pluginRev);
  eleventyConfig.addPlugin(sass, {rev: true});

  // Configuration options.
  return {
    dir: {
      input: 'src',
      output: 'dist',
      layouts: '_layouts',
    },
    markdownTemplateEngine: 'njk',
  };
};
