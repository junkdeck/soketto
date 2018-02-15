// cool stuff to implement:
// "user is typing"

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

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
// filesystem for logging
var fs = require('fs');
const logging = true;

// keeps track of currently connected users
// socket.id is used for key with another object for value which in turn contains the nickname.
// could be simplified but this also allows for other data such as connection time to be stored with the id.
var connected_users = new Object();
// keeps track of users currently typing.
var users_typing = new Array();

app.get('/', (req,res) => {
  // serves the HTML file to any client when connecting to *:3000
  res.sendFile(__dirname + '/index.html');
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
    console.log(socket.id + ' disconnected');
    logEntry(socket.id+":"+connected_users[socket.id].nick+" disconnected");
    io.emit('server_message', connected_users[socket.id].nick+' disconnected');
    // removes the disconnected user
    console.log(connected_users);
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
    console.log(connected_users[socket.id].nick+" is typing.");
    console.log(typing);
    io.emit('user_typing', socket.id)
  })
});

http.listen(3000, () => {
  logEntry('listening on *:3000');
});
