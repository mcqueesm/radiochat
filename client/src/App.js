import React, { Component } from "react";
import MediaQuery from "react-responsive";
import { BrowserRouter, Route } from "react-router-dom";
import Register from "./components/Register";
import RadioNav from "./components/RadioNav";
import Main from "./components/Main";
import Login from "./components/Login";
import withAuth from "./components/withAuth";
import "./components/css/Register.css";
//Create client side socket
import * as io from "socket.io-client";
//Heroku url
let production = "https://murmuring-refuge-67436.herokuapp.com/";
const socket = io.connect(
  production,
  { reconnect: true }
);
//Primary component
class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      //Socket.io
      socket: socket,
      //Chat radius
      radius: 1
    };
    this.setRadius = this.setRadius.bind(this);
  }
  //Set the current chat radius
  setRadius(rad) {
    this.setState({ radius: rad });
  }

  render() {
    return (
      <BrowserRouter>
        <MediaQuery query="(max-device-width: 500px)">
          <Route
            path="/"
            render={props => (
              <RadioNav
                {...props}
                radius={this.state.radius}
                setRadius={this.setRadius}
                portrait={true}
                socket={this.state.socket}
              />
            )}
          />
        </MediaQuery>
        <MediaQuery query="(min-device-width: 500px)">
          <Route
            path="/"
            render={props => (
              <RadioNav
                {...props}
                radius={this.state.radius}
                setRadius={this.setRadius}
                portrait={false}
                socket={this.state.socket}
              />
            )}
          />
        </MediaQuery>
        <Route
          path="/"
          render={props => (
            <MainWithAuth {...props} socket={this.state.socket} />
          )}
          exact
        />
        <Route path="/register" component={Register} exact />
        <Route path="/login" component={Login} exact />
      </BrowserRouter>
    );
  }
}

const MainWithAuth = withAuth(Main);
export default App;
