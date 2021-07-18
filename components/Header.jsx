import Link from "next/link";
import { Button, Icon, Popup } from "semantic-ui-react";
import getBlockChain from "../lib/ethereum";
import { useAlert } from "react-alert";
import { useDispatch, useSelector } from "react-redux";
import { userLoginSuccess, userLogout, updateUserTokenHave } from "../store";
import { useState, useEffect } from "react";
import { useWalletConnectContext } from "../lib/walletConnectContext";
import clsx from "clsx";
import axios from "axios";

export default function Header() {
  //const alert = useAlert();
  const dispatch = useDispatch();
  const state = useSelector((state) => state);
  const [web3, setWeb3] = useState(null);
  const { walletConnect } = useWalletConnectContext();
  const alert = useAlert();
  const [updateTokenHaveLoading, setUpdateTokenHaveLoading] = useState(false);

  const connectMetamask = async () => {
    try {
      const response = await getBlockChain();
      //console.log(response);
      if (response && response.address) {
        setWeb3(response.web3);
        dispatch(
          userLoginSuccess({
            wallet: response.address,
            connectedWith: "metamask",
          })
        );
        // console.log(response);
      }
    } catch (e) {
      // alert.error(e);
      console.log(e);
    }
  };

  const connectWalletConnect = async () => {
    try {
      //await walletConnect.killSession();
      if (walletConnect.connected) {
        // create new session
        console.log("connected", walletConnect);
      } else {
        await walletConnect.createSession();
      }
    } catch (e) {
      // alert.error(e);
      console.log(e);
    }
  };

  const updateTokenHave = async () => {
    if (!updateTokenHaveLoading) {
      setUpdateTokenHaveLoading(true);
      try {
        const response = await axios(
          `/api/token/balanceOf/${state.user.wallet.toLowerCase()}`
        );

        if (response && response.data && response.data.tokenHave) {
          setUpdateTokenHaveLoading(false);
          dispatch(
            updateUserTokenHave({
              tokenHave: Number(response.data.tokenHave),
            })
          );
        }
      } catch (e) {
        setUpdateTokenHaveLoading(false);
        if (e.response && e.response.data && e.response.data.message) {
          return alert.error(e.response.data.message);
        }
        return alert.error(e.message);
      }
    }
  };

  useEffect(async () => {
    if (state.user.loggedIn) {
      updateTokenHave();
    }
  }, [state.user.loggedIn]);

  const logout = async () => {
    if (walletConnect.connected) {
      await walletConnect.killSession();
    }
    return dispatch(userLogout());
  };

  // console.log("header", walletConnect);

  return (
    <>
      <div className="header-top">
        <span
          className={clsx({
            "token-holding-wrapper": true,
            show: state.user.loggedIn,
          })}
        >
          <span className="title">ETB TOKEN HAVE</span>
          <span className="tokens">{state.user.tokenHave}</span>
          <span
            className={clsx({
              "refresh-btn": true,
              loading: updateTokenHaveLoading,
            })}
            onClick={updateTokenHave}
          >
            <Icon size="tiny" name="refresh" />
          </span>
        </span>
      </div>
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
                key={state.user.wallet}
                header={state.user.wallet}
                trigger={<Button icon="user" style={{ marginRight: 10 }} />}
                pinned
                on="click"
                position="bottom right"
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
            <Popup
              className="login-options"
              content={
                <>
                  <div
                    className="metamask-btn login-btn"
                    onClick={connectMetamask}
                  >
                    <span className="btn-icon">
                      <svg width="212" height="189" viewBox="0 0 212 189">
                        <g fill="none" fillRule="evenodd">
                          <path
                            fill="#CDBDB2"
                            d="M60.75 173.25l27.563 7.313V171l2.25-2.25h15.75v19.125H89.438l-20.813-9z"
                          />
                          <path
                            fill="#CDBDB2"
                            d="M150.75 173.25l-27 7.313V171l-2.25-2.25h-15.75v19.125h16.875l20.812-9z"
                          />
                          <path
                            fill="#393939"
                            d="M90.563 152.438L88.313 171l2.812-2.25h29.25l3.375 2.25-2.25-18.562-4.5-2.813-22.5.563z"
                          />
                          <path
                            fill="#F89C35"
                            d="M75.375 27l13.5 31.5 6.188 91.688H117l6.75-91.688L136.125 27z"
                          />
                          <path
                            fill="#F89D35"
                            d="M16.313 96.188L.563 141.75l39.375-2.25H65.25v-19.687l-1.125-40.5-5.625 4.5z"
                          />
                          <path
                            fill="#D87C30"
                            d="M46.125 101.25l46.125 1.125L87.188 126l-21.938-5.625z"
                          />
                          <path
                            fill="#EA8D3A"
                            d="M46.125 101.813l19.125 18v18z"
                          />
                          <path
                            fill="#F89D35"
                            d="M65.25 120.375L87.75 126l7.313 24.188L90 153l-24.75-14.625z"
                          />
                          <path
                            fill="#EB8F35"
                            d="M65.25 138.375l-4.5 34.875 29.813-20.812z"
                          />
                          <path
                            fill="#EA8E3A"
                            d="M92.25 102.375l2.813 47.813-8.438-24.469z"
                          />
                          <path
                            fill="#D87C30"
                            d="M39.375 138.938l25.875-.563-4.5 34.875z"
                          />
                          <path
                            fill="#EB8F35"
                            d="M12.938 188.438L60.75 173.25l-21.375-34.312L.563 141.75z"
                          />
                          <path
                            fill="#E8821E"
                            d="M88.875 58.5L64.688 78.75l-18.563 22.5 46.125 1.688z"
                          />
                          <path
                            fill="#DFCEC3"
                            d="M60.75 173.25l29.813-20.812-2.25 18v10.125l-20.25-3.938zM150.75 173.25l-29.25-20.812 2.25 18v10.125l20.25-3.938z"
                          />
                          <path
                            fill="#393939"
                            d="M79.875 112.5l6.188 12.938-21.938-5.625z"
                          />
                          <path
                            fill="#E88F35"
                            d="M12.375.563l76.5 57.937L75.938 27z"
                          />
                          <path
                            fill="#8E5A30"
                            d="M12.375.563L2.25 31.5l5.625 33.75-3.937 2.25 5.625 5.063-4.5 3.937 6.187 5.625L7.313 85.5l9 11.25L58.5 83.813c20.625-16.5 30.75-24.938 30.375-25.313S63 38.813 12.375.563z"
                          />
                          <path
                            fill="#F89D35"
                            d="M195.187 96.188l15.75 45.562-39.375-2.25H146.25v-19.687l1.125-40.5 5.625 4.5z"
                          />
                          <path
                            fill="#D87C30"
                            d="M165.375 101.25l-46.125 1.125L124.312 126l21.938-5.625z"
                          />
                          <path
                            fill="#EA8D3A"
                            d="M165.375 101.813l-19.125 18v18z"
                          />
                          <path
                            fill="#F89D35"
                            d="M146.25 120.375L123.75 126l-7.313 24.188L121.5 153l24.75-14.625z"
                          />
                          <path
                            fill="#EB8F35"
                            d="M146.25 138.375l4.5 34.875L121.5 153z"
                          />
                          <path
                            fill="#EA8E3A"
                            d="M119.25 102.375l-2.813 47.813 8.438-24.469z"
                          />
                          <path
                            fill="#D87C30"
                            d="M172.125 138.938l-25.875-.563 4.5 34.875z"
                          />
                          <path
                            fill="#EB8F35"
                            d="M198.562 188.438L150.75 173.25l21.375-34.312 38.812 2.812z"
                          />
                          <path
                            fill="#E8821E"
                            d="M122.625 58.5l24.187 20.25 18.563 22.5-46.125 1.688z"
                          />
                          <path
                            fill="#393939"
                            d="M131.625 112.5l-6.188 12.938 21.938-5.625z"
                          />
                          <path
                            fill="#E88F35"
                            d="M199.125.563l-76.5 57.937L135.562 27z"
                          />
                          <path
                            fill="#8E5A30"
                            d="M199.125.563L209.25 31.5l-5.625 33.75 3.937 2.25-5.625 5.063 4.5 3.937-6.187 5.625 3.937 3.375-9 11.25L153 83.813c-20.625-16.5-30.75-24.938-30.375-25.313S148.5 38.813 199.125.563z"
                          />
                        </g>
                      </svg>
                    </span>
                    <span className="btn-text">Metamask</span>
                  </div>
                  <div
                    className="wallet-connect-btn login-btn"
                    onClick={connectWalletConnect}
                  >
                    <span className="btn-icon">
                      <svg width="300" height="185" viewBox="0 0 300 185">
                        <path
                          d="M61.439 36.256c48.91-47.888 128.212-47.888 177.123 0l5.886 5.764a6.041 6.041 0 010 8.67l-20.136 19.716a3.179 3.179 0 01-4.428 0l-8.101-7.931c-34.122-33.408-89.444-33.408-123.566 0l-8.675 8.494a3.179 3.179 0 01-4.428 0L54.978 51.253a6.041 6.041 0 010-8.67l6.46-6.327zM280.206 77.03l17.922 17.547a6.041 6.041 0 010 8.67l-80.81 79.122c-2.446 2.394-6.41 2.394-8.856 0l-57.354-56.155a1.59 1.59 0 00-2.214 0L91.54 182.37c-2.446 2.394-6.411 2.394-8.857 0L1.872 103.247a6.041 6.041 0 010-8.671l17.922-17.547c2.445-2.394 6.41-2.394 8.856 0l57.355 56.155a1.59 1.59 0 002.214 0L145.57 77.03c2.446-2.394 6.41-2.395 8.856 0l57.355 56.155a1.59 1.59 0 002.214 0L271.35 77.03c2.446-2.394 6.41-2.394 8.856 0z"
                          fill="#3B99FC"
                          fillRule="nonzero"
                        />
                      </svg>
                    </span>
                    <span className="btn-text">WalletConnect</span>
                  </div>
                </>
              }
              pinned
              on="click"
              position="bottom right"
              trigger={
                <Button icon loading={false} labelPosition="right">
                  <Icon name="arrow down" />
                  Connect
                </Button>
              }
            />
          )}
        </div>
      </header>
    </>
  );
}
