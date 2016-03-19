var Chat = function (socket) {
  this.socket = socket;
}

Chat.prototype.sendMessage = function (room, text) {
  var message = {
    room: room,
    text: text
  };
  this.socket.emit('message', message);
}

Chat.prototype.changeRoom = function (room) {
  this.socket.emit('join', {
    newRoom: room
  });
}

Chat.prototype.processCommand = function (command) {
  var tokens = command.split(' '),
      words = tokens[0]
              .substring(1, words[0].length)
              .toLowerCase(),
      message = false;

  switch (command) {
    case 'join':
      var room;
      words.shift();
      room = words.join(' ');
      this.changeRoom(room);
      break;

    case 'name':
      var name;
      words.shift();
      name = words.join(' ');
      this.socket.emit('nameAttempt', name);
      break;

    default:
      message = 'Unrecognized command';
      break;
  }

  return message;
}
