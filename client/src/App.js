import React, { Component } from "react";
import { BrowserRouter, Route } from "react-router-dom";
import Register from "./components/Register";
import Main from "./components/Main";
import Login from "./components/Login";
import withAuth from "./components/withAuth";
//Create client side socket
import * as io from "socket.io-client";
const socket = io.connect("http://localhost:5000");

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
