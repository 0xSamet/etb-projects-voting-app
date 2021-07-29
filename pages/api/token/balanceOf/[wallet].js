import { setDefaultHeaders } from "../../../../middleware";
import Web3 from "web3";
import Token from "../../../../lib/ETBToken.json";

export default async (req, res) => {
  await setDefaultHeaders(req, res);
  switch (req.method) {
    case "GET":
      if (!req.query.wallet) {
        return res.status(422).json({
          message: "Missing Query Params! (wallet)",
        });
      }

      const web3 = new Web3(process.env.WEB3_PROVIDER);

      const token = new web3.eth.Contract(
        Token.abi,
        Token.networks[process.env.NEXT_PUBLIC_NETWORK_ID].address
      );

      let tokenHave = 0;
      const decimals = 18;

      try {
        tokenHave = await token.methods.balanceOf(req.query.wallet).call();
        tokenHave = Web3.utils.fromWei(tokenHave);
      } catch (err) {
        console.log("err", err);
        if (err.code === "INVALID_ARGUMENT") {
          return res.status(422).json({
            message: "Invalid Wallet Adress",
          });
        } else {
          return res.status(422).json({
            message: err.message,
          });
        }
      }

      return res.json({
        success: true,
        tokenHave,
      });

    default:
      return res.status(405).json({
        message: `Method ${req.method} Not Allowed!`,
      });
  }
};
