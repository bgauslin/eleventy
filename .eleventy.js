const pluginRev = require('eleventy-plugin-rev');
const sass = require('eleventy-sass');

module.exports = (eleventyConfig) => {
  // Static assets.
  eleventyConfig.addPassthroughCopy('src/.htaccess');
  eleventyConfig.addPassthroughCopy('src/apple-touch-icon.png');
  eleventyConfig.addPassthroughCopy('src/favicon.svg');
  eleventyConfig.addPassthroughCopy('src/files');
  eleventyConfig.addPassthroughCopy('src/images');

  // Stylesheet.
  eleventyConfig.addPlugin(pluginRev);
  eleventyConfig.addPlugin(sass, {
    rev: true,
  });

  // Directory overrides.
  return {
    dir: {
      input: 'src',
      output: 'dist',
      layouts: '_layouts'
    }
  };
};
