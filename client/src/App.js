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

let production = process.env.PORT;
const socket = io.connect(production);

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      socket: socket
    };
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
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
        <MediaQuery query="(orientation: portrait)">
          <Route
            path="/"
            render={props => (
              <RadioNav {...props} portrait={true} socket={this.state.socket} />
            )}
          />
        </MediaQuery>
        <MediaQuery query="(orientation: landscape)">
          <Route
            path="/"
            render={props => (
              <RadioNav
                {...props}
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
