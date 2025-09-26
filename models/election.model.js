// models/Election.js
const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  party: { type: String },
  votes: { type: Number, default: 0 }
});

const electionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  candidates: [candidateSchema],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const ElectionModel = mongoose.model("Election", electionSchema);

module.exports = ElectionModel;
