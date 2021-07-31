//import package
const mongoose = require("mongoose");

//import Ofer model
const Offer = require("../models/Offer");

//import User model
const User = require("../models/User");

//Create function to verify user token in DB
const isAuthenticated = async (req, res, next) => {
  try {
    //token string from the HTTP header Bearer token
    const token = req.headers.authorization.replace("Bearer ", "");
    //look for user with such token in DB
    const user = await User.findOne({ token: token }).select("account");
    //if the user exist then the user object (only account key to keep secret data for back (hash, token and salt)) is available in req object
    if (user) {
      req.user = user;
      // go to the next middleware in the app.post() arguments
      next();
    } else {
      res.status(400).json("Unauthorized");
    }
  } catch (error) {
    res.status(400).json(message.error);
  }
};

//export module
module.exports = isAuthenticated;
