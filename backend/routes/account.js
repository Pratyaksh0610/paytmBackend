const express = require("express");
const authMiddleware = require("./middleware");
const mongoose = require("mongoose");
const { Account } = require("../db");

const accountRouter = express.Router();

accountRouter.get("/balance", authMiddleware, async function (req, res) {
  const id = req.userId;
  const userAccount = await Account.find({ userId: id });

  res.status(200).json({
    balance: userAccount[0].balance,
  });
});

accountRouter.post("/transfer", authMiddleware, async function (req, res) {
  console.log("request reached for transfer");
  const fromAccountNumber = req.userId;
  const toAccountNumber = req.body.to;
  const amount = req.body.amount;
  // console.log(fromAccountNumber);
  // console.log(toAccountNumber);
  // console.log(amount);
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Find sender's account and update balance
    const senderAccount = await Account.findOneAndUpdate(
      { userId: fromAccountNumber, balance: { $gte: amount }, lock: false },
      { $inc: { balance: -amount }, $set: { lock: true } },
      { new: true, session }
    );

    const receiverAccount = await Account.findOneAndUpdate(
      { userId: toAccountNumber },
      { $inc: { balance: amount } },
      { new: true, session }
    );

    if (!senderAccount || !receiverAccount) {
      res.status(400).json({
        msg: "Either account not found or not enough balance or already locked",
      });
      await session.abortTransaction();
      session.endSession();
      return;
    }
    // console.log("session start");

    await session.commitTransaction();
    session.endSession();
    await Account.updateOne(
      { userId: fromAccountNumber },
      { $set: { lock: false } }
    );
    console.log("ho gya");
    res.status(200).json({
      msg: "Succesfully transfered",
    });
  } catch (error) {
    console.log("Fas gaya transfer catch mei");
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({
      msg: "Some error occured, found in catch block",
    });
  }
});

module.exports = {
  accountRouter,
};
