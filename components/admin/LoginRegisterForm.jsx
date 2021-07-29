import Link from "next/link";
import { useState } from "react";
import { Button, Input, Form, Icon, Menu, Segment } from "semantic-ui-react";
import { useAlert } from "react-alert";
import axios from "axios";
import { object } from "joi";
import { useSelector, useDispatch } from "react-redux";
import { adminLoginSuccess } from "../../store";

export default function Loginform() {
  const [activeItem, setActiveItem] = useState("login");
  const [loginForm, setLoginForm] = useState({
    username: {
      value: "",
      error: false,
    },
    password: {
      value: "",
      error: false,
    },
  });
  const [registerForm, setRegisterForm] = useState({
    username: {
      value: "",
      error: false,
    },
    password: {
      value: "",
      error: false,
    },
    admin_register_password: {
      value: "",
      error: false,
    },
  });
  const alert = useAlert();
  const state = useSelector((state) => state);
  const dispatch = useDispatch();

  const loginInputChangeHandler = (e) => {
    setLoginForm({
      ...loginForm,
      [e.target.name]: {
        ...loginForm[e.target.name],
        value: e.target.value,
        error: false,
      },
    });
  };

  const submitLoginForm = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("/api/admin/login", {
        username: loginForm.username.value,
        password: loginForm.password.value,
      });

      if (
        response &&
        response.data &&
        response.data.success &&
        response.data.username
      ) {
        dispatch(adminLoginSuccess(response.data.username));
      }
    } catch (e) {
      if (e.response && e.response.data && e.response.data.message) {
        alert.error(e.response.data.message);
        if (e.response.data.path) {
          setLoginForm({
            ...loginForm,
            [e.response.data.path]: {
              ...loginForm[e.response.data.path],
              error: true,
            },
          });
        }
      }
    }
  };

  const registerInputChangeHandler = (e) => {
    setRegisterForm({
      ...registerForm,
      [e.target.name]: {
        ...registerForm[e.target.name],
        value: e.target.value,
        error: false,
      },
    });
  };

  const submitRegisterForm = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("/api/admin/register", {
        username: registerForm.username.value,
        password: registerForm.password.value,
        admin_register_password: registerForm.admin_register_password.value,
      });

      if (response && response.data && response.data.success) {
        alert.success("Success!");
        setActiveItem("login");
      }
    } catch (e) {
      if (e.response && e.response.data && e.response.data.message) {
        alert.error(e.response.data.message);
        if (e.response.data.path) {
          setRegisterForm({
            ...registerForm,
            [e.response.data.path]: {
              ...registerForm[e.response.data.path],
              error: true,
            },
          });
        }
      }
    }
  };

  return (
    <div>
      <Menu pointing className="admin-login-form-menu">
        <Menu.Item
          name="Login"
          active={activeItem === "login"}
          onClick={() => setActiveItem("login")}
        />
        <Menu.Item
          name="Register"
          active={activeItem === "register"}
          onClick={() => setActiveItem("register")}
        />
      </Menu>

      <Segment className="admin-login-form-wrapper">
        {activeItem === "login" ? (
          <Form onSubmit={submitLoginForm}>
            <Form.Field>
              <label>Username</label>
              <Input
                name="username"
                type="text"
                placeholder="Username"
                onChange={loginInputChangeHandler}
                value={loginForm.username.value}
                error={loginForm.username.error}
              />
            </Form.Field>
            <Form.Field>
              <label>Password</label>
              <Input
                name="password"
                type="password"
                placeholder="Password"
                onChange={loginInputChangeHandler}
                value={loginForm.password.value}
                error={loginForm.password.error}
              />
            </Form.Field>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button primary type="submit">
                Login
              </Button>
            </div>
          </Form>
        ) : (
          <Form onSubmit={submitRegisterForm}>
            <Form.Field>
              <label>Username</label>
              <Input
                type="text"
                placeholder="Username"
                onChange={registerInputChangeHandler}
                name="username"
                value={registerForm.username.value}
                error={registerForm.username.error}
              />
            </Form.Field>
            <Form.Field>
              <label>Admin Password</label>
              <Input
                type="password"
                name="password"
                placeholder="Password"
                onChange={registerInputChangeHandler}
                value={registerForm.password.value}
                error={registerForm.password.error}
              />
            </Form.Field>
            <Form.Field>
              <label>Admin Register Password</label>
              <Input
                name="admin_register_password"
                type="password"
                placeholder="Password"
                onChange={registerInputChangeHandler}
                value={registerForm.admin_register_password.value}
                error={registerForm.admin_register_password.error}
              />
            </Form.Field>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button primary type="submit">
                Register
              </Button>
            </div>
          </Form>
        )}
      </Segment>
    </div>
  );
}
