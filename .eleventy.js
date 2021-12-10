//const { EleventyServerlessBundlerPlugin } = require("@11ty/eleventy");
const inspect = require("util").inspect;

module.exports = config => {
    config.addPassthroughCopy("prism/*");
}