var http = require('http'),
    fs = require('fs'),
    path = require('path'),
    mime = require('mime'),
    moment = require('moment'),
    colors = require('colors'),
    cache = {},
    server;

// Create server
server = http.createServer(function (req, resp) {
  var filePath = false,
      absPath;
  
  // Log request
  console.log(
    moment().format()
    + '\t' + colors.red(req.method)
    + '\t' + colors.red(req.url)
  );

  // Define routes
  if (req.url == '/') {
    filePath = 'pub/index.html';
  } else {
    filePath = 'pub/' + req.url;
  }

  // Serve static files
  absPath = './' + filePath;
  serveStatic(resp, cache, absPath);
});

// Start server
server.listen(3000, function () {
  console.log('Server listening on port ' + colors.green('3000'));
});

/**
 * send404 sends an HTTP not found response.
 */
function send404(resp) {
  resp.writeHead(404, { 'ContentType': 'text/plain' });
  resp.write('Error 404: resourse not found.');
  resp.end();
}

/**
 * sendFile sends an HTTP response with file contents.
 */
function sendFile(resp, filePath, fileContents) {
  resp.writeHead(
      200,
      { 'ContentType': mime.lookup(path.baseName(filePath)) }
  );
  resp.end(fileContents);
}

/**
 * serveStatic serves static content, defined by the
 * absolute path, from either the cache or the file system.
 */
function serveStatic(resp, cache, absPath) {
  // Send cached content if it exists
  if (cache[absPath]) {
    sendFile(resp, absPath, cache[absPath]);
    return;
  }
  // Find in filesystem and send content
  fs.exists(absPath, function(exists) {
    // File not found: 404
    if (!exists) {
      send404(resp);
      return;
    }
    // File exists: serve it.
    fs.readFile(absPath, function(err, data) {
      if (err) {
        console.log("Sending 404");
        send404(resp);
        return;
      }
      // File found: cache and send
      cache[absPath] = data;
      sendFile(resp, absPath, data);
    });
  });
}
