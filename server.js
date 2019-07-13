  var express = require('express');     // Web Development Framework in the Node
  var app = express();
  var path = require('path');           // Module about path
  var fs = require('fs');               // FileSystem
  var soc_handle = require('./Handling/socket_io.js');
  var db_handle = require('./Database/xml2db.js');

  var TAG = 'server.js: ';

  // Service in static file in the folder('Client')
  app.use(express.static(path.join(__dirname, 'Client')));
  
  /* ssh key
     For use any navigator.geolocation function, we should use it.
     (If don't use it, we can see the warning console in the browser)  */
     
  const options = {
      key: fs.readFileSync('sslCertificate/privatekey.pem'),
      cert: fs.readFileSync('sslCertificate/certificate.pem')
  };
  var server = require('https').createServer(options, app);     // https protocol
  var io = require('socket.io').listen(server);                 // socket communication
  
  function Browser() {

    io.on('connection', function(client) {
          var clientKey = 'NULL';
          client.on('join', function(data) {
              clientKey = data.toString();
              console.log(TAG, 'Socket.io: A user (' + clientKey + ')(base64) is connected');
          });
      });
  }
  
  db_handle.perform();
  Browser();

  // Port: 8080 open the server
  server.listen(7532, function() {
      console.log(TAG, 'The server is listening on port 8080');
      soc_handle.init(io);
  });
