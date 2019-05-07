import React, { Component } from "react";
//Reactstrap components
import {
  Modal,
  ModalHeader,
  ModalBody,
  Form,
  Button,
  Input,
  InputGroup,
  InputGroupAddon
} from "reactstrap";

class ModalItem extends Component {
  constructor(props) {
    super(props);

    this.state = {
      //Determines if modals are opened or closed
      modal: false,
      //Name of room or user (depending on particular modal)
      name: ""
    };
    this.modalToggle = this.modalToggle.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }
  //Submits user or room name
  handleClick(event) {
    event.preventDefault();
    this.props.handleClick(this.state.name);
    this.setState({ name: "" });
    this.modalToggle();
  }
  //Sets radius when chat radius is changed
  handleChange(event) {
    this.props.setRadius(event.target.value);
  }
  //Toggles modal open or closed
  modalToggle() {
    //If on small screen with hamburger menu, collapse menu upon closing modal
    if (this.state.modal && typeof this.props.toggleNavbar !== "undefined") {
      this.props.toggleNavbar();
    }
    this.setState({ modal: !this.state.modal });
  }
  render() {
    return (
      <div>
        <div onClick={this.modalToggle}>{this.props.btnText}</div>
        <Modal
          isOpen={this.state.modal}
          toggle={this.modalToggle}
          className={this.props.className}
        >
          <ModalHeader toggle={this.modalToggle}>
            {this.props.title}
            {this.props.isRange ? this.props.radius : ""}
          </ModalHeader>
          <ModalBody>
            <Form>
              <InputGroup id="roomInput">
                {this.props.isRange ? (
                  <div className="rangeDiv">
                    <label>0.01</label>
                    <input
                      className="rangeInput"
                      type="range"
                      min="0.01"
                      max="1"
                      step="0.01"
                      onChange={e => this.handleChange(e)}
                      value={this.props.radius}
                    />
                    <label>1.0</label>
                  </div>
                ) : (
                  <Input
                    value={this.state.name}
                    onChange={e => this.setState({ name: e.target.value })}
                  />
                )}
                {this.props.isRange ? (
                  ""
                ) : (
                  <InputGroupAddon addonType="append">
                    <Button
                      type="submit"
                      onClick={this.handleClick}
                      color="secondary"
                    >
                      Submit
                    </Button>
                  </InputGroupAddon>
                )}
              </InputGroup>
            </Form>
          </ModalBody>
        </Modal>
      </div>
    );
  }
}

export default ModalItem;
