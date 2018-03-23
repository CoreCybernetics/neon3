// Setup basic express server
var express= require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

http.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname));

// Chatroom
var numClients= 0;
var numUsers = 0;





function countCharacter(str){
  var i=0,l=str.length,c='',length=0;
  for(;i<l;i++){
    c=str.charCodeAt(i);
    if(0x0000<=c&&c<=0x0019){
      length += 0;
    }else if(0x0020<=c&&c<=0x1FFF){
      length += 1;
    }else if(0x2000<=c&&c<=0xFF60){
      length += 2;
    }else if(0xFF61<=c&&c<=0xFF9F){
      length += 1;
    }else if(0xFFA0<=c){
      length += 2;
    }
  }
  return length;
}

function fillzero(obj, len) { obj= '          '+obj; return obj.substring(countCharacter(obj)-len); }




io.on('connection', function (socket) {

  var addedUser = false;

  numClients ++;
  console.log('Client    connected : ' + fillzero((socket.username || "anomymous"),10)+'['+ socket.id +']' + '  [ Logged/Connected Clients : ' + numUsers +'/' + numClients + ' ]' );


  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
    console.log(socket.username + " says " + data);

  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;
    console.log('Client       Logged : ' + fillzero(socket.username,10)+'['+ socket.id +']' + '  [ Logged/Connected Clients : ' + numUsers +'/' + numClients + ' ]' );

    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    numClients--;

    if (addedUser) {
      --numUsers;
      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }

    console.log('Client Disconnected : ' + fillzero((socket.username || "anomymous"),10)+'['+ socket.id +']' + '  [ Logged/Connected Clients : ' + numUsers +'/' + numClients + ' ]' );

  });
});
