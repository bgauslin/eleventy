const pluginRev = require('eleventy-plugin-rev');
const sass = require('eleventy-sass');

module.exports = (eleventyConfig) => {
  eleventyConfig.addPlugin(pluginRev);
  eleventyConfig.addPlugin(sass, {
    rev: true,
  });

  return {
    dir: {
      input: 'src',
      output: 'dist'
    }
  };
};
