//import packages
const mongoose = require("mongoose");

//Create the offer model
const Offer = mongoose.model("Offer", {
  product_name: String,
  product_description: String,
  product_price: Number,
  product_details: Array,
  product_image: { type: mongoose.Schema.Types.Mixed, default: {} },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, //owner is referenced to the User model
});

//export module
module.exports = Offer;
