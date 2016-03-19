var socketio = require('socket.io'),
    io,
    guestNumber = 1,
    names = {},
    namesUsed = [],
    currentRoom = {};

exports.listen = function (server) {
  // Listen to initial server
  io = socketio.listen(server);
  io.set('log level', 1);

  // Handle user connections
  io.sockets.on('connection', function (socket) {
    guestNumber = assignGuestName(socket, guestNumber, names, namesUsed);
    joinRoom(socket, 'Lobby');

    // Handle user actions
    handleBroadcastMessage(socket, names);
    handleChangeName(socket, names, namesUsed);
    handleJoinRoom(socket);

    // Handle request for list of occupied rooms
    socket.on('rooms', function () {
      socket.emit('rooms', io.sockets.manager.rooms);
    });

    // Handle client disconnection
    handleDisconnect(socket, names, namesUsed);
  });
}

/**
 * assignGuestName handles the naming of new users.
 * @return guestNumber, incremented for new user
 */
function assignGuestName(socket, guestNumber, names, namesUsed) {
  var name = 'Guest' + guestNumber;
  names[socket.id] = name;
  socket.emit('nameResult', {
    success: true,
    name: name
  });
  namesUsed.push(name);
  return guestNumber + 1;
}

/**
 * joinRoom handles a user joining a room
 */
function joinRoom(socket, room) {
  var usersInRoom,
      usersInRoomSummary,
      userSocketId;
  // Join room
  socket.join(room);
  currentRoom[socket.id] = room;
  socket.emit('joinResult', {
    room: room
  });
  // Announce new participant to room
  socket.broadcast.to(room).emit('message',{
    text: names[socket.id] + ' has joined ' + room + '.'
  });
  // Summarize room's current participants
  usersInRoom = io.sockets.clients(room);
  if (usersInRoom.length > 1) {
    usersInRoomSummary = 'Users currently in ' + room + ':';
    for (var i in usersInRoom) {
      userSocketId = usersInRoom[i].id;
      // Ignore 'this' participant
      if (userSocketId != socket.id) {
        if (i > 0) {
          usersInRoomSummary += ', ';
        }
        usersInRoomSummary += names[userSocketId];
      }
    }
    usersInRoomSummary += '.';
    socket.emit('message', {
      text: usersInRoomSummary
    });
  }
}

/**
 * handleChangeName handles user requests to change their name
 */
function handleChangeName(socket, names, namesUsed) {
  var prevName,
      prevNameIndex;
  
  socket.on('nameAttempt', function(name) {
    // Handle dis-allowed names
    if (name.indexOf('Guest') == 0) {
      socket.emit('nameResult', {
        success: false,
        message: 'Names cannot begin with \'Guest\''
      });
      return;
    }
    // Handle already-used names
    if (namesUsed.indexOf(name) >= 0) {
      socket.emit('nameResult', {
        success: false,
        message: 'That name is already being used.'
      });
    }
    // Handle name change
    prevName = names[socket.id];
    prevNameIndex = namesUsed.indexOf[prevName];
    delete namesUsed[prevNameIndex];
    namesUsed.push(name);
    names[socket.id] = name;
    socket.emit('nameResult', {
      success: true,
      name: name
    });
    socket.broadcast.to(currentRoom[socket.id]).emit('message', {
      text: prevName + ' is now known as ' + name + '.'
    });
  });
}

/**
 * handleBroadcastMessage broadcasts a message
 */
function handleBroadcastMessage(socket) {
  socket.on('message', function(message) {
    socket.broadcast.to(message.room).emit('message', {
      text: names[socket.id] + ': ' + message.text
    })
  });
}

/**
 * handleDisconnect handles client disconnection
 */
function handleDisconnect(socket) {
  socket.on('disconnect', function() {
    var index = namesUsed.indexOf(names[socket.id]);
    delete namesUsed[index];
    delete names[socket.id];
  });
}

/**
 * handleJoinRoom handles client joining a room
 */
function handleJoinRoom(socket) {
  socket.on('join', function(room) {
    socket.leave(currentRoom[socket.id]);
    joinRoom(socket, room.newRoom);
  });
}
