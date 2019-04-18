import React, { Component } from "react";
import { BrowserRouter, Route } from "react-router-dom";
import Register from "./components/Register";
import Main from "./components/Main";
import Login from "./components/Login";
import withAuth from "./components/withAuth";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loggedIn: false
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
        <Route path="/" component={withAuth(Main)} exact />
        <Route path="/register" component={Register} exact />
        <Route path="/login" component={Login} exact />
      </BrowserRouter>
    );
  }
}

export default App;
