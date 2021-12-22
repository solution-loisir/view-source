# View-source
This is a fun project to test Eleventy [Serverless plugin](https://www.11ty.dev/docs/plugins/serverless/) and especialy the relatively new [`config` option](https://www.11ty.dev/docs/plugins/serverless/#bundler-options). Here's the live site: https://viewsrc.netlify.app/. Try it for yourself:
* Clone the repo: `git clone `
* Install dependencies: `npm ci`
* Start the dev server: `npm start`
## How it works
submit a URL using the provided form which trigers a GET method to a [Netlify function](https://www.netlify.com/products/functions/). Inside the serverless function, the URL is fetched and the content is returned as text. The template (index.njk) renders a colorized version using the [Syntax highlighting plugin](https://www.11ty.dev/docs/plugins/syntaxhighlight/). The same template (index.njk) is used at build time and for serverless rendering.

[![Netlify Status](https://api.netlify.com/api/v1/badges/9ee98422-9107-428b-bc75-ef9fd72f1be4/deploy-status)](https://app.netlify.com/sites/viewsrc/deploys)
