require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const Port = process.env.REACT_APP_PORT;
const { router } = require("./routes");

const app = express();

console.log(Port);
// app.use(cors());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
  })
);
app.use(cookieParser());
app.use(express.json());

app.use("/api/v1", router);

app.listen(Port, () => {
  console.log("Started listening at " + Port);
});
