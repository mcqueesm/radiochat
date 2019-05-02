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

let dev = "http://localhost:5000";
let production = "https://murmuring-refuge-67436.herokuapp.com/";
const socket = io.connect(
  production,
  { reconnect: true }
);

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      socket: socket,
      radius: 1
    };
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.setRadius = this.setRadius.bind(this);
  }
  setRadius(rad) {
    this.setState({ radius: rad });
  }
  login() {
    this.setState({ loggedIn: true });
  }
  logout() {
    this.setState({ loggedIn: false });
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
