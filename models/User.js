//Import the mongoose package in the project
const mongoose = require("mongoose");

//Create the model User
const User = mongoose.model("User", {
  email: { unique: true, type: String },
  account: {
    username: { required: true, type: String },
    phone: String,
    avatar: Object,
  },
  token: String,
  hash: String,
  salt: String,
});

//Export the package
module.exports = User;
