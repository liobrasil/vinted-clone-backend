//Import the packages (can be seen in package.json)
const express = require("express");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
//import cloudinary (web hosting service)
const cloudinary = require("cloudinary").v2;
//import CORS
const cors = require("cors");

//Activate env variables to use process.env.<SECRET ENV VARIABLES>
require("dotenv").config();

//Create notre API
const app = express();
//Apply formidable midlleware for all routes
app.use(formidable());
//Apply cors to all requests of our server
app.use(cors());

//Connect to database
// mongoose.connect("mongodb://localhost:27017/vinted-clone", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
//   useCreateIndex: true,
// });
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true, //because of the unique statement in User model
});

//connect to pictures web hosting service
cloudinary.config({
  //account datas from cloudinary dashboard
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

//Import all routes
const userRoutes = require("./routes/user");
const offerRoutes = require("./routes/offer");
app.use(userRoutes);
app.use(offerRoutes);

//Mandatory routes
app.get("/", (req, res) => res.status(200).json("Welcome to my serveur"));
app.all("/*", (req, res) => res.status(404).json("Page not found"));
//start server
app.listen(process.env.PORT, () => console.log("Server started"));
