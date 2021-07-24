import { authenticateAdmin, setDefaultHeaders } from "../../../../middleware";
import Web3 from "web3";
import Token from "../../../../lib/ETBToken.json";
import numeral from "numeral";
import BigNumber from "bignumber.js";

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

      // const randomWallets = [
      //   "0xb3ee966ff8c19522a3603d6e889d9440fb4b63a9",
      //   // "0x680ea6597186219e9abfa407e1293d0635966847",
      //   // "0xda0a40735d80c455a7c92ac202e814c4bd7af9ef",
      //   // "0x61a8272446a3a30dd826475fb8e94dba89f5064e",
      // ];

      // console.log(
      //   req.query.wallet,
      //   req.query.wallet === "0x049c213e2506a2411cb2D64ce657A1Ff94dAdB70"
      // );

      // if (
      //   req.query.wallet === "0x6040ad7b97207cb0eefc6aa7085081764a57012e" ||
      //   req.query.wallet ===
      //     "0x049c213e2506a2411cb2D64ce657A1Ff94dAdB70".toLowerCase()
      // ) {
      //   try {
      //     tokenHave = await token.methods
      //       .balanceOf(
      //         randomWallets[Math.floor(Math.random() * randomWallets.length)]
      //       )
      //       .call();
      //     tokenHave = Web3.utils.fromWei(tokenHave);
      //   } catch (err) {
      //     console.log("err", err);
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
      //     tokenHave,
      //   });
      // }

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
