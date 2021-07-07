import { useState } from "react";
import WalletConnect from "@walletconnect/client";
import QRCodeModal from "@walletconnect/qrcode-modal";

export function useWalletConnect() {
  const [walletConnect, setWalletConnect] = useState(
    new WalletConnect({
      bridge: "https://bridge.walletconnect.org", // Required
      qrcodeModal: QRCodeModal,
      qrcodeModalOptions: {
        mobileLinks: true,
      },
    })
  );

  return walletConnect;
}
