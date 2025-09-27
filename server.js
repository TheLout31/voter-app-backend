const express = require("express");
const cors = require("cors");
const connectToDB = require("./config/mongodb.config");
const UserRouter = require("./routes/auth.routes");
const { loginLimiter } = require("./middlewares/ratelimiter");
const ProfileRouter = require("./routes/profile.routes");
const VotingRouter = require("./routes/voting.routes");
const ElectionRouter = require("./routes/election.routes");


const app = express();
const PORT = 3000;
app.use(cors());

connectToDB();

app.get("/", (req, res) => {
  res.json({ message: "Server working fine!!!" });
});

app.use(express.json());

app.use("/auth", UserRouter);
app.use('/profile', ProfileRouter);
app.use('/uploads', express.static('uploads'));
app.use("/vote", VotingRouter)
app.use("/elect",ElectionRouter)



app.post("/auth/login", loginLimiter, (req, res, next) => next());



app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
