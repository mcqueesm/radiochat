import React, { Component } from "react";
import { Form, FormGroup, Label, Button, Col, Input } from "reactstrap";
import axios from "axios";

class Register extends Component {
  constructor(props) {
    super(props);
    this.state = {
      first: "",
      last: "",
      email: "",
      password: "",
      token: ""
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(e) {
    this.setState({
      [e.target.name]: e.target.value
    });
  }

  handleSubmit(e) {
    e.preventDefault();
    const { first, last, email, password } = this.state;
    const config = {
      headers: {
        "Content-Type": "application/json"
      }
    };

    // Request body
    const body = JSON.stringify({ first, last, email, password });

    axios
      .post("/api/register", body, config)
      .then(res => this.setState({ token: res.data.token }))
      .catch(err => {
        console.log(err);
      });
  }

  render() {
    return (
      <Form>
        <FormGroup>
          <Label for="first" sm={2}>
            First Name
          </Label>
          <Col sm={10}>
            <Input
              value={this.state.first}
              type="text"
              name="first"
              id="first"
              placeholder="Enter first name"
              onChange={e => this.handleChange(e)}
            />
          </Col>
        </FormGroup>
        <FormGroup>
          <Label for="last" sm={2}>
            Last Name
          </Label>
          <Col sm={10}>
            <Input
              value={this.state.last}
              type="text"
              name="last"
              id="last"
              placeholder="Enter last name"
              onChange={e => this.handleChange(e)}
            />
          </Col>
        </FormGroup>
        <FormGroup>
          <Label for="email" sm={2}>
            Email
          </Label>
          <Col sm={10}>
            <Input
              value={this.state.email}
              type="email"
              name="email"
              id="email"
              placeholder="Enter email"
              onChange={e => this.handleChange(e)}
            />
          </Col>
        </FormGroup>
        <FormGroup>
          <Label for="password" sm={2}>
            Password
          </Label>
          <Col sm={10}>
            <Input
              value={this.state.password}
              type="password"
              name="password"
              id="password"
              placeholder="Enter password"
              onChange={e => this.handleChange(e)}
            />
          </Col>
        </FormGroup>
        <FormGroup check row>
          <Col sm={{ size: 10, offset: 2 }}>
            <Button type="submit" onClick={e => this.handleSubmit(e)}>
              Submit
            </Button>
          </Col>
        </FormGroup>
      </Form>
    );
  }
}

export default Register;
