function divEscapedContentElement(message) {
  return $('<div></div>').text(message);
}

function divSystemContentElement(message) {
  return $('<div></div>').html('<i>' + message + '</i>');
}

function processUserInput(chatApp, socket) {
  var message = $('#send-message').val(),
      systemMessage;

  if (message.charAt(0) == '/') {
    // Process message as a command
    systemMessage = chatApp.processCommand(message);
    if (systemMessage) {
      $('#messages').append(divSystemContentElement(systemMessage));
    }
  } else {
    // Process message as a message
    chatApp.sendMessage($('#room').text(), message);
    $('#messages').append(divEscapedContentElement(message));
    $('#messages').scrollTop($('#messages').prop('scrollHeight'));
  }

  $('#send-message').val('');
}

var socket = io.connect();

$(document).ready(function () {
  var chatApp = new Chat(socket);

  // Render name change result
  socket.on('nameResult', function (result) {
    var message;

    if (result.success) {
      message = 'You are now known as ' + result.name + '.';
    } else {
      message = result.message;
    }
    $('#messages').append(divSystemContentElement(message));
  });

  // Render room change result
  socket.on('joinResult', function (result) {
    $('#room').text(result.room);
    $('#messages').append(divSystemContentElement('Room changed.'));
  });

  // Render new message
  socket.on('message', function (message) {
    $('#messages').append(divEscapedContentElement(message.text));
  });

  // Render room listing command
  socket.on('rooms', function (rooms) {
    $('#room-list').empty();

    for (var room in rooms) {
      room = room.substring(1, room.length);
      if (room !== '') {
        $('#room-list').append(divEscapedContentElement(room));
      }
    }

    $('#room-list div').click(function () {
      chatApp.processCommand('/join ' + $(this).text());
      $('#send-message').focus();
    });
  });

  // Request updated list of rooms
  setInterval(function () {
    socket.emit('rooms');
  }, 1000);

  $('#send-message').focus();

  // Process form
  $('#send-form').submit(function (e) {
    e.preventDefault();
    processUserInput(chatApp, socket);
    return false;
  });
});
