import React, { Component } from "react";
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
      modal: false,
      roomName: "",
      radius: 1
    };
    this.modalToggle = this.modalToggle.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }
  handleClick(event) {
    event.preventDefault();
    this.props.handleClick(this.state.roomName);
    this.setState({ roomName: "", modal: false });
  }
  handleChange(event) {
    this.props.setRadius(event.target.value);
  }
  modalToggle() {
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
                    value={this.state.roomName}
                    onChange={e => this.setState({ roomName: e.target.value })}
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
