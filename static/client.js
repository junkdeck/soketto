function scrollBottom(){
  let scrollbox = $('.msg_box_scroll');
  let e = $('#messages');
  scrollbox.scrollTop(e.height());
}
var socket = io({nick: $('#nick').val()});
let nickname = "";

socket.on('connect', function(){
  socket.emit('client_connect', {nick: $('#nick').val()});
});

$('form').submit(function(){
  let msg = $('#m').val();
  if(msg && !$("#nick").is(':focus')){
    // sends message if nickname field isn't in focus
    socket.emit('chat_message', msg);
    $('#messages').append($('<li>').text($("#nick").val()+": "+msg));
    $('#m').val('');
    scrollBottom();
  }else if($('#nick').is(':focus')){
    // removes focus from nickname field, updating it in the process
    $('#m').focus();
  }
  // disables page refresh on form submit
  return false;
});

$('#nick').focusin(function(){
  nickname = $(this).val();
})
$('#nick').focusout(function(){
  if(nickname != $(this).val()){
    // update the nickname on the server
    nickname = $(this).val();
    socket.emit('nick_change', nickname)
  }else{
    // same nickname, no change
  }
});

setInterval(function(){
  // check if user is typing
  let is_typing = $("#m").val() ? true : false;
  socket.emit('user_typing', is_typing);
}, 200)

socket.on('chat_message', function(chat_msg){
  $('#messages').append($('<li>').text(chat_msg.nick+": "+chat_msg.msg));
  scrollBottom();
});
socket.on('server_message', function(msg){
  $('#messages').append($('<li>').text(msg));
  scrollBottom();
});
socket.on('user_typing', function(id){
  console.log(id);
});
socket.on('online_users_list', function(list){
  // receives a 'connected_users' array
  $(".user_list").empty();

  for(var id in list){
    let user_is_typing = list[id].is_typing ? ' is typing' : '';
    $(".user_list").append("\
    <div class='user_box'>\
    "+list[id].nick+user_is_typing+"\
    </div>");
  }
});
