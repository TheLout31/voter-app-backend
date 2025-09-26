// routes/voteRoutes.js
const express = require("express");
const {
  requireAuth,
  voterMiddleware,
} = require("../middlewares/authentication.js");
const ElectionModel = require("../models/election.model.js");
const VoteModel = require("../models/vote.model.js");

const VotingRouter = express.Router();

// Cast a vote
VotingRouter.post(
  "/:electionId",
  requireAuth,
  voterMiddleware,
  async (req, res) => {
    try {
      const { candidateId } = req.body;
      const { electionId } = req.params;
      const userId = req.user._id;

      const election = await ElectionModel.findById(electionId);
      if (!election)
        return res.status(404).json({ error: "Election not found" });

      const now = new Date();
      if (now < election.startDate || now > election.endDate) {
        return res.status(400).json({ error: "Election not active" });
      }

      const vote = new VoteModel({ voterId: userId, electionId, candidateId });
      await vote.save();

      // Increment candidate’s votes count
      await ElectionModel.updateOne(
        { _id: electionId, "candidates._id": candidateId },
        { $inc: { "candidates.$.votes": 1 } }
      );

      res.status(201).json({ message: "Vote cast successfully" });
    } catch (error) {
      if (error.code === 11000) {
        return res
          .status(400)
          .json({ error: "You already voted in this election" });
      }
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = VotingRouter;
