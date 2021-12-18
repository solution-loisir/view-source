const { EleventyServerlessBundlerPlugin } = require("@11ty/eleventy");
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");


module.exports = config => {
    config.addPlugin(EleventyServerlessBundlerPlugin, {
      name: "getcode",
      functionsDir: "./functions"
    });
    config.addPlugin(syntaxHighlight);
}