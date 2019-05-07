import React, { Component } from "react";
import { Redirect } from "react-router-dom";
import axios from "axios";

//Higher order component.  Makes get request to '/api/verifyToken' to check
//authentication.
export default function withAuth(ProtectedComponent) {
  return class extends Component {
    constructor() {
      super();
      this.state = {
        //True when waiting on server response
        loading: true,
        //True when not verified.  Causes redirection to login page.
        redirect: false
      };
    }

    componentDidMount() {
      //Get request to 'api/verifyToken' to ensure browser has valid token
      axios
        .get("/api/verifyToken")
        .then(res => {
          if (res.status === 200) {
            this.setState({ loading: false });
          } else {
            const error = new Error("Server responded with error");
            throw error;
          }
        })
        .catch(err => {
          console.error(err);
          this.setState({ loading: false, redirect: true });
        });
    }

    render() {
      const { loading, redirect } = this.state;
      if (loading) {
        return null;
      }
      if (redirect) {
        return <Redirect to="/login" />;
      }
      return (
        <React.Fragment>
          <ProtectedComponent {...this.props} />
        </React.Fragment>
      );
    }
  };
}
