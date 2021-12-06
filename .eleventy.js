const { EleventyServerlessBundlerPlugin } = require("@11ty/eleventy");

module.exports = config => {
    config.addPlugin(EleventyServerlessBundlerPlugin, {
        name: "dynamic",
        redirects: "netlify-toml-builders"
    });
    config.dataFilterSelectors.add("page");
}