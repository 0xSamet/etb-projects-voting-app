import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { Button, Icon, Popup } from "semantic-ui-react";
import { adminLogout } from "../../store";
import axios from "axios";

export default function AdminHeader() {
  const state = useSelector((state) => state);
  const dispatch = useDispatch();

  const logout = async (e) => {
    try {
      const response = await axios.post("/api/admin/logout");
      console.log(response);
      if (response && response.data && response.data.success) {
        dispatch(adminLogout());
      }
    } catch (e) {
      if (e.response && e.response.data && e.response.data.message) {
        alert.error(e.response.data.message);
      }
    }
  };

  return (
    <header>
      <div className="header-logo">
        <Link href="/">
          <a>
            <img src="/logo.png" />
          </a>
        </Link>
      </div>
      <div className="header-right">
        {state.admin.loggedIn && (
          <>
            <ul className="menu">
              <li className="active">
                <Link href="/admin">
                  <a>PROJECTS</a>
                </Link>
              </li>
            </ul>
            <Popup
              key={state.admin.username}
              header={state.admin.username}
              trigger={<Button icon="user" style={{ marginRight: 10 }} />}
            />
            <Button
              icon
              loading={false}
              labelPosition="left"
              style={{ backgroundColor: "#dd4b39", color: "#fff" }}
              onClick={() => logout()}
            >
              <Icon name="sign-out" />
              Logout
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
