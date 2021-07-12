// export function useWalletConnect() {
//   const [walletConnect, setWalletConnect] = useState(
//     new WalletConnect({
//       bridge: "https://bridge.walletconnect.org", // Required
//       qrcodeModal: QRCodeModal,
//       qrcodeModalOptions: {
//         mobileLinks: true,
//       },
//     })
//   );
//   const dispatch = useDispatch();

//   return walletConnect;
// }

// src/context/state.js
import { createContext, useContext, useEffect, useState } from "react";
import WalletConnect from "@walletconnect/client";
import QRCodeModal from "@walletconnect/qrcode-modal";
import { useDispatch } from "react-redux";
import { userLoginSuccess, userLogout } from "../store";

const WalletConnectContext = createContext();

export default function WalletConnectProvider({ children }) {
  let sharedState = {
    walletConnect: new WalletConnect({
      bridge: "https://bridge.walletconnect.org", // Required
      qrcodeModal: QRCodeModal,
      qrcodeModalOptions: {
        mobileLinks: true,
      },
    }),
  };
  const dispatch = useDispatch();

  sharedState.walletConnect.on("connect", (error, payload) => {
    console.log("connected", sharedState.walletConnect);
    if (error) {
      return console.error(error.message);
    }

    const { accounts } = payload.params[0];
    return dispatch(
      userLoginSuccess({
        wallet: accounts[0],
        connectedWith: "wallet-connect",
      })
    );
  });

  sharedState.walletConnect.on("session_update", (error, payload) => {
    console.log("session_updated", payload);
    if (error) {
      return console.error(error.message);
    }

    const { accounts } = payload.params[0];
    return dispatch(
      userLoginSuccess({
        wallet: accounts[0],
        connectedWith: "wallet-connect",
      })
    );
  });

  sharedState.walletConnect.on("disconnect", (error, payload) => {
    console.log("disconnect", payload);
    if (error) {
      return console.error(error.message);
    }
    return dispatch(userLogout());
  });

  return (
    <WalletConnectContext.Provider value={sharedState}>
      {children}
    </WalletConnectContext.Provider>
  );
}

export function useWalletConnectContext() {
  return useContext(WalletConnectContext);
}
