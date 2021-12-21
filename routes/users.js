const router = require("express").Router();
var bodyParser = require("body-parser");
let User = require("../models/user.model");
let VerifyToken = require("../auth/VerifyToken"); //middleware to check valid token
var nodemailer = require("nodemailer");

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

var jwt = require("jsonwebtoken"); // used to create, sign, and verify tokens
var bcrypt = require("bcryptjs");
var config = require("../config"); // get config file

router.get("/authenticate", VerifyToken, function (req, res, next) {
  User.findById(req.userId, { Password: 0 }, function (err, user) {
    if (err) {
      return res
        .status(500)
        .send({ error: err, message: "There was a problem finding the user." });
    }

    if (!user) {
      return res.status(404).send("No user found.");
    }

    res.status(200).send(user);
  });
});

router.route("/login").post((req, res) => {
  User.findOne({ Email: req.body.Email }, function (err, user) {
    if (err) {
      return res
        .status(500)
        .send({ error: err, message: "Error on the server" });
    }
    if (!user) {
      return res.status(404).send("No user found");
    }

    var passwordIsValid = bcrypt.compareSync(req.body.Password, user.Password);
    if (!passwordIsValid) {
      return res.status(401).send({ auth: false, token: null });
    }

    var token = jwt.sign({ id: user._id }, config.secret, {
      // expiresIn: 86400 //expires in 24h

      expiresIn: 86400, //expires in 24h
    });

    res.status(200).send({
      auth: true,
      userDetails: {
        Id: user._id,
        FullName: user.FullName,
        Email: user.Email,
      },
      token: token,
    });
  });
});

router.get("/logout", function (req, res) {
  res.status(200).send({ auth: false, token: null });
});
//https://github.com/nodemailer/nodemailer/issues/515
// 1.https://www.google.com/settings/security/lesssecureapps
// 2.https://accounts.google.com/DisplayUnlockCaptcha
async function mailSender(sendTo, userId) {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER, // generated ethereal user
      pass: process.env.GMAIL_PASSWORD, // generated ethereal password
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: "mert.vasit@gmail.com", // sender address
    // to: sendTo, // list of receivers
    to: "mert_vasit@hotmail.com",
    subject: "Reset Password", // Subject line
    // text: "Hello world?", // plain text body
    html:
      '<div style="text-align: center;font-family: sans-serif;border: 1px solid navy;"><h1>Hello!</h1><p>You are receiving this email because we received a password reset request for your account.</p>' +
      '<a style="text-decoration: none;padding: 10px;color: white;background-color: navy;border-radius: 5px;" href="https://app.elta360.com/changePassword/' +
      userId +
      '">Reset Password</a><p>If you did not request a password reset, no further action is required</p></div>', // html body
  });

  console.log("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  // Preview only available when sending through an Ethereal account
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}

router.route("/sendMail/:email_address").post((req, res) => {
  User.findOne({ Email: req.params.email_address }, "_id").exec((err, user) => {
    if (err) return res.status(400).send("Can not find user");
    if (user) {
      mailSender(req.params.email_address, user._id)
        .then(() => {
          res.status(201).send("Mail is sent succesfully.");
        })
        .catch(console.error);
      // console.log("user", user);
    } else {
      res.status(202).send("User doesn't exists.");
    }
  });
  // res.sendStatus(201);
});

module.exports = router;
