import Poll from "../../../../db/models/Poll";
import { setDefaultHeaders } from "../../../../middleware";
import connectDb from "../../../../db/connect";
import Joi from "joi";
import { recoverPersonalSignature } from "eth-sig-util";
import { convertUtf8ToHex } from "@walletconnect/utils";
import axios from "axios";
import BigNumber from "bignumber.js";

const votePollSchema = Joi.object({
  signature: Joi.string().required().trim(),
  signedMessage: Joi.string().required().trim(),
  wallet: Joi.string().required().trim().lowercase(),
});

export default async (req, res) => {
  await setDefaultHeaders(req, res);
  switch (req.method) {
    case "POST":
      if (!req.query.pollId) {
        return res.status(422).json({
          message: "Missing Query Params! (pollId)",
        });
      }

      let validateRequest;
      try {
        validateRequest = await votePollSchema.validateAsync(req.body);
      } catch (e) {
        console.log(e);
        return res.status(422).json({
          message: e.details[0].message,
          path: e.details[0].path[0],
        });
      }

      let tokenHave = "0";

      try {
        const response = await axios(
          `${process.env.BASE_URL}/api/token/balanceOf/${validateRequest.wallet}`
        );

        if (response && response.data && response.data.tokenHave) {
          tokenHave = BigNumber(response.data.tokenHave);
        }
      } catch (err) {
        console.log(err);
        return res.status(err.response.status).json(err.response.data);
      }

      if (
        process.env.VOTING_MIN_TOKEN &&
        tokenHave < BigNumber(process.env.VOTING_MIN_TOKEN)
      ) {
        return res.status(422).json({
          message: `You need atleast ${process.env.VOTING_MIN_TOKEN} Etb Token To Vote`,
        });
      }

      const parseSignedMessage = JSON.parse(validateRequest.signedMessage);

      const recoveredSignature = recoverPersonalSignature({
        data: convertUtf8ToHex(validateRequest.signedMessage),
        sig: validateRequest.signature,
      });

      if (
        recoveredSignature.toLocaleLowerCase() !==
        validateRequest.wallet.toLocaleLowerCase()
      ) {
        res.status(401).json({ message: "Signature Failed" });
      }

      await connectDb();

      const pollToVote = await Poll.findOne({
        _id: req.query.pollId,
      }).select({
        __v: 0,
      });

      if (!pollToVote) {
        return res.status(404).json({
          message: "Poll Not Found!",
        });
      }

      const currentDate = new Date().getTime();
      const isVotingStarted = currentDate - pollToVote.start_date > 0;
      const isVotingEnded = pollToVote.end_date - currentDate < 0;

      if (!isVotingStarted) {
        return res.status(422).json({
          message: "Voting didn't start yet!",
        });
      }

      if (isVotingEnded) {
        return res.status(422).json({
          message: "Voting ended!",
        });
      }

      const isUserAlreadyVoted = await Poll.findOne({
        _id: parseSignedMessage.pollId,
        "alreadyVoted.wallet": validateRequest.wallet,
      });

      if (isUserAlreadyVoted) {
        return res.status(409).json({
          message: "You Already Vote This Poll!",
        });
      }

      let proposalInDb = pollToVote.proposals.id(parseSignedMessage.proposalId);

      if (!proposalInDb) {
        return res.status(404).json({
          message: "Proposal Not Found!",
        });
      }

      proposalInDb.voteCount = BigNumber(proposalInDb.voteCount)
        .plus(tokenHave)
        .toFixed();

      pollToVote.alreadyVoted.push({
        wallet: validateRequest.wallet,
        tokenHave,
        vote_date: new Date().getTime().toString(),
        proposalId: parseSignedMessage.proposalId,
      });

      await pollToVote.save();

      return res.json({ success: true, poll: pollToVote });
    default:
      return res.status(405).json({
        message: `Method ${req.method} Not Allowed!`,
      });
  }
};
