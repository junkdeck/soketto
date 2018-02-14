// cool stuff to implement:
// "user is typing"
// logging

function getUserIndexBySocketId(userArray, socketId){
  // finds the array index of a given socket id
  // takes an Object array with a '_id' key and a socket id
  return userArray.map((user) => {
    return user._id;
  }).indexOf(socketId);
}

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

// keeps track of currently connected users - used for the "who's online" list in the gui
var connected_users = new Array();

app.get('/', (req,res) => {
  // serves the HTML file to any client when connecting to *:3000
  res.sendFile(__dirname + '/index.html');
});

io.on('connect', (socket) => {
  // send login message to all users, save user in 'connected_users', update online list

  // stores socket id with nickname for display
  connected_users.push({
    _id: socket.id,
    nick: "user"
  });

  socket.on('client_connect', function(data){
    logEntry(socket.id +":"+data.nick+" has connected.");
    // 'client_connect' is sent from the client directly after a connection to transfer user-specific data
    // notify users of new connection
    io.emit('server_message', data.nick+' has connected');
    // finds the array index of the connected user's socket id
    let user_id = getUserIndexBySocketId(connected_users, socket.id);
    // updates the nickname on connection
    connected_users[user_id].nick = data.nick;
    // distributes the updated userlist
    io.emit('online_users_list', connected_users);
  });

  socket.on('disconnect', () => {
    // broadcast user disconnect and remove from 'connected users' list
    // finds the array index of the disconnected user's socket id
    let user_id = getUserIndexBySocketId(connected_users, socket.id);

    // notifies users of disconnect
    logEntry(socket.id+":"+connected_users[user_id].nick+" disconnected");
    io.emit('server_message', connected_users[user_id].nick+' disconnected');
    // removes the disconnected user
    connected_users.splice(user_id, 1);
    // distributes the updated userlist
    io.emit('online_users_list', connected_users);
  });

  socket.on('nick_change', (nick) => {
    let user_id = getUserIndexBySocketId(connected_users, socket.id);
    logEntry(connected_users[user_id].nick+" changed nickname to: "+nick);
    io.emit('server_message', connected_users[user_id].nick+" changed name to "+nick);
    connected_users[user_id].nick = nick;
    io.emit('online_users_list', connected_users);
  });

  socket.on('chat_message', (msg) => {
    logEntry(msg.nick + ": " + msg.msg);
    socket.broadcast.emit('chat_message', msg);
  });

  socket.on('user_typing', (typing) => {
    let user_id = getUserIndexBySocketId(connected_users, socket.id);
    console.log(connected_users[user_id].nick+" is typing.");
    io.emit('user_typing', socket.id)
  })
});

http.listen(3000, () => {
  logEntry('listening on *:3000');
});
