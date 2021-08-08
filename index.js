//Import the packages (can be seen in package.json)
const express = require("express");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
//import cloudinary (web hosting service)
const cloudinary = require("cloudinary").v2;
//import CORS
const cors = require("cors");
//import Stripe for payment
const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);

//Activate env variables to use process.env.<SECRET ENV VARIABLES>
require("dotenv").config();

//Create notre API
const app = express();
//Apply formidable midlleware for all routes
app.use(formidable());
//Apply cors to all requests of our server
app.use(cors());

//Connect to database
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true, //because of the unique statement in User model
});

//connect to CDN (pictures web hosting service)
cloudinary.config({
  //account datas from cloudinary dashboard
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//Import all routes
const userRoutes = require("./routes/user");
const offerRoutes = require("./routes/offer");
app.use(userRoutes);
app.use(offerRoutes);

//Route to receive stripeToken
app.post("/pay", async (req, res) => {
  //receive stripeToken from Frontend given by Stripe API
  const stripeToken = req.fields.token;
  //create transaction to receive the cash
  const response = await stripe.charges.create({
    amount: req.fields.amount,
    currency: "eur",
    description: req.fields.description,
    //sending the token for verification
    source: stripeToken,
  });
  console.log(response.status);
  //send response to frontend to tell if payment was succesfull
  res.json(response);
});

//Mandatory routes
app.get("/", (req, res) => res.status(200).json("Welcome to my serveur"));
app.all("/*", (req, res) => res.status(404).json("Page not found"));
//start server
app.listen(process.env.PORT, () => console.log("Server started"));
