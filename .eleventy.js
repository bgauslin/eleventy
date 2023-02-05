const pluginRev = require('eleventy-plugin-rev');
const sass = require('eleventy-sass');

module.exports = (eleventyConfig) => {
  // Static files.
  eleventyConfig.addPassthroughCopy('src/.htaccess');
  eleventyConfig.addPassthroughCopy('src/apple-touch-icon.png');
  eleventyConfig.addPassthroughCopy('src/favicon.svg');

  // Sass stylesheet.
  eleventyConfig.addPlugin(pluginRev);
  eleventyConfig.addPlugin(sass, {
    rev: true,
  });

  // Configuration options.
  return {
    dir: {
      input: 'src',
      output: 'dist',
      layouts: '_layouts',
    }
  };
};
