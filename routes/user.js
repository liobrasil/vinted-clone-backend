//import express package in the project
const express = require("express");

//package to generate aleatory string et crypto algorithm
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");

//import cloudinary to upload newUser avater on web hosting service
const cloudinary = require("cloudinary").v2;

//import mailgun-js for automailing on login, signup etc...
const mailgun = require("mailgun-js")({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN,
});

//import lodash
const lodash = require("lodash");

//create mini app router
const router = express.Router();

//import models
const User = require("../models/User.js");
const Offer = require("../models/Offer");

//Routes

//CREATE
const createUser = async (req, res) => {
  try {
    //Destructuring req.fields object
    const { email, username, phone, password, confirmPassword, picPath } =
      req.fields;
    //Check if user digits the username
    if (username) {
      // searching for an existing email in the User collection
      const regex = new RegExp(email, "i");
      const existUserEmail = await User.findOne({ email: regex });
      if (!lodash.isEmpty(existUserEmail)) {
        res.status(401).json("Email already exists.");
      } else {
        if (password === confirmPassword) {
          // encrypt password
          //create the aleatory token (16 char)
          const token = uid2(16);
          //produce the aleatory salt (16 char)
          const salt = uid2(16);
          //produce unique hash with password + salt
          const hash = SHA256(password + salt).toString(encBase64);

          //new document from the User collection
          const newUser = new User({
            email: email,
            account: {
              username: username,
              phone: phone,
            },
            token: token,
            hash: hash,
            salt: salt,
          });
          //create data object to send by email
          const data = {
            from: "Vinted clone <no-reply@vintedclone.fr>",
            to: email,
            subject: `Bienvenue chez Vinted ${username}`,
            text: `Bonjour ${username},
            Je tenais à vous féliciter de faire partie de notre communauté.
            A bientôt,
            L'équipe Vinted`,
          };
          //send data object with mailgun-js
          mailgun.messages().send(data, (error, body) => {
            console.log(body);
          });
          //upload newUser avatar with cloudinary to /vinted-clone/user/newuserId
          const result = await cloudinary.uploader.upload(picPath, {
            folder: `/vinted-clone/users/${newUser._id}`,
          });

          //Add image secure_url to newUser
          newUser.account.avatar = result.secure_url;
          //save newUser in database
          await newUser.save();
          //send answer to client (with hash and salt of course)
          res.status(200).json({
            _id: newUser._id,
            email: newUser.email,
            token: newUser.token,
            account: newUser.account,
          });
        } else {
          //vérifier le code status
          res.status(400).json("Passwords are not the same");
        }
      }
    } else {
      //vérifier le code status
      res.status(400).json("Please digit your username");
    }
  } catch (error) {
    res.status(400).json(error.message);
  }
};
router.post("/user/signup", createUser);

//READ
const accessUser = async (req, res) => {
  try {
    //looking for a User which corresponds to email
    const regex = new RegExp(req.fields.email, "i");
    const existingUser = await User.findOne({ email: regex });
    //user exists we compare the hash produce with the digits password with the user hash in the DB
    if (existingUser) {
      const hash = SHA256(req.fields.password + existingUser.salt).toString(
        encBase64
      );
      //when hashes are equal we answer the client with this object
      if (existingUser.hash == hash) {
        //create data object to send by email
        const data = {
          from: "Vinted clone <no-reply@vintedclone.fr>",
          to: existingUser.email,
          subject: "Nouvelle connexion à votre compte",
          text: `Bonjour ${existingUser.account.username},
          Une connexion a été enregistré sur votre compte. S'il ne s'agit pas de vous, contactez le service client.
          L'équipe Vinted`,
        };
        //send data object with mailgun-js
        mailgun.messages().send(data, (error, body) => {
          console.log(body);
        });
        res.status(200).json({
          _id: existingUser._id,
          token: existingUser.token,
          account: existingUser.account,
        });
      } else {
        res.status(401).json("Unauthorized");
      }
    } else {
      res.status(401).json("Unauthorized");
    }
  } catch (error) {
    res.status.json(error.message);
  }
};

router.post("/user/login", accessUser);

//UPDATE

//DELETE

//export module
module.exports = router;
