import { authenticateAdmin, setDefaultHeaders } from "../../../../middleware";
import Web3 from "web3";
import Token from "../../../../lib/ETBToken.json";
import numeral from "numeral";

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

        if (typeof tokenHave !== "string") {
          tokenHave = 0;
        }

        const decimalsIndexInTokens = tokenHave.length - decimals;

        const decimal = tokenHave.substr(decimalsIndexInTokens, 4);

        //console.log(decimalsIndexInTokens, 4);

        if (tokenHave.length < 18) {
          tokenHave = 0;
        } else {
          tokenHave = tokenHave.substr(0, decimalsIndexInTokens);
          tokenHave = tokenHave + `.${decimal}`;
        }
      } catch (err) {
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
        tokenHave:
          tokenHave === 0
            ? tokenHave.toString()
            : numeral(tokenHave).format("0,0.0000"),
      });

    default:
      return res.status(405).json({
        message: `Method ${req.method} Not Allowed!`,
      });
  }
};
