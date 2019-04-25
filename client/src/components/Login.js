import React, { Component } from "react";
import { Alert, Form, FormGroup, Button, Col, Input } from "reactstrap";
import axios from "axios";

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
      password: "",
      hasToken: false,
      error: false,
      errorMsg: []
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }
  componentWillMount() {
    axios
      .get("/api/verifyToken")
      .then(res => {
        if (res.status === 200) {
          this.props.history.push("/");
        }
      })
      .catch(err => console.log(err));
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
          <h1>Sign In </h1>
        </div>
        {this.state.error ? (
          <div>
            <Alert color="danger">{errorMessages}</Alert>
          </div>
        ) : null}
        <Form id="registration-form">
          <FormGroup row>
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
          <FormGroup row>
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

export default Login;
