import React, { Component } from 'react';

import './App.css';
//Bootstrap used by Reactstrap
import 'bootstrap/dist/css/bootstrap.min.css';
//Reactstrap components
import {Alert, Button, InputGroup, InputGroupText, InputGroupAddon,
    Collapse, CardBody, Card, Input, Form, Navbar,
    NavbarToggler, NavbarBrand, Nav, NavItem, NavLink,
    Dropdown, DropdownMenu, DropdownToggle, Modal, ModalHeader,
    ModalBody, ModalFooter, Fade} from 'reactstrap';

//Create client side socket
import * as io from 'socket.io-client';
const socket = io.connect('http://localhost:5000');

//Main component for RadioChat
class App extends Component {
  constructor(props){
    super(props);

    this.state = {
      //All local messages
      messages: [],
      //All room messages (deleted upon leaving room)
      roomMessages: [],
      //Stores message input
      input: '',
      //Your socket.id
      id: '',
      //Your current name
      name: '',
      //List of local names based on your radius
      localUsers: [],
      //Local rooms based on radius
      rooms: [],
      //Names of users in current room
      roomNames: [],
      //Stores 'change name' input
      newName:'',
      //Your current latitude longitude
      location: {latitude: '', longitude: ''},
      //Holds id of setInterval that periodically emits location and other info to server
      locationInterval: null,
      //Chat radius
      radius: 1,
      //False if modal closed, true if open
      modal: false,
      //On failure set to false, causing alert to render
      nameSuccess: true,
      //Name of user currently clicked on (for PM)
      activeName: null,
      //Name of current room
      activeRoom: null,
      //Controls fade in of alerts
      fadeIn: false

    };
    //bind 'this' to component functions
    this.handleSend = this.handleSend.bind(this);
    this.beginLocationEmit = this.beginLocationEmit.bind(this);
    this.modalToggle = this.modalToggle.bind(this);
    this.handleNameChange = this.handleNameChange.bind(this);
    this.onDismiss = this.onDismiss.bind(this);
    this.setName = this.setName.bind(this);
    this.selectName = this.selectName.bind(this);
    this.handleRoomCreation = this.handleRoomCreation.bind(this);
    this.selectRoom = this.selectRoom.bind(this);
    this.setChatRadius = this.setChatRadius.bind(this);
    this.toggleFade = this.toggleFade.bind(this);
    this.addMessage = this.addMessage.bind(this);
    this.addRoomMessage = this.addRoomMessage.bind(this);
    this.addServerMessage = this.addServerMessage.bind(this);
    this.handleNameChangeResult = this.handleNameChangeResult.bind(this);
    this.updateLocationBasedInfo = this.updateLocationBasedInfo.bind(this);
    this.addPrivateMessage = this.addPrivateMessage.bind(this);
  }
  componentWillUpdate(){
    //Cause message window to scroll automatically for message overflow
    var elem = document.getElementById('message-window');
    elem.scrollTop = elem.scrollHeight;
  }
  componentDidMount() {
    let current = this;

    /* This listener called when current chat room is no longer within client's
    chat radius and they have left the room*/
    socket.on('force_leave', function(){
      current.setState({activeRoom: null});
    });
    //Listener for messages emitted from current room
    socket.on('room_chat', this.addRoomMessage);
    //Once connected client begins emitting location info
    socket.on('on_connection', function(userInfo){
      //socket id received from server
      current.setState({id: userInfo.id}, () => {
        //emit location and set name received from server
        current.beginLocationEmit(3000);
        current.setName(userInfo.name);
      });
    });
    //Room name already exists
    socket.on('room_fail', function(){
      console.log('This name already exists');
    });
    //Receive general messages from server
    socket.on('server_message', this.addServerMessage);
    //If name change successful, updates name, else handles failure
    socket.on('change_name_result', this.handleNameChangeResult);
    //Listens for location related updates from server
    socket.on('locals', this.updateLocationBasedInfo);
    //Listens for private messages from server
    socket.on('private', this.addPrivateMessage);

  }
  /*Add private message to state.messages and state.roomMessages
  Obj Keys:
  msg - message sent from user
  name - name of sender*/
  addPrivateMessage(obj){
    //add css class 'privateSyle' to message
    let message = "<span class='privateStyle'>" + obj.name + "</span>" + ': ' +obj.msg;
    this.setState({
      messages: [...this.state.messages, message],
      roomMessages: [...this.state.roomMessages, message]
    });
  }
  /*Add server message to state.messages and state.roomMessages
  Obj Keys:
  msg - message sent from server
  type - type of message (determines css)*/
  addServerMessage(obj){
    let message = "<div class='" + obj.type + "'>" + obj.message + "</div>";
    this.setState({messages: [...this.state.messages, message],
      roomMessages: [...this.state.roomMessages, message]});
  }
  /*Add user message to state.roomMessages
  Obj Keys:
  msg - message sent from server
  name - name of sender*/
  addRoomMessage(obj){
    let message = "<span class='nameStyle'>" + obj.name + "</span>" + ': ' +obj.msg;
    this.setState({roomMessages: [...this.state.roomMessages, message]});
  }
  /*Add user message to state.messages
  Obj Keys:
  msg - message sent from server
  name - name of sender*/
  addMessage(obj){
    console.log('in client addMessage, message is: ', obj.msg)
    let message = "<span class='nameStyle'>" + obj.name + "</span>" + ': ' +obj.msg;
    this.setState({messages: [...this.state.messages, message]});
  }
  //Set state.name to name
  setName(name) {
    this.setState({name: name});
  }
  //Sends latitude/longitude of device to server every 'interval' milliseconds
  beginLocationEmit(interval) {
    let current = this;
    //Save setInterval id in state as 'locationInterval'
    this.setState({locationInterval: setInterval(function(){
      //Send client id, location, activeRoom and chat radius to server
      socket.emit('location_update', {id: current.state.id, location: current.state.location,
      room: current.state.activeRoom, radius: current.state.radius});
    }, interval
    )});
  }
  /*Handles response from server upon name change request
  Obj Keys:
  success - true if name successfully changed, false otherwise
  name - new name (null on failure)*/
  handleNameChangeResult(result){
    //Upon failure trigger nameSuccess and toggleFade for alert
    if (!result.success){
      this.setState({nameSuccess: result.success});
      this.toggleFade();
      //Fade out alert after 3 seconds
      let intervalID1 = setInterval(()=>{
        this.toggleFade();
        clearInterval(intervalID1);
      }, 3000);
      //Remove alert after 4 seconds
      let intervalID2 = setInterval(()=>{
        this.setState({nameSuccess: true});
        clearInterval(intervalID2);
      }, 4000);
    }
    //Set name upon success
    else{
      this.setName(result.name);
    }
  }
  //Handles messages sent by client
  handleSend(event) {
    event.preventDefault();
    //Send private message if user is selected from guest list
    if(this.state.activeName){
      socket.emit('private', {msg: this.state.input, recipient: this.state.activeName,
        name: this.state.name});
    }
    //Else if user is in a room, send to the room
    else if(this.state.activeRoom){
      socket.emit('room_chat', {msg: this.state.input, room:this.state.activeRoom});
    }
    //If none of the above, emit message to own id
    else if(!this.state.activeName){
      console.log('emitting message: ', this.state.input);
      socket.emit(this.state.name, {msg: this.state.input, name: this.state.name});
    }
    //Clear input from state
    this.setState({input: ''});
  }
  modalToggle() {
    this.setState({modal: !this.state.modal});
  }
  handleNameChange(event) {
    event.preventDefault();
    socket.emit('change_name', this.state.newName);
    this.setState({newName: '', modal: !this.state.modal});
  }
  onDismiss() {
    this.setState({ nameSuccess: true });
  }
  selectName(name){
    console.log('in select name, name is ', name);
    this.setState( ({activeName}) => {
      if(activeName===name || name===this.state.name){
        return {activeName: null};
      }
      return {activeName: name};
    });
  }
  selectRoom(name){
    let current = this;
    this.setState({roomMessages: [], activeName: null});
    this.setState( ({activeRoom}) => {
      if(activeRoom){
        socket.emit('leave_room', {room: name, name: current.state.name});
      }
      if(activeRoom===name){
        return {activeRoom: null};
      }
      else{
        socket.emit('join_room', {room: name, name: current.state.name} );
        return {activeRoom: name};
      }
    });
  }
  handleRoomCreation(name){
    socket.emit('room_creation', {name: name, location: this.state.location});
  }
  setChatRadius(rad){
    this.setState({radius: rad});
    console.log(rad);
  }
  toggleFade() {
    this.setState({
        fadeIn: !this.state.fadeIn
    });
  }
  updateLocationBasedInfo(obj){
    this.setState({rooms: obj.rooms, roomNames: obj.roomNames});
    let noLonger = this.state.localUsers.filter(x => !obj.names.includes(x));
    let newUsers = obj.names.filter(x => !this.state.localUsers.includes(x));
    if (noLonger){
      noLonger.forEach(x => {
        socket.off(x, this.addMessage);
      });
    }
    if (newUsers){
      newUsers.forEach(x => {
        socket.on(x, this.addMessage);
      });
    }
    this.setState({localUsers: obj.names});
  }

render() {
  let current = this;
  if ("geolocation" in navigator){
    navigator.geolocation.getCurrentPosition(function(position) {
      current.setState({location: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
        }
      });
    });
  }
    let messageList = this.state.messages.map((x, index) => {
      return (
        <div className="message-item" key={index} dangerouslySetInnerHTML={{__html: x}} />
      );
    });
    let roomMessageList = this.state.roomMessages.map((x, index)=>{
      return (
        <div className="message-item" key={index} dangerouslySetInnerHTML={{__html: x}} />
      );
    });
    let nameList = this.state.localUsers.map((x, index) => {
      return (
        <div className='clickable'><ListClickable isActive={this.state.activeName==x} id={index} key={index}
          item={x} handleClick={this.selectName} /></div>
      );
    });
    let roomNameList = this.state.roomNames.map((x, index) => {
      return (
        <div className='clickable'><ListClickable isActive={this.state.activeName==x} id={index} key={index}
          item={x} handleClick={this.selectName} className='clickable'/></div>
      );
    });

    let roomList = this.state.rooms.map((x, index)=>{
      return (
        <ListClickable isActive={this.state.activeRoom==x} id={index} key={index}
        item={x} handleClick={this.selectRoom} className='clickable' />
      );
    });
    return (
      <div id="container">
      <div className='navigation' >
      <Navbar color="faded" light >
        <NavbarBrand className="mr-auto">RadioChat</NavbarBrand>
          <Nav>
          <NavItem className='nav-items'>
          <div onClick={this.modalToggle}>Change Name</div>
          <Modal isOpen={this.state.modal} toggle={this.modalToggle} className={this.props.className}>
            <ModalHeader toggle={this.modalToggle}>Enter new name:</ModalHeader>
            <ModalBody>
              <Form>
                <InputGroup id='nameInput'>
                  <Input value={this.state.newName} onChange={e=>this.setState({newName: e.target.value})}/>
                  <InputGroupAddon addonType="append"><Button type='submit' onClick={this.handleNameChange}
                    color="secondary">Submit</Button>
                  </InputGroupAddon>
                </InputGroup>
              </Form>
            </ModalBody>
          </Modal>
          </NavItem>
          <NavItem className='nav-items'>
          <ModalItem  btnText='Create Room' title='Enter room name:' handleClick={this.handleRoomCreation}/>
          </NavItem>
          <NavItem className='nav-items'>
          <ModalItem btnText='Chat Radius' title='Set chat radius (miles): ' isRange={true}
            setChatRadius={this.setChatRadius}/>
          </NavItem>
          </Nav>
      </Navbar>
    </div>

    {!this.state.nameSuccess ? (<Fade in={this.state.fadeIn}>
      <Alert color="danger" >That name is already in use!
      </Alert></Fade>) : <div></div>}
        <div id="message-container">
          <div id="message-window">
            {this.state.activeRoom ? roomMessageList : messageList}
          </div>
          <div id='right-panel'>
            <div id='user-list'>
              <div className='headings'>Guests</div>
              {this.state.activeRoom ? roomNameList : nameList}
            </div>
            <div id='room-list'>
              <div className='headings'>Rooms</div>
              {roomList}
            </div>
          </div>
          <Form>
            <InputGroup id='textInput'>
              <Input id='textField' value={this.state.input} onChange={e=>this.setState({input: e.target.value})}/>
              <InputGroupAddon addonType="append"><Button type='submit' onClick={this.handleSend}
                color="secondary">Send</Button>
              </InputGroupAddon>
            </InputGroup>
          </Form>
        </div>

      </div>
    );
  }
}

class ModalItem extends Component{
  constructor(props){
    super(props);

    this.state={
      modal: false,
      roomName: '',
      radius: 1
    };
    this.modalToggle = this.modalToggle.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }
  handleClick(event){
    event.preventDefault();
    this.props.handleClick(this.state.roomName);
    this.setState({roomName: '', modal: false});
  }
  handleChange(event){
    this.setState({radius: event.target.value}, ()=>{
      this.props.setChatRadius(this.state.radius);
    });
  }
  modalToggle() {
    this.setState({modal: !this.state.modal});
  }
  render(){
    return(
      <div>
      <div onClick={this.modalToggle}>{this.props.btnText}</div>
      <Modal isOpen={this.state.modal} toggle={this.modalToggle} className={this.props.className}>
        <ModalHeader toggle={this.modalToggle}>{this.props.title}
          {this.props.isRange ? this.state.radius : ''}</ModalHeader>
        <ModalBody>
          <Form>
            <InputGroup id='roomInput'>
              {this.props.isRange ? <div className='rangeDiv' ><label>0.1</label>
              <input className='rangeInput' type='range' min='0.1' max='1' step='0.1'
                onChange={e=>this.handleChange(e)} value={this.state.radius}/>
              <label>1.0</label></div>:
              <Input value={this.state.roomName} onChange={e=>this.setState({roomName: e.target.value})}/>}
              {this.props.isRange ? '' : <InputGroupAddon addonType="append"><Button type='submit' onClick={this.handleClick}
                color="secondary">Submit</Button>
              </InputGroupAddon> }
            </InputGroup>
          </Form>
        </ModalBody>
      </Modal>
      </div>
    );
  }
}
class ListClickable extends Component{

  handleClick(event){
    this.props.handleClick(event.target.id);
  }

  render(){

    return (
      <div onClick={e => this.handleClick(e)} id={this.props.item}
        className={this.props.isActive ? 'clickedItem' : ''}>{this.props.item}</div>
    );
  }
}

export default App;
