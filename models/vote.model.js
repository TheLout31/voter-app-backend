// models/Vote.js
const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  voterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  electionId: { type: mongoose.Schema.Types.ObjectId, ref: "Election", required: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, required: true },
}, { timestamps: true });

voteSchema.index({ voterId: 1, electionId: 1 }, { unique: true }); // Prevent duplicate votes

const VoteModel = mongoose.model("Vote", voteSchema)
module.exports = VoteModel
