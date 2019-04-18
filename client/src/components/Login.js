import React, { Component } from "react";
import { Form, FormGroup, Label, Button, Col, Input } from "reactstrap";
import { Redirect } from "react-router-dom";
import axios from "axios";

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
      password: "",
      hasToken: false
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }
  componentWillMount() {
    axios.get("/api/verifyToken").then(res => {
      if (res.status === 200) {
        this.setState({ hasToken: true });
      }
    });
  }

  handleChange(e) {
    this.setState({
      [e.target.name]: e.target.value
    });
  }

  handleSubmit(e) {
    e.preventDefault();
    const { email, password } = this.state;
    const config = {
      headers: {
        "Content-Type": "application/json"
      }
    };

    // Request body
    const body = JSON.stringify({ email, password });

    axios
      .post("/api/login", body, config)
      .then(res => this.props.history.push("/"))
      .catch(err => {
        console.log(err);
      });
    return this.props.history.push("/");
  }

  render() {
    if (this.state.hasToken) {
      return <Redirect to="/" />;
    }
    return (
      <Form>
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

export default Login;
