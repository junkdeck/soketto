// cool stuff to implement:
// "user is typing"
// show currently online users

function getUserIndexBySocketId(userArray, socketId){
  // finds the array index of a given socket id
  // takes an Object array with a '_id' key and a socket id
  return userArray.map((user) => {
    return user._id;
  }).indexOf(socketId);
}

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// keeps track of currently connected users - used for the "who's online" list in the gui
var connected_users = new Array();

app.get('/', (req,res) => {
  // serves the HTML file to any client when connecting to *:3000
  res.sendFile(__dirname + '/index.html');
});

io.on('connect', (socket) => {
  // send login message to all users, save user in 'connected_users', update online list
  console.log(socket.id +" has connected.");

  // stores socket id with nickname for display
  connected_users.push({
    _id: socket.id,
    nick: "user"
  });

  socket.on('client_connect', function(data){
    // 'client_connect' is sent from the client directly after a connection to transfer user-specific data
    // notify users of new connection
    io.emit('server_message', {msg: data.nick+' has connected'});
    // finds the array index of the connected user's socket id
    let user_id = getUserIndexBySocketId(connected_users, socket.id);
    // updates the nickname on connection
    connected_users[user_id].nick = data.nick;
    // distributes the updated userlist
    io.emit('online_users_list', connected_users);
    console.log(connected_users[user_id].nick + " connected");
  });

  socket.on('disconnect', () => {
    // broadcast user disconnect and remove from 'connected users' list
    // finds the array index of the disconnected user's socket id
    let user_id = connected_users.map((user) => {
      return user._id;
    }).indexOf(socket.id);

    // notifies users of disconnect
    console.log(connected_users[user_id].nick+" disconnected");
    io.emit('server_message', {msg:connected_users[user_id].nick+' disconnected'});
    // removes the disconnected user
    connected_users.splice(user_id, 1);
    // distributes the updated userlist
    io.emit('online_users_list', connected_users);
  });

  socket.on('chat_message', (msg) => {
    console.log(msg.nick + ": " + msg.msg);
    socket.broadcast.emit('chat_message', msg);
  });
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});
