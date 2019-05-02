import React, { Component } from "react";
import {
  Navbar,
  NavbarBrand,
  Nav,
  NavbarToggler,
  NavItem,
  Collapse
} from "reactstrap";
import ModalItem from "./ModalItem";
import axios from "axios";

//Bootstrap used by Reactstrap
import "bootstrap/dist/css/bootstrap.min.css";
import "../App.css";

class InnerNav extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.handleNameChange = this.handleNameChange.bind(this);
    this.handleRoomCreation = this.handleRoomCreation.bind(this);
    this.setChatRadius = this.setChatRadius.bind(this);
    this.logout = this.logout.bind(this);
  }
  //Send new name request to server
  handleNameChange(name) {
    this.props.socket.emit("change_name", name);
  }
  //Called after room is created
  handleRoomCreation(roomName) {
    this.props.socket.emit("room_creation", roomName);
  }
  //Called each time range input of chat radius changes
  setChatRadius(rad) {
    this.props.setRadius(rad);
    this.props.socket.emit("update_radius", rad);
  }

  logout() {
    axios.get("/api/logout", { withCredentials: true });
    this.props.history.push("/login");
  }
  render() {
    return (
      <Nav className={this.props.navClass}>
        {this.props.location.pathname === "/" && (
          <>
            <NavItem className="nav-items">
              <ModalItem
                btnText="Change Name"
                title="Enter new name: "
                handleClick={this.handleNameChange}
              />
            </NavItem>

            <NavItem className="nav-items">
              <ModalItem
                btnText="Create Room"
                title="Enter room name:"
                handleClick={this.handleRoomCreation}
              />
            </NavItem>
            <NavItem className="nav-items">
              <ModalItem
                btnText="Chat Radius"
                title="Set chat radius (miles): "
                isRange={true}
                radius={this.props.radius}
                setRadius={this.setChatRadius}
              />
            </NavItem>

            <NavItem className="nav-items">
              <div onClick={this.logout}>Logout</div>
            </NavItem>
          </>
        )}
        {(this.props.location.pathname === "/login" ||
          this.props.location.pathname === "/register") && (
          <>
            <NavItem className="nav-items">
              <div onClick={() => this.props.history.push("/login")}>
                Sign In
              </div>
            </NavItem>
            <NavItem className="nav-items">
              <div onClick={() => this.props.history.push("/register")}>
                Register
              </div>
            </NavItem>
          </>
        )}
      </Nav>
    );
  }
}

class RadioNav extends Component {
  constructor(props) {
    super(props);
    this.state = {
      //Toggles navigation collapse
      collapsed: true,
      //Toggles between portrait view and landscape
      portrait: this.props.portrait
    };
    this.toggleNavbar = this.toggleNavbar.bind(this);
  }
  toggleNavbar() {
    this.setState({
      collapsed: !this.state.collapsed
    });
  }
  render() {
    return (
      <div className="navigation">
        <Navbar color="faded" light>
          <NavbarBrand className="mr-auto">RadioChat</NavbarBrand>
          {this.state.portrait ? (
            <>
              <NavbarToggler onClick={this.toggleNavbar} className="mr-2" />

              <Collapse isOpen={!this.state.collapsed} navbar>
                <InnerNav
                  {...this.props}
                  navClass={this.state.portrait ? "portrait-nav" : null}
                />
              </Collapse>
            </>
          ) : (
            <InnerNav {...this.props} />
          )}
        </Navbar>
      </div>
    );
  }
}
export default RadioNav;
