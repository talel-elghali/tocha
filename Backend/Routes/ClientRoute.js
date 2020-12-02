const express = require("express");
const router = express.Router();
const Clients = require("../Models/ClientModel.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const verify = require("./VerificationToken.js");
const nodemailer = require("nodemailer");
const smtpTransport = require("nodemailer-smtp-transport");
const { emailAccount, pass } = require("./MyAccountGmail.js");
const accountSid = "AC31e0bd470eb9c387f6a24696d31f1271";
const authToken ="18f04a80b5899112d3e3bfa897cedee8";
const notification = require('twilio')(accountSid, authToken);
// const { loginValidation } = require('./Validation.js')
dotenv.config();

router.get("/", async (req, res) => {
  await Clients.findAll().then((clients) => res.json(clients));
});

router.get("/:id", async (req, res) => {
  await Clients.findByPk(req.params.id).then((clients) => res.json(clients));
});

router.post("/register", async (req, res) => {
  const emailExist = await Clients.findOne({ where: { email: req.body.email } });
  if (emailExist) return res.status(400).send("Email already exist");
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(req.body.password, salt);
  await Clients.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    password: hashPassword,
    email: req.body.email,
    street: req.body.street,
    city: req.body.city,
    zipCode: req.body.zipCode,
    phoneNumber: req.body.phoneNumber,
  }).then((user) => {
   
    nodemailer.createTestAccount((err, email) => {
      var transporter = nodemailer.createTransport(
        smtpTransport({
          service: "gmail",
          port: 465,
          secure: false,
          host: "smtp.gmail.com",
          auth: {
            user: "",
            pass: "",
          },
          tls: {
            rejectUnauthorized: false,
          },
        })
      );
    
      let mailOptions = {
        from: "",
        to: `${req.body.email}`,
        subject: "Be5tef",
        text: `Hey Mr/Mrs ${req.body.lastName} , welcome in our application bekhtef , your account is verified from admin  `,
      };
    
      transporter.sendMail(mailOptions, (err, info) => {
        if(err){ 
          console.log(err)
        } 
          res.send(info)
      })
    })
  }).catch((err) => {console.log(err)})
});

router.post("/login", async (req, res) => {
  // const {error} = loginValidation(req.body)
  // if(error) return res.send(error.details[0].message)
  const user = await Clients.findOne({ where: { email: req.body.email } });
  if (!user) return res.send({ status: 404 });
  const validPass = await bcrypt.compare(req.body.password, user.password);
  if (!validPass) return res.send({ status: 500 });
  const token = jwt.sign({ id: user.id }, process.env.SECRET_TOKEN);
  res
    .header("auth_token", token)
    .send({ token: token, id: user.id, firstName : user.firstName , lastName : user.lastName, status:"client" , email:user.email , phoneNumber:user.phoneNumber , street:user.street , city:user.city , zipCode:user.zipCode});
});

router.put("/:id", async (req, res) => {
  await Clients.findByPk(req.params.id).then((clients) => {
    clients
    .update({
        street: req.body.street,
        city: req.body.city,
        zipCode: req.body.zipCode,
        phoneNumber: req.body.phoneNumber,
      })
      .then((clients) => {
        res.json(clients);
      }).catch((err) => console.log(err))
  });
});

router.patch("/password", async (req, res) => {
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(req.body.newPassword, salt);
  await Clients.findOne({ where: { email: req.body.email } }).then((clients) => {
    clients
    .update({
       password: hashPassword
      })
      .then((clients) => {
        res.json(clients);
      }).catch((err) => console.log(err))
  });
});

router.delete("/:id", async (req, res) => {
  await Clients.findByPk(req.params.id)
    .then((clients) => {
      clients.destroy();
    })
    .then(() => {
      res.json("deleted");
    });
});

router.delete("/", async (req, res) => {
  await Clients.destroy({ where: {}, truncate: true }).then(() =>
    res.json("cleared")
  );
});

// this route for sending sms to the clients

// router.post("/msg",async (req, res) => {
//   notification
//   .messages 
//       .create({  
//         body: 'Hello sir, your request is acceptable and you will receive your goods within three days. Our representative will contact you before delivery. Thank you for trusting our products. For more inquiries, contact us through our website. bekhtef Team',
//          from: '+14408052512',       
//          to: '+21652570599' 
//        }) 
//       .then(message => console.log(message.sid)) 
//       .done();
// })
module.exports = router;