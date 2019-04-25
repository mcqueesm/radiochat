var validator = require("validator");
let guestNum = 1;
let currentUsers = {};
let currentNames = [];
let rooms = {};

module.exports = function(io) {
  io.on("connection", function(socket) {
    console.log("CONNECTED!");

    guestNum = assignName(socket, guestNum, currentUsers, currentNames);

    socket.on("request_user_info", function() {
      socket.emit("on_connection", currentUsers[socket.id]);
    });
    socket.on("update_radius", function(rad) {
      currentUsers[socket.id].radius = rad;
    });
    socket.on("private", function(obj) {
      let id = null;
      for (var user in currentUsers) {
        if (currentUsers[user].name === obj.recipient) {
          id = user;
          break;
        }
      }
      if (id) {
        let name = validator.escape(obj.name);
        let message = validator.escape(obj.msg);
        io.to(id).emit("private", { name: name, msg: message });
        io.to(socket.id).emit("private", { name: name, msg: message });
      } else {
        io.to(socket.id).emit("private", "Private message failed");
      }
    });
    socket.on("room_creation", function(roomName) {
      roomName = validator.escape(roomName);
      let currentRooms = Object.keys(rooms);
      let isLength = validator.isLength(roomName, { min: 1, max: 20 });
      let isAlphNum = validator.isAlphanumeric(roomName);
      if (!isLength || !isAlphNum) {
        let result = {
          success: false,
          name: null,
          msg: "Room name must be 1-20 alphanumeric characters"
        };
        socket.emit("change_name_result", result);
      } else if (!currentRooms.includes(roomName)) {
        rooms[roomName] = {
          location: currentUsers[socket.id].location,
          names: []
        };
        currentRooms.push(roomName);
        console.log("here are current rooms", currentRooms);
        socket.emit("join_created_room", roomName);
      } else {
        let result = {
          success: false,
          name: null,
          msg: roomName + " already exists"
        };
        socket.emit("change_name_result", result);
      }
    });

    socket.on("change_name", function(newName) {
      let result = {};
      let oldName = currentUsers[socket.id].name;
      newName = validator.escape(newName);
      let isLength = validator.isLength(newName, { min: 1, max: 20 });
      let isAlphNum = validator.isAlphanumeric(newName);
      if (!isAlphNum || !isLength) {
        result = {
          success: false,
          name: null,
          msg: "Name must be 1-20 alphanumeric characters"
        };
      } else if (currentNames.includes(newName)) {
        result = {
          success: false,
          name: null,
          msg: newName + " is already taken"
        };
      } else {
        changeName(socket, newName, currentUsers, currentNames);
        result = { success: true, name: newName };
        createUserListeners(socket, [newName]);
        socket.off(oldName, handleChat);
      }

      socket.emit("change_name_result", result);

      //io.emit('chat', oldName + ' has changed name to ' + newName);
    });

    io.emit("name_update", currentNames);
    console.log("connected!");

    /*socket.on('chat', function(msg) {
      let message = currentUsers[socket.id].name + ': ' + msg;
      io.emit('chat', message);
    });*/

    socket.on("join_room", function(obj) {
      if (Object.keys(rooms).includes(obj.room)) {
        console.log("the name exists");
        rooms[obj.room].names.push(obj.name);
        console.log("current names changed to ", currentNames);
        socket.join(obj.room);
        currentUsers[socket.id].inRoom = obj.room;
        io.sockets.in(obj.name).emit("test", "is this room thing working?");
      }
    });
    socket.on("leave_room", function(obj) {
      rooms[obj.room].names = rooms[obj.room].names.filter(x => x !== obj.name);
      socket.leave(obj.room);
      currentUsers[socket.id].inRoom = null;
    });
    socket.on("room_chat", function(obj) {
      console.log(obj.room);
      let message = validator.escape(obj.msg);
      io.sockets.in(obj.room).emit("room_chat", {
        msg: message,
        name: currentUsers[socket.id].name
      });
    });
    /*Receives location related updates from client
    Obj Keys:
    id - client id
    location - object with latitude and longitude keys giving client position
    room - the client's current room name (null if no room)
     */
    socket.on("location_update", function(clientUser) {
      currentUsers[socket.id].location = clientUser.location;
      let name = currentUsers[socket.id].name;
      let localNames = [];
      let lat1 = clientUser.location.latitude;
      let lon1 = clientUser.location.longitude;
      let myRad = currentUsers[socket.id].radius;
      for (var user in currentUsers) {
        let lat2 = currentUsers[user].location.latitude;
        let lon2 = currentUsers[user].location.longitude;
        let dist = distance(lat1, lon1, lat2, lon2);
        if (
          dist <= myRad &&
          dist <= currentUsers[user].radius &&
          !currentUsers[user].inRoom
        ) {
          localNames.push(currentUsers[user].name);
        }
        if (currentUsers[socket.id].inRoom) {
          let roomName = currentUsers[socket.id].inRoom;
          let roomLat = rooms[roomName].location.latitude;
          let roomLon = rooms[roomName].location.longitude;
          if (distance(lat1, lon1, roomLat, roomLon) > myRad) {
            socket.leave(roomName);
            socket.emit("force_leave");
            rooms[roomName].names = rooms[roomName].names.filter(
              x => x !== name
            );
            currentUsers[socket.id].inRoom = null;
          }
        }
      }
      let localRooms = [];
      for (var room in rooms) {
        let lat2 = rooms[room].location.latitude;
        let lon2 = rooms[room].location.longitude;
        if (
          distance(lat1, lon1, lat2, lon2) <= currentUsers[socket.id].radius
        ) {
          localRooms.push(room);
        }
      }
      let roomMembers = [];
      if (rooms[clientUser.room]) {
        roomMembers = rooms[clientUser.room].names;
      }
      console.log("local names is now ", localNames);
      console.log("currentNames is now ", currentNames);
      console.log("local rooms is now ", localRooms);
      socket.emit("locals", {
        names: localNames,
        rooms: localRooms,
        roomNames: roomMembers
      });
    });
    socket.on("disconnect", function() {
      console.log("DISCONNECTED!");

      handleDisconnect(socket, currentUsers, currentNames);
      io.emit("name_update", currentNames);
    });

    createUserListeners(socket, currentNames);
  });
  function assignName(socket, num, users, names) {
    let userId = socket.id;
    let userObj = {
      id: userId,
      name: "Guest" + num,
      location: { latitude: 0, longitude: 0 },
      radius: 1,
      inRoom: null
    };
    names.push(userObj.name);
    let userInfo = { userId: userObj };
    users[userId] = userObj;
    socket.emit("on_connection", userObj);
    return ++num;
  }
  function handleDisconnect(socket, users, names) {
    let index = names.indexOf(users[socket.id].name);
    socket.off(users[socket.id].name, handleChat);
    delete names[index];
    delete users[socket.id];
  }
  function changeName(socket, newName, users, names) {
    let index = names.indexOf(users[socket.id].name);
    names[index] = newName;
    users[socket.id].name = newName;
  }
  function createUserListeners(socket, names) {
    names.forEach(name => {
      socket.on(name, handleChat);
    });
    console.log("Server events: ", socket.eventNames());
  }
  function handleChat(obj) {
    console.log("in server handleChat, message is: ", obj.msg);
    let message = validator.escape(obj.msg);
    io.emit(obj.name, { msg: message, name: obj.name });
  }
  function distance(lat1, lon1, lat2, lon2, unit) {
    lat1 = Math.floor(lat1 * 1000) / 1000;
    lon1 = Math.floor(lon1 * 1000) / 1000;
    lat2 = Math.floor(lat2 * 1000) / 1000;
    lon2 = Math.floor(lon2 * 1000) / 1000;
    console.log(lat1 + " " + " " + lon1 + " " + lat2 + " " + lon2);
    var radlat1 = (Math.PI * lat1) / 180;
    var radlat2 = (Math.PI * lat2) / 180;
    var radlon1 = (Math.PI * lon1) / 180;
    var radlon2 = (Math.PI * lon2) / 180;
    var theta = lon1 - lon2;
    var radtheta = (Math.PI * theta) / 180;
    var dist =
      Math.sin(radlat1) * Math.sin(radlat2) +
      Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    dist = Math.acos(dist);
    dist = (dist * 180) / Math.PI;
    dist = dist * 60 * 1.1515;
    if (unit == "K") {
      dist = dist * 1.609344;
    }
    if (unit == "N") {
      dist = dist * 0.8684;
    }
    console.log("Distance: ", dist);
    return dist;
  }
};
