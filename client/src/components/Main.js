import React, { Component } from "react";

//Bootstrap used by Reactstrap
import "bootstrap/dist/css/bootstrap.min.css";
//Reactstrap components
import {
  Alert,
  Button,
  InputGroup,
  InputGroupAddon,
  Input,
  Form,
  Fade
} from "reactstrap";
import "../App.css";

//Main component for RadioChat
class Main extends Component {
  constructor(props) {
    super(props);

    this.state = {
      //All local messages
      messages: [],
      //All room messages (deleted upon leaving room)
      roomMessages: [],
      //Stores message input
      input: "",
      //Your this.props.socket.id
      id: "",
      //Your current name
      name: "",
      //List of local names based on your radius
      localUsers: [],
      //Local rooms based on radius
      rooms: [],
      //Names of users in current room
      roomNames: [],
      //Stores 'change name' input
      newName: "",
      //Your current latitude longitude
      location: { latitude: "", longitude: "" },
      //Holds id of setInterval that periodically emits location and other info to server
      locationInterval: null,

      //False if modal closed, true if open
      modal: false,
      //On failure set to false, causing alert to render
      nameSuccess: true,
      //Name of user currently clicked on (for PM)
      alertMsg: "",
      activeName: null,
      //Name of current room
      activeRoom: null,
      //Controls fade in of alerts
      fadeIn: false
    };
    //bind 'this' to component methods
    this.handleSend = this.handleSend.bind(this);
    this.beginLocationEmit = this.beginLocationEmit.bind(this);
    this.setName = this.setName.bind(this);
    this.selectName = this.selectName.bind(this);
    this.selectRoom = this.selectRoom.bind(this);
    this.toggleFade = this.toggleFade.bind(this);
    this.addMessage = this.addMessage.bind(this);
    this.addRoomMessage = this.addRoomMessage.bind(this);
    this.addServerMessage = this.addServerMessage.bind(this);
    this.handleNameChangeResult = this.handleNameChangeResult.bind(this);
    this.updateLocationBasedInfo = this.updateLocationBasedInfo.bind(this);
    this.addPrivateMessage = this.addPrivateMessage.bind(this);
  }
  componentWillUpdate() {
    //Cause message window to scroll automatically for message overflow
    var elem = document.getElementById("message-window");
    elem.scrollTop = elem.scrollHeight;
  }
  /*componentWillUnmount() {
    clearInterval(this.state.locationInterval);
  }*/

  componentDidMount() {
    let current = this;

    let options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 10000
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.watchPosition(
        function(position) {
          current.setState({
            location: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }
          });
        },
        function error(msg) {
          alert("Please enable your GPS position feature.");
        },
        options
      );
    }
    this.beginLocationEmit(1000);
    /* This listener called when current chat room is no longer within client's
    chat radius and the server has ejected them from the room*/
    this.props.socket.on("force_leave", function() {
      current.setState({ activeRoom: null });
    });
    //Listener for messages emitted from current room
    this.props.socket.on("room_chat", this.addRoomMessage);
    //Once connected client begins emitting location info
    this.props.socket.on("on_connection", function(userInfo) {
      //this.props.socket id received from server
      current.setState({ id: userInfo.id }, () => {
        //emit location and set name received from server

        current.setName(userInfo.name);
      });
    });

    //Receive general messages from server
    this.props.socket.on("server_message", this.addServerMessage);
    //If name change successful, updates name, else handles failure
    this.props.socket.on("change_name_result", this.handleNameChangeResult);
    //Listens for location related updates from server
    this.props.socket.on("locals", this.updateLocationBasedInfo);
    //Listens for private messages from server
    this.props.socket.on("private", this.addPrivateMessage);
    //Join room after creating it
    this.props.socket.on("join_created_room", this.selectRoom);
  }
  /*Add private message to state.messages and state.roomMessages
  Obj Keys:
  msg - message sent from user
  name - name of sender*/
  addPrivateMessage(obj) {
    //add css class 'privateSyle' to message
    let message = `<span class='privateStyle'>${obj.name}</span>: ${obj.msg}`;
    this.setState({
      messages: [...this.state.messages, message],
      roomMessages: [...this.state.roomMessages, message]
    });
  }
  /*Add server message to state.messages and state.roomMessages
  Obj Keys:
  msg - message sent from server
  type - type of message (determines css)*/
  addServerMessage(obj) {
    let message = "<div class='" + obj.type + "'>" + obj.message + "</div>";
    this.setState({
      messages: [...this.state.messages, message],
      roomMessages: [...this.state.roomMessages, message]
    });
  }
  /*Add user message to state.roomMessages
  Obj Keys:
  msg - message sent from server
  name - name of sender*/
  addRoomMessage(obj) {
    let message = `<span class='nameStyle'>${obj.name}</span>: ${obj.msg}`;
    this.setState({ roomMessages: [...this.state.roomMessages, message] });
  }
  /*Add user message to state.messages
  Obj Keys:
  msg - message sent from server
  name - name of sender*/
  addMessage(obj) {
    console.log("in client addMessage, message is: ", obj.msg);
    let message = `<span class='nameStyle'>${obj.name}</span>: ${obj.msg}`;
    this.setState({ messages: [...this.state.messages, message] });
  }
  //Set state.name to name
  setName(name) {
    this.setState({ name: name });
  }
  //Sends latitude/longitude of device to server every 'interval' milliseconds
  beginLocationEmit(interval) {
    let current = this;
    //Save setInterval id in state as 'locationInterval'
    this.setState({
      locationInterval: setInterval(function() {
        //Send client id, location, and activeRoom to server
        if (!current.state.id) {
          current.props.socket.emit("request_user_info");
        }
        current.props.socket.emit("location_update", {
          id: current.state.id,
          location: current.state.location,
          room: current.state.activeRoom
        });
      }, interval)
    });
  }
  /*Handles response from server upon name change request
  Obj Keys:
  success - true if name successfully changed, false otherwise
  name - new name (null on failure)*/
  handleNameChangeResult(result) {
    //Upon failure trigger nameSuccess and toggleFade for alert
    if (!result.success) {
      this.setState({ nameSuccess: result.success });
      this.toggleFade();
      this.setState({ alertMsg: result.msg });
      //Fade out alert after 3 seconds
      let intervalID1 = setInterval(() => {
        this.toggleFade();
        clearInterval(intervalID1);
      }, 3000);
      //Remove alert after 4 seconds
      let intervalID2 = setInterval(() => {
        this.setState({ nameSuccess: true, alertMsg: "" });
        clearInterval(intervalID2);
      }, 4000);
    }
    //Set name upon success
    else {
      this.setName(result.name);
    }
  }
  //Handles messages sent by client
  handleSend(event) {
    event.preventDefault();
    //Send private message if user is selected from guest list
    if (this.state.activeName) {
      this.props.socket.emit("private", {
        msg: this.state.input,
        recipient: this.state.activeName,
        name: this.state.name
      });
    }
    //Else if user is in a room, send to the room
    else if (this.state.activeRoom) {
      this.props.socket.emit("room_chat", {
        msg: this.state.input,
        room: this.state.activeRoom
      });
    }
    //If none of the above, emit message to own id
    else if (!this.state.activeName) {
      console.log("emitting message: ", this.state.input);
      this.props.socket.emit(this.state.name, {
        msg: this.state.input,
        name: this.state.name
      });
    }
    //Clear input from state
    this.setState({ input: "" });
  }

  //Handle clicking on name in Guest menu
  selectName(name) {
    this.setState(({ activeName }) => {
      //If name already selected, or is client name, set activeName to null
      if (activeName === name || name === this.state.name) {
        return { activeName: null };
      }
      //otherwise set activeName to name
      return { activeName: name };
    });
  }
  //Handle room selection
  selectRoom(name) {
    //Clear room messages and deselect Guest names
    this.setState({ roomMessages: [], activeName: null });
    this.setState(({ activeRoom }) => {
      //If in room, leave it
      if (activeRoom) {
        this.props.socket.emit("leave_room", {
          room: activeRoom,
          name: this.state.name
        });
      }
      //If clicking on room already selected, unselect
      if (activeRoom === name) {
        return { activeRoom: null };
      }
      //Otherwise join the selected room
      else {
        this.props.socket.emit("join_room", {
          room: name,
          name: this.state.name
        });
        return { activeRoom: name };
      }
    });
  }

  //Toggles state.fadeIn, which controls fade of alerts
  toggleFade() {
    this.setState({
      fadeIn: !this.state.fadeIn
    });
  }
  /*Handles response from server after client emits location information
  Obj Keys:
  names - array of all local user names
  rooms - array of all local Rooms
  roomNames - array of user names of users in current room (empty array if no room selected)
  */
  updateLocationBasedInfo(obj) {
    //Update rooms and roomNames
    this.setState({ rooms: obj.rooms, roomNames: obj.roomNames });
    //Users who have left since last update
    let noLonger = this.state.localUsers.filter(x => !obj.names.includes(x));
    //Users who have joined since last update
    let newUsers = obj.names.filter(x => !this.state.localUsers.includes(x));
    //Remove listeners for users who are no longer local
    if (noLonger) {
      noLonger.forEach(x => {
        this.props.socket.off(x, this.addMessage);
      });
    }
    //Add listener for users who are local
    if (newUsers) {
      newUsers.forEach(x => {
        this.props.socket.on(x, this.addMessage);
      });
    }
    //Update localUsers
    this.setState({ localUsers: obj.names });
    //Unselect room if room no longer exists
    if (!this.state.rooms.includes(this.state.activeRoom)) {
      this.setState({ activeRoom: null });
    }
    //Unselect user name if user no longer exists
    if (!this.state.localUsers.includes(this.state.activeName)) {
      this.setState({ activeName: null });
    }
  }

  render() {
    let messageList = this.state.messages.map((x, index) => {
      return (
        <div
          className="message-item"
          key={index}
          dangerouslySetInnerHTML={{ __html: x }}
        />
      );
    });
    let roomMessageList = this.state.roomMessages.map((x, index) => {
      return (
        <div
          className="message-item"
          key={index}
          dangerouslySetInnerHTML={{ __html: x }}
        />
      );
    });
    let nameList = this.state.localUsers.map((x, index) => {
      return (
        <div className="clickable" key={index}>
          <ListClickable
            isActive={this.state.activeName === x}
            id={index}
            item={x}
            handleClick={this.selectName}
          />
        </div>
      );
    });
    let roomNameList = this.state.roomNames.map((x, index) => {
      return (
        <div className="clickable" key={index}>
          <ListClickable
            isActive={this.state.activeName === x}
            id={index}
            item={x}
            handleClick={this.selectName}
            className="clickable"
          />
        </div>
      );
    });

    let roomList = this.state.rooms.map((x, index) => {
      return (
        <ListClickable
          isActive={this.state.activeRoom === x}
          id={index}
          key={index}
          item={x}
          handleClick={this.selectRoom}
          className="clickable"
        />
      );
    });
    return (
      <div id="container">
        <div id="message-container">
          {!this.state.nameSuccess && (
            <div className="custom-alert">
              <Fade in={this.state.fadeIn}>
                <Alert color="danger">{this.state.alertMsg}</Alert>
              </Fade>
            </div>
          )}
          <div id="message-window">
            {this.state.activeRoom ? roomMessageList : messageList}
          </div>

          <div id="right-panel">
            <div id="user-list">
              <div className="headings">Guests</div>
              {this.state.activeRoom ? roomNameList : nameList}
            </div>
            <div id="room-list">
              <div className="headings">Rooms</div>
              {roomList}
            </div>
          </div>
        </div>
        <div id="textInput">
          <Form>
            <InputGroup>
              <Input
                className="textField"
                value={this.state.input}
                onChange={e => this.setState({ input: e.target.value })}
              />
              <InputGroupAddon addonType="append">
                <Button
                  type="submit"
                  onClick={this.handleSend}
                  color="secondary"
                >
                  Send
                </Button>
              </InputGroupAddon>
            </InputGroup>
          </Form>
        </div>
      </div>
    );
  }
}

class ListClickable extends Component {
  handleClick(event) {
    this.props.handleClick(event.target.id);
  }

  render() {
    return (
      <div
        onClick={e => this.handleClick(e)}
        id={this.props.item}
        className={this.props.isActive ? "clickedItem" : ""}
      >
        {this.props.item}
      </div>
    );
  }
}

export default Main;
