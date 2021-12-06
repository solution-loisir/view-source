const { EleventyServerlessBundlerPlugin } = require("@11ty/eleventy");

module.exports = config => {
    config.addPlugin(EleventyServerlessBundlerPlugin, {
        name: "dynamic"
    });
}