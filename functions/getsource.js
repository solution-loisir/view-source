const fetch = require("cross-fetch");
const escape = require('escape-html');
const Prism = require('prismjs');

async function handler(event) {

  const url = event.queryStringParameters.siteUrl;
  const result = await fetch(url);
  const textResult = await result.text();
  const escapeHTML = escape(textResult);
  const html = Prism.highlight(textResult, Prism.languages.js, 'js');
  
  const template = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Web x-ray</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link href="prism/prism.css" rel="stylesheet" />
</head>
<body>

<h1>Web x-ray</h1>

<form action="/getsource/" method="GET">
<label for="siteUrl">Enter site URL</label>
<input type="url" id="siteUrl" name="siteUrl" required>
<input type="submit">
</form>

<pre><code>${ escapeHTML }</code></pre>
<script src="prism/prism.js"></script>
</body>
</html>`;

  try {
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/html; charset=UTF-8",
      },
      body: template
    };
  } catch (error) {
    
    return {
      statusCode: error.httpStatusCode || 500,
      body: JSON.stringify(
        {
          error: error.message,
        },
        null,
        2
      )
    };
  }
}

exports.handler = handler;