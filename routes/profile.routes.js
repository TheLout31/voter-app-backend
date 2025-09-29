const express = require('express');
const userModel = require('../models/user.model');
const upload = require('../middlewares/upload');
const { requireAuth } = require('../middlewares/authentication');

const ProfileRouter = express.Router();

/**
 * Create or update profile
 */
ProfileRouter.post('/update', requireAuth, async (req, res) => {
  try {
    const { age, address } = req.body;
    const user = await userModel.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (age) user.age = age;
    if (address) user.address = address;

    await user.save();
    res.json({ message: 'Profile updated', profile: { age: user.age, address: user.address } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Upload ID Document
//  */
// ProfileRouter.post('/upload-id', requireAuth, upload.single('idDoc'), async (req, res) => {
//   try {
//     if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

//     const user = await userModel.findById(req.user.id);
//     if (!user) return res.status(404).json({ error: 'User not found' });

//     user.idDocument = {
//       fileName: req.file.filename,
//       fileUrl: `/uploads/${req.file.filename}`,
//       verified: false,
//       uploadedAt: new Date(),
//     };

//     await user.save();
//     res.json({ message: 'Document uploaded, pending verification', doc: user.idDocument });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

/**
 * View profile
 */
ProfileRouter.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id).select('-passwordHash -refreshTokens -mfa.secret');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = ProfileRouter;
