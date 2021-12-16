const { EleventyServerlessBundlerPlugin } = require("@11ty/eleventy");
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");


module.exports = config => {

    config.addPlugin(EleventyServerlessBundlerPlugin, {
      name: "getcode"
    });
    config.addPlugin(syntaxHighlight);
}