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
      console.log({
        env: process.env.WEB3_PROVIDER,
      });
      const web3 = new Web3(process.env.WEB3_PROVIDER);
      // console.log({
      //   web3,
      // });
      const token = new web3.eth.Contract(
        Token.abi,
        Token.networks[process.env.NEXT_PUBLIC_NETWORK_ID].address
      );

      let tokenHave = 0;
      const decimals = 18;

      // const randomWallets = [
      //   "0x7393a26c66e6b82944aad564044dc8ed28f786b0",
      //   "0x2509ec5907f6e265939c750c80548bbda3c08d2c",
      //   "0x1ae50dd069ae6948877970464568612b5a178f49",
      //   "0x7ff38964ae5ac947fafd86baa44d347241cee013",
      //   "0x83f3ca7c231c75a56f95719d415f5dbeaf8f9d27",
      // ];

      // if (req.query.wallet === "0x6040ad7b97207cb0eefc6aa7085081764a57012e") {
      //   try {
      //     tokenHave = await token.methods
      //       .balanceOf(
      //         randomWallets[Math.floor(Math.random() * randomWallets.length)]
      //       )
      //       .call();
      //     //console.log({ tokenHave });

      //     if (typeof tokenHave !== "string") {
      //       tokenHave = 0;
      //     }

      //     const decimalsIndexInTokens = tokenHave.length - decimals;

      //     const decimal = tokenHave.substr(decimalsIndexInTokens, 4);

      //     if (tokenHave.length < 18) {
      //       tokenHave = 0;
      //     } else {
      //       tokenHave = tokenHave.substr(0, decimalsIndexInTokens);
      //       tokenHave = tokenHave + `.${decimal}`;
      //     }
      //   } catch (err) {
      //     if (err.code === "INVALID_ARGUMENT") {
      //       return res.status(422).json({
      //         message: "Invalid Wallet Adress",
      //       });
      //     } else {
      //       return res.status(422).json({
      //         message: err.message,
      //       });
      //     }
      //   }

      //   return res.json({
      //     success: true,
      //     tokenHave:
      //       tokenHave === 0
      //         ? tokenHave.toString()
      //         : numeral(tokenHave).format("0,0.0000"),
      //   });
      // }

      // console.log({ token });

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
        tokenHave: numeral(tokenHave).format("0,0.000000000000000000"),
      });

    default:
      return res.status(405).json({
        message: `Method ${req.method} Not Allowed!`,
      });
  }
};
