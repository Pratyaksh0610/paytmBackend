const express = require("express");
const zod = require("zod");
const { User, Account } = require("../db");
const jwt = require("jsonwebtoken");
const JWT_SECRET = require("../config");
const authMiddleware = require("./middleware");

console.log("Inside userRouter");

const userRouter = express.Router();

const signupBody = zod.object({
  username: zod.string().email(),
  firstName: zod.string(),
  lastName: zod.string(),
  password: zod.string(),
});

userRouter.post("/signup", async function (req, res) {
  const { success } = signupBody.safeParse(req.body);
  if (!success) {
    return res.status(411).json({
      msg: "Incorrect inputs",
    });
  }

  const existingUser = await User.findOne({ username: req.body.username });

  if (existingUser) {
    res.status(411).json({
      msg: "Email already taken",
    });
    return;
  }

  const user = await User.create({
    username: req.body.username,
    password: req.body.password,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
  });
  const userId = user._id;
  const userAccount = new Account({
    userId: userId,
    balance: Math.floor(Math.random() * 1e5),
    lock: false,
  });

  const payload = {
    userId: userId,
    // exp: Math.floor(Date.now() / 1000) + 30 * 60,
  };

  await userAccount.save();
  const token = jwt.sign(payload, JWT_SECRET);
  res.status(200).json({
    msg: "User created Successfully",
    token: token,
  });
});

const signinBody = zod.object({
  username: zod.string().email(),
  password: zod.string(),
});

userRouter.post("/resolveToken", async function (req, res) {
  const token = req.body.token;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("DECODED is " + decoded);
    const userId = decoded.userId;
    const user = await User.findById(userId);
    if (user) {
      res.status(200).json(user);
      return;
    }
    res.status(400).json({
      msg: "Ek Id se nhi Mila",
    });
  } catch (error) {
    console.log("CATCH");
    // console.log(error);
    res.status(400).json({
      msg: "EK FIND NHI HUA",
    });
  }
});

userRouter.post("/signin", async function (req, res) {
  const { success } = signinBody.safeParse(req.body);
  if (!success) {
    return res.status(411).json({
      message: "Incorrect inputs",
    });
  }

  const user = await User.findOne({
    username: req.body.username,
    password: req.body.password,
  });

  if (user) {
    const payload = {
      userId: user._id,
      // exp: Math.floor(Date.now() / 1000) + 30 * 60,
    };
    const token = jwt.sign(payload, JWT_SECRET);

    res.status(200).json({
      token: token,
    });
    return;
  }

  res.status(411).json({
    message: "Error while logging in",
  });
});

const updateBody = zod.object({
  password: zod.string().optional(),
  firstName: zod.string().optional(),
  lastName: zod.string().optional(),
});

userRouter.put("/", authMiddleware, async (req, res) => {
  const { success } = updateBody.safeParse(req.body);
  if (!success) {
    res.status(411).json({
      message: "Error while updating information",
    });
  }

  await User.updateOne({ _id: req.userId }, req.body);

  res.json({
    message: "Updated successfully",
  });
});

userRouter.get("/bulk", async function (req, res) {
  const filter = req.query.filter || "";

  const users = await User.find({
    $or: [
      {
        firstName: {
          $regex: filter,
          $options: "i",
        },
      },
      {
        lastName: {
          $regex: filter,
          $options: "i",
        },
      },
    ],
  });

  res.json({
    user: users.map((user) => ({
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      _id: user._id,
    })),
  });
});

module.exports = {
  userRouter,
};
