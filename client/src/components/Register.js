import React, { Component } from "react";
import { Alert, Form, FormGroup, Button, Col, Input } from "reactstrap";
import axios from "axios";

class Register extends Component {
  constructor(props) {
    super(props);
    this.state = {
      //Fields corresponding to form inputs
      first: "",
      last: "",
      email: "",
      password: "",
      //True if errors upon submit
      error: false,
      //Error messages from improper submit
      errorMsg: []
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }
  //Updates state corresponding to input fields
  handleChange(e) {
    this.setState({
      [e.target.name]: e.target.value
    });
  }
  //Post registration form upon submit
  handleSubmit(e) {
    e.preventDefault();
    const { first, last, email, password } = this.state;
    //set header
    const config = {
      headers: {
        "Content-Type": "application/json"
      }
    };

    // Request body
    const body = JSON.stringify({ first, last, email, password });
    //Post registration form
    axios
      .post("/api/register", body, config)
      .then(res => {
        if (res.status === 200) this.props.history.push("/login");
      })
      .catch(err => {
        this.setState({ error: true, errorMsg: err.response.data });
      });
  }

  render() {
    let errorMessages = this.state.errorMsg.map((err, index) => {
      return <div key={index}> * {err.msg} </div>;
    });

    return (
      <div id="register-container">
        <div className="title">
          <h1>Register New User</h1>
        </div>
        {this.state.error ? (
          <div>
            <Alert color="danger">{errorMessages}</Alert>
          </div>
        ) : null}
        <Form id="registration-form">
          <FormGroup row className="form-group">
            <Col sm={6}>
              <Input
                className="register-input"
                value={this.state.first}
                type="text"
                name="first"
                id="first"
                placeholder="First name"
                onChange={e => this.handleChange(e)}
              />
            </Col>

            <Col sm={6}>
              <Input
                className="register-input"
                value={this.state.last}
                type="text"
                name="last"
                id="last"
                placeholder="Last name"
                onChange={e => this.handleChange(e)}
              />
            </Col>
          </FormGroup>
          <FormGroup row className="form-group">
            <Col sm={12}>
              <Input
                className="register-input"
                value={this.state.email}
                type="email"
                name="email"
                id="email"
                placeholder="Enter email"
                onChange={e => this.handleChange(e)}
              />
            </Col>
          </FormGroup>
          <FormGroup row className="form-group">
            <Col sm={12}>
              <Input
                className="register-input"
                value={this.state.password}
                type="password"
                name="password"
                id="password"
                placeholder="Enter password"
                onChange={e => this.handleChange(e)}
              />
            </Col>
          </FormGroup>

          <Button type="submit" onClick={e => this.handleSubmit(e)}>
            Submit
          </Button>
        </Form>
      </div>
    );
  }
}

export default Register;
