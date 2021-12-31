# View-source
This is a fun project to test Eleventy [Serverless plugin](https://www.11ty.dev/docs/plugins/serverless/) and especialy the relatively new [`config` option](https://www.11ty.dev/docs/plugins/serverless/#bundler-options). Here's the live site: https://viewsrc.netlify.app/. Try it for yourself:
1. Clone the repo: `git clone https://github.com/solution-loisir/view-source.git`
2. Install dependencies: `npm ci`
3. Start the dev server: `npm start`
## How it works
Submit a URL using the provided form which trigers a GET request to a [Netlify function](https://www.netlify.com/products/functions/). Inside the serverless function, the URL is fetched and the content is returned as text in global data using the `config` option. The template (index.njk) renders a colorized version using the [Syntax highlighting plugin](https://www.11ty.dev/docs/plugins/syntaxhighlight/). The same template (index.njk) is used at build time and for serverless rendering.
## Tech stack
* Node `v14`
* @11ty/eleventy@1.0.0-canary.48
* @11ty/eleventy-plugin-syntaxhighlight@3.1.3
* @netlify/functions@0.10.0
* cross-fetch@3.1.4

[![Netlify Status](https://api.netlify.com/api/v1/badges/9ee98422-9107-428b-bc75-ef9fd72f1be4/deploy-status)](https://app.netlify.com/sites/viewsrc/deploys)
