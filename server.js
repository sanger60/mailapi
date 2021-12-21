const express = require("express");
const cors = require("cors");
const path = require("path");

// const forgotPasswordMail = require("./forgotMail.html");

require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);

  next();
});

const analyticsRouter = require("./routes/mail");

app.use("/mail", analyticsRouter);

//Health Check for AWS EBS
app.get("/", (req, res) => {
  res.status(200);
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
