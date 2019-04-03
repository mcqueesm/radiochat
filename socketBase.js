const uuid = require('uuid');
let guestNum = 1;
let currentUsers = {};
let currentNames = [];
let rooms = {};

module.exports = function(io){
  io.on('connection', function(socket){
    console.log('CONNECTED!');

    guestNum = assignName(socket, guestNum, currentUsers, currentNames);

    socket.on('private', function(obj){
      let id = null;
      for (var user in currentUsers){
        if(currentUsers[user].name===obj.recipient){
          id = user;
          break;
        }
      }
      if(id){
        let message = obj.name + ': ' + obj.msg;
        io.to(id).emit('private', message);
        io.to(socket.id).emit('private', message);
      }
      else{
        io.to(socket.id).emit('private', 'Private message failed');
      }
    });

    socket.on('change_name', function(newName){
      let result = {};
      let oldName = currentUsers[socket.id].name;
      if (currentNames.includes(newName)){
        result = {success: false};
      }
      else{

        changeName(socket, newName, currentUsers, currentNames);
        result = {success: true, name: newName};
        createUserListeners(socket, [newName]);

      }

      socket.emit('change_name_result', result);
      io.emit('name_update', currentNames);
      //io.emit('chat', oldName + ' has changed name to ' + newName);

    });

    io.emit('name_update', currentNames);
    console.log('connected!');


    /*socket.on('chat', function(msg) {
      let message = currentUsers[socket.id].name + ': ' + msg;
      io.emit('chat', message);
    });*/

    socket.on('location_update', function(clientUser){

      currentUsers[clientUser.id].location = clientUser.location;
      let localNames = [];
      let lat1 = clientUser.location.latitude;
      let lon1 = clientUser.location.longitude;
      for (var user in currentUsers){

        let lat2 = currentUsers[user].location.latitude;
        let lon2 = currentUsers[user].location.longitude;
        if(distance(lat1, lon1, lat2, lon2) <= 1){
          localNames.push(currentUsers[user].name);
        }
      }
      console.log('Current Users: ', currentUsers);
      console.log('Current Names: ', currentNames);
      socket.emit('locals', localNames);
    });
    socket.on('disconnect', function(){
      console.log('DISCONNECTED!');

      handleDisconnect(socket, currentUsers, currentNames);
      io.emit('name_update', currentNames);
    })

    createUserListeners(socket, currentNames);
  });
  function assignName(socket, num, users, names){
    let userId = socket.id;
    let userObj = {
      id: userId,
      name: "Guest" + num,
      location: {latitude: 0, longitude: 0}
    };
    names.push(userObj.name);
    let userInfo = {userId: userObj};
    users[userId] = userObj;
    socket.emit('on_connection', userObj);
    return ++num;
  }
  function handleDisconnect(socket, users, names){
    let index = names.indexOf(users[socket.id].name);
    delete names[index];
    delete users[socket.id];
  }
  function changeName(socket, newName, users, names){
    let index = names.indexOf(users[socket.id].name);
    names[index] = newName;
    users[socket.id].name = newName;
  }
  function createUserListeners(socket, names){
    names.forEach(name => {
      socket.on(name, function(msg){
        let message = name + ': ' + msg;
        io.emit(name, message);
      });
    });
    console.log('Server events: ', socket.eventNames());
  }
  function distance(lat1, lon1, lat2, lon2, unit) {
        var radlat1 = Math.PI * lat1/180;
        var radlat2 = Math.PI * lat2/180;
        var radlon1 = Math.PI * lon1/180;
        var radlon2 = Math.PI * lon2/180;
        var theta = lon1-lon2;
        var radtheta = Math.PI * theta/180;
        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        dist = Math.acos(dist);
        dist = dist * 180/Math.PI;
        dist = dist * 60 * 1.1515;
        if (unit=="K") { dist = dist * 1.609344 }
        if (unit=="N") { dist = dist * 0.8684 }
        console.log("Distance: ", dist);
        return dist;
}
}
