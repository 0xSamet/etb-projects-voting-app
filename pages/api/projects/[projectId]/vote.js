import Project from "../../../../db/models/Project";
import { setDefaultHeaders } from "../../../../middleware";
import connectDb from "../../../../db/connect";
import Joi from "joi";
import { recoverPersonalSignature } from "eth-sig-util";
import { convertUtf8ToHex } from "@walletconnect/utils";
import axios from "axios";

const voteProjectSchema = Joi.object({
  signature: Joi.string().required().trim(),
  signedMessage: Joi.string().required().trim(),
  wallet: Joi.string().required().trim().lowercase(),
});

export default async (req, res) => {
  await setDefaultHeaders(req, res);
  switch (req.method) {
    case "POST":
      if (!req.query.projectId) {
        return res.status(422).json({
          message: "Missing Query Params! (projectId)",
        });
      }

      let validateRequest;
      try {
        validateRequest = await voteProjectSchema.validateAsync(req.body);
      } catch (e) {
        console.log(e);
        return res.status(422).json({
          message: e.details[0].message,
          path: e.details[0].path[0],
        });
      }

      let tokenHave = 0;
      const totalSupply = 1000000;

      try {
        const response = await axios(
          `${process.env.BASE_URL}/api/token/balanceOf/${validateRequest.wallet}`
        );

        if (response && response.data && response.data.tokenHave) {
          tokenHave = Number(response.data.tokenHave.replace(",", ""));
          console.log({
            tokenHave: response.data.tokenHave,
            format: Number(response.data.tokenHave),
          });
        }
      } catch (err) {
        console.log(err);
        console.log(JSON.stringify(err));
        return res.status(err.response.status).json(err.response.data);
      }

      if (tokenHave < 0.1) {
        return res.status(422).json({
          message: "You need atleast 0.1 Etb Token To Vote",
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

      const isUserAlreadyVoted = await Project.findOne({
        _id: parseSignedMessage.projectId,
        "alreadyVoted.wallet": validateRequest.wallet,
      });

      if (isUserAlreadyVoted) {
        return res.status(409).json({
          message: "You Already Vote This Project!",
        });
      }

      const projectToVote = await Project.findOne({
        _id: req.query.projectId,
      }).select({
        __v: 0,
      });

      if (!projectToVote) {
        return res.status(404).json({
          message: "Project Not Found!",
        });
      }

      let participantInDb = projectToVote.participants.id(
        parseSignedMessage.participantId
      );

      if (!participantInDb) {
        return res.status(404).json({
          message: "Participant Not Found!",
        });
      }

      participantInDb.voteCount = participantInDb.voteCount + tokenHave;

      projectToVote.alreadyVoted.push({
        wallet: validateRequest.wallet,
        tokenHave: tokenHave,
        vote_date: new Date().getTime().toString(),
        participantId: parseSignedMessage.participantId,
      });

      await projectToVote.save();

      return res.json({ success: true, project: projectToVote });
    default:
      return res.status(405).json({
        message: `Method ${req.method} Not Allowed!`,
      });
  }
};
