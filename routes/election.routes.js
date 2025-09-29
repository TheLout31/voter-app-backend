// routes/electionRoutes.js
const express = require("express");
const {
  adminMiddleware,
  requireAuth,
} = require("../middlewares/authentication.js");
const ElectionModel = require("../models/election.model.js");

const ElectionRouter = express.Router();

// Create election (Admin only)
ElectionRouter.post("/", requireAuth, adminMiddleware, async (req, res) => {
  try {
    const election = new ElectionModel(req.body);
    await election.save();
    res.status(201).json({ message: "Election created", election });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all active elections
ElectionRouter.get("/", async (req, res) => {
  try {
    const elections = await ElectionModel.find();
    res.json(elections);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Get single election by ID
ElectionRouter.get("/:id", requireAuth, async (req, res) => {
  try {
    const election = await ElectionModel.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ error: "Election not found" });
    }

    const now = new Date();
    const isActiveNow = now >= election.startDate && now <= election.endDate;

    // Update isActive if status changed
    if (election.isActive !== isActiveNow) {
      election.isActive = isActiveNow;
      await election.save();
    }

    res.json(election);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// routes/electionRoutes.js (add this)
ElectionRouter.get(
  "/:id/results",
  requireAuth,
  adminMiddleware,
  async (req, res) => {
    try {
      const election = await ElectionModel.findById(req.params.id);
      if (!election)
        return res.status(404).json({ error: "Election not found" });

      res.json({
        title: election.title,
        candidates: election.candidates.map((c) => ({
          name: c.name,
          party: c.party,
          votes: c.votes,
        })),
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = ElectionRouter;
