import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { Button, Icon, Popup } from "semantic-ui-react";
import { adminLogout } from "../../store";

export default function AdminHeader() {
  const state = useSelector((state) => state);
  const dispatch = useDispatch();

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
              onClick={() => dispatch(adminLogout())}
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
