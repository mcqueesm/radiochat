import React, { Component } from 'react';

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import {Alert, Button, InputGroup, InputGroupText, InputGroupAddon,
    Collapse, CardBody, Card, Input, Form, Navbar,
    NavbarToggler, NavbarBrand, Nav, NavItem, NavLink,
    Dropdown, DropdownMenu, DropdownToggle, Modal, ModalHeader,
    ModalBody, ModalFooter} from 'reactstrap';
import * as io from 'socket.io-client';

const socket = io.connect('http://localhost:5000');

class App extends Component {
  constructor(props){
    super(props);

    this.state = {
      messages: [],
      roomMessages: [],
      input: '',
      id: '',
      name: '',
      userNames: [],
      localUsers: [],
      rooms: [],
      roomNames: [],
      newName:'',
      location: {latitude: '', longitude: ''},
      locationInterval: null,
      collapse: false,
      dropdownOpen: false,
      modal: false,
      nameSuccess: true,
      activeName: null,
      activeRoom: null

    };
    this.handleSend = this.handleSend.bind(this);
    this.beginLocationEmit = this.beginLocationEmit.bind(this);
    this.toggleNavbar = this.toggleNavbar.bind(this);
    this.toggle = this.toggle.bind(this);
    this.modalToggle = this.modalToggle.bind(this);
    this.handleNameChange = this.handleNameChange.bind(this);
    this.onDismiss = this.onDismiss.bind(this);
    this.setName = this.setName.bind(this);
    this.selectName = this.selectName.bind(this);
    this.handleRoomCreation = this.handleRoomCreation.bind(this);
    this.selectRoom = this.selectRoom.bind(this);
  }
  componentWillUpdate(){
    var elem = document.getElementById('message-window');
    elem.scrollTop = elem.scrollHeight;
  }
  componentDidMount() {
    let current = this;
    /*socket.on('chat', function(msg){
      current.setState({messages: [...current.state.messages, msg]});
    });*/
    socket.on('room_chat', function(obj){
      let message = "<span class='nameStyle'>" + obj.name + "</span>" + ': ' +obj.msg;
      current.setState({roomMessages: [...current.state.roomMessages, message]});
    });
    socket.on('on_connection', function(userInfo){
      console.log("Client connecting")
      current.setState({id: userInfo.id}, () => {
        current.beginLocationEmit();
        current.setName(userInfo.name);
      });
    });
    socket.on('room_fail', function(){
      console.log('This name already exists');
    });

    socket.on('name_update', function(names){
      current.setState({userNames: names}, () => {console.log("Received these names: ",  names)});
    });

    socket.on('change_name_result', function(result){

      if (!result.success){
        current.setState({nameSuccess: result.success}, ()=>{console.log(current.state.nameSuccess)});
      }
      else{
        current.setState({name: result.name}, () => {console.log("My name changed to ", current.state.name)});
      }
    });

    socket.on('locals', function(obj){
      current.setState({rooms: obj.rooms, roomNames: obj.roomNames});
      let noLonger = current.state.localUsers.filter(x => !obj.names.includes(x));
      let newUsers = obj.names.filter(x => !current.state.localUsers.includes(x));
      console.log('No longer: ', noLonger);
      console.log('New users: ', newUsers);
      current.setState({localUsers: obj.names});
      if (noLonger){
        noLonger.forEach(x => {
          socket.off(x);
        });
      if (newUsers){
        newUsers.forEach(x => {
          socket.on(x, function(obj){
            let message = "<span class='nameStyle'>" + obj.name + "</span>" + ': ' +obj.msg;
            current.setState({messages: [...current.state.messages, message]});
          });
        });
      }
      }
      console.log("These are my local users: ", current.state.localUsers);
      console.log("These are my local rooms: ", current.state.rooms);
    });

    socket.on('private', function(obj){
      let message = "<span class='privateStyle'>" + obj.name + "</span>" + ': ' +obj.msg;
      current.setState(
        {messages: [...current.state.messages, message],
        roomMessages: [...current.state.roomMessages, message]
      }
      );
    });

  }
  setName(name) {
    let current = this;
    current.setState({name: name}) /*, () =>{
      socket.on(name, function(msg){
        current.setState({messages: [...current.state.messages, msg]});
      });
    })*/

  }

  beginLocationEmit() {
    let current = this;
    this.setState({locationInterval: setInterval(function(){
      socket.emit('location_update', {id: current.state.id, location: current.state.location,
      room: current.state.activeRoom});
    }, 3000

    )});
  }
  handleSend(event) {
    console.log('activeName: ', this.state.activeName);
    console.log('activeRoom: ', this.state.activeRoom);
    event.preventDefault();
    //socket.emit('chat', this.state.input);
    if(this.state.activeName){
      console.log('in first if');
      socket.emit('private', {msg: this.state.input, recipient: this.state.activeName,
        name: this.state.name});
    }
    else if(this.state.activeRoom){
      console.log('in second if');
      socket.emit('room_chat', {msg: this.state.input, room:this.state.activeRoom});
    }
    else if(!this.state.activeName){
      console.log('in third if');
      socket.emit(this.state.name, this.state.input);
    }

    this.setState({input: ''});

  }
  toggle() {
    this.setState({
      dropdownOpen: !this.state.dropdownOpen
    });
  }
  toggleNavbar() {
    this.setState({
      collapsed: !this.state.collapsed
    });
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
    this.setState({roomMessages: []});
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
        <div className="message-Item" key={index} dangerouslySetInnerHTML={{__html: x}} />
      );
    });
    let nameList = this.state.localUsers.map((x, index) => {
      return (
        <ListClickable isActive={this.state.activeName==x} id={index} key={index}
          item={x} handleClick={this.selectName} />
      );
    });
    let roomNameList = this.state.roomNames.map((x, index) => {
      return (
        <ListClickable isActive={this.state.activeName==x} id={index} key={index}
          item={x} handleClick={this.selectName} />
      );
    });

    let roomList = this.state.rooms.map((x, index)=>{
      return (
        <ListClickable isActive={this.state.activeRoom==x} id={index} key={index}
        item={x} handleClick={this.selectRoom} />
      );
    });
    return (
      <div id="container">
      <div>
      <Navbar color="faded" light>
        <NavbarBrand href="/" className="mr-auto">RadioChat</NavbarBrand>
        <NavbarToggler onClick={this.toggleNavbar} className="mr-2" />
        <Collapse isOpen={this.state.collapsed} navbar>
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
          <ModalItem title='Enter room name:' handleClick={this.handleRoomCreation}/>
        </Collapse>
      </Navbar>
    </div>
    {!this.state.nameSuccess ? (
      <Alert color="danger" isOpen={!this.state.nameSuccess} toggle={this.onDismiss}>That name is already in use!
      </Alert>) : <div></div>}
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
      roomName: ''
    };
    this.modalToggle = this.modalToggle.bind(this);
    this.handleClick = this.handleClick.bind(this);
  }
  handleClick(event){
    event.preventDefault();
    this.props.handleClick(this.state.roomName);
    this.setState({roomName: ''});
  }
  modalToggle() {
    this.setState({modal: !this.state.modal});
  }
  render(){
    return(
      <div>
      <div onClick={this.modalToggle}>Create Room</div>
      <Modal isOpen={this.state.modal} toggle={this.modalToggle} className={this.props.className}>
        <ModalHeader toggle={this.modalToggle}>{this.props.title}</ModalHeader>
        <ModalBody>
          <Form>
            <InputGroup id='roomInput'>
              <Input value={this.state.roomName} onChange={e=>this.setState({roomName: e.target.value})}/>
              <InputGroupAddon addonType="append"><Button type='submit' onClick={this.handleClick}
                color="secondary">Submit</Button>
              </InputGroupAddon>
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
