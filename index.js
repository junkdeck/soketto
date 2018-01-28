var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var connected_users = new Array();

app.get('/', (req,res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connect', (socket) => {
  console.log(socket.id +" has connected.");

  connected_users.push({
    _id: socket.id,
    nick: "user"
  });

  console.log(JSON.stringify(connected_users));

  socket.on('client_connect', function(data){
    io.emit('server_message', {msg: data.nick+' has connected'});

    let user_id = connected_users.map((user) => {
      return user._id;
    }).indexOf(socket.id);

    connected_users[user_id].nick = data.nick;

  });
  console.log("user connected");

  socket.on('disconnect', () => {
    // broadcast user disconnect and remove from 'connected users' list
    // finds the array index of the disconnected user's socket id
    let user_id = connected_users.map((user) => {
      return user._id;
    }).indexOf(socket.id);
    // delete the entry in 'connected users' list by slicing 'one' out
    console.log("USER INDEX: "+user_id);
    console.log(connected_users[user_id].nick+" disconnected");

    io.emit('server_message', {msg:connected_users[user_id].nick+' disconnected'});
    io.emit('remove_dc_user', {_id: socket.id});
    connected_users.splice(user_id, 1);
  });

  socket.on('chat_message', (msg) => {
    console.log("message: " + msg.msg);
    console.log("from: " + socket.id);
    socket.broadcast.emit('chat_message', msg);
  });
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});
