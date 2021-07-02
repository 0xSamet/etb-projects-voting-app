import Link from "next/link";
import { Button, Icon, Popup } from "semantic-ui-react";
import getBlockChain from "../lib/ethereum";
import { useAlert } from "react-alert";
import { useDispatch, useSelector } from "react-redux";
import { userLoginSuccess, userLogout } from "../store";

export default function Header() {
  const alert = useAlert();
  const dispatch = useDispatch();
  const state = useSelector((state) => state);
  const connectWallet = async () => {
    try {
      const response = await getBlockChain();
      if (response && response.address) {
        dispatch(userLoginSuccess(response.address));
      }
    } catch (e) {
      alert.error(e);
    }
  };

  const logout = () => {
    return dispatch(userLogout());
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
        <ul className="menu">
          <li className="active">
            <Link href="/">
              <a>PROJECTS</a>
            </Link>
          </li>
        </ul>
        {state.user.loggedIn ? (
          <>
            <Popup
              key={state.user.username}
              header={state.user.username}
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
        ) : (
          <Button
            onClick={connectWallet}
            icon
            loading={false}
            labelPosition="left"
          >
            <Icon name="plug" />
            Connect
          </Button>
        )}
      </div>
    </header>
  );
}
