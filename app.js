function logEntry(data){
  console.log(data);
  let date = new Date();
  if(logging){
    fs.appendFile("./chatlog",  date.getDate()+"/"+(date.getMonth()+1)+"/"+date.getFullYear()+
    " "+date.getHours()+":"+date.getMinutes()+" - "+data+"\n", (err) => {
      if(err){return console.log(err);}
    });
  }
}

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
// filesystem for logging
var fs = require('fs');
const logging = true;
// static file folders
app.use(express.static('static'));

// keeps track of currently connected users
// socket.id is used for key with another object for value which in turn contains the nickname.
// also keeps track of whether or not a user is typing
var connected_users = new Object();

app.get('/', (req,res) => {
  // serves the HTML file to any client when connecting to *:3000
  res.sendFile('./index.html');
});

io.on('connect', (socket) => {
  // send login message to all users, save user in 'connected_users', update online list

  // stores connected user info with socket.id as the key with an object containing properties as value
  connected_users[socket.id] = {
    nick: 'user'
  }

  socket.on('client_connect', function(data){
    logEntry(socket.id +":"+data.nick+" has connected.");
    // 'client_connect' is sent from the client directly after a connection to transfer user-specific data
    // notify users of new connection
    io.emit('server_message', data.nick+' has connected');
    // updates the nickname on connection
    connected_users[socket.id].nick = data.nick;
    // distributes the updated userlist
    io.emit('online_users_list', connected_users);
  });

  socket.on('disconnect', () => {
    // broadcast user disconnect and remove from 'connected users' list
    // notifies users of disconnect
    logEntry(socket.id+":"+connected_users[socket.id].nick+" disconnected");
    io.emit('server_message', connected_users[socket.id].nick+' disconnected');
    // removes the disconnected user
    delete connected_users[socket.id];
    // distributes the updated userlist
    io.emit('online_users_list', connected_users);
  });

  socket.on('nick_change', (nick) => {
    logEntry(connected_users[socket.id].nick+" changed nickname to: "+nick);
    io.emit('server_message', connected_users[socket.id].nick+" changed name to "+nick);
    connected_users[socket.id].nick = nick;
    io.emit('online_users_list', connected_users);
  });

  socket.on('chat_message', (msg_body) => {
    logEntry(connected_users[socket.id].nick + ": " + msg_body);
    socket.broadcast.emit('chat_message', {msg: msg_body, nick: connected_users[socket.id].nick});
  });

  socket.on('user_typing', (typing) => {
    connected_users[socket.id].is_typing = typing;
    socket.broadcast.emit('online_users_list', connected_users);
  })
});

http.listen(3000, () => {
  logEntry('listening on *:3000');
});
