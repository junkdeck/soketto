console.log("|SOCKET-CLIENT INITIALIZED|");

var socket = io();
$('form').submit(function(){
  socket.emit('chat_message', $('#m').val());
  $('#m').val('');
  return false;
});
