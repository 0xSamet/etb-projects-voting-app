import BigNumber from "bignumber.js";
import Web3 from "web3";

export default async (req, res) => {
  console.log(BigNumber("0").plus(Web3.utils.fromWei("1145700000")).toFixed());
  res.json({ env: process.env });
};
