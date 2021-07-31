//import packages
const express = require("express");
const lodash = require("lodash");

//create mini router app
const router = express.Router();

//import middleware for authentication
const isAuthenticated = require("../middlewares/isAuthenticated");

//import the web hosting package
const cloudinary = require("cloudinary").v2;

//import model
const User = require("../models/User");
const Offer = require("../models/Offer");

//Routes
//CREATE
const createOffer = async (req, res) => {
  try {
    //condition on client datas
    const condition =
      req.fields.title.length > 50 ||
      req.fields.price > 100000 ||
      req.fields.description.length > 500;
    //If user is authentified user key was added to req in isAuthenticated middleware
    if (!condition && req.user) {
      //Destructuring req.fields object
      const { title, description, price, condition, city, brand, size, color } =
        req.fields;
      //create newOffer
      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          { MARQUE: brand },
          { TAILLE: size },
          { ETAT: condition },
          { COULEUR: color },
          { EMPLACEMENT: city },
        ],
        owner: req.user,
      });
      //Upload newOffer image in the /vinted-clone/offer/newOfferid on the cloudinary web hosting
      const result = await cloudinary.uploader.upload(req.files.picture.path, {
        folder: `/vinted-clone/offers/${newOffer._id}`,
      });
      //Update newOffer object
      newOffer.product_image = result.secure_url;
      //save newOffer created
      await newOffer.save();
      //send answer to client
      res.status(200).json(newOffer);
    } else {
      res.status(400).json({
        message:
          "description < 500 caractères, titre < 50 caractères et prix < 100000",
      });
    }
  } catch (error) {
    res.status(400).json(error.message);
  }
};
router.post("/offer/publish", isAuthenticated, createOffer);
//READ
const getOffer = async (req, res) => {
  try {
    //search for document in Offer collection
    const existingOffer = await Offer.findOne({ _id: req.params.id });
    //send answer to client
    res.status(200).json(existingOffer);
  } catch (error) {
    res.status(400).json(error.message);
  }
};
router.get("/offer/:id", getOffer);

//UPDATE
//updateOffer permits to update an offer document by his id
const updateOffer = async (req, res) => {
  try {
    //if the user owns the offer then he can modify it
    if (req.user) {
      //desctructuring the req.fields object
      const {
        id,
        title,
        description,
        price,
        color,
        brand,
        size,
        condition,
        city,
      } = req.fields;
      //looking for the offer to update in the Offer collection
      const offer2up = await Offer.findOne({ _id: id });
      //Fill offer2up with new values from client
      if (offer2up) {
        if (title) {
          offer2up.product_name = title;
        }
        if (description) {
          offer2up.product_description = description;
        }
        if (price) {
          offer2up.product_details.price = price;
        }
        if (color) {
          offer2up.product_details[3] = { COULEUR: color };
        }
        if (brand) {
          offer2up.product_details[0] = { MARQUE: brand };
        }
        if (size) {
          offer2up.product_details[1] = { TAILLE: size };
        }
        if (condition) {
          offer2up.product_details[2] = { ETAT: condition };
        }
        if (city) {
          offer2up.product_details[4] = { EMPLACEMENT: city };
        }
        //Delete old pic and update new pic if picture file is present on client side
        if (!req.files.picture.size === 0) {
          const img2delete = await cloudinary.uploader.destroy(
            `${offer2up.product_image.public_id}`
          );
          const result = await cloudinary.uploader.upload(
            req.files.picture.path,
            {
              folder: `/vinted-clone/offers/${offer2up._id}`,
            }
          );
          //save new picture secure_url
          offer2up.product_image = result.secure_url;
        }
        //save offer2up in Offer collection
        await offer2up.save();
        //send answr to client
        res.status(200).json(offer2up);
      } else {
        res.status(400).json("Offer doesn't exist");
      }
    } else {
      res.status(401).json("Unauthorized");
    }
  } catch (error) {
    res.status(400).json(error.message);
  }
};
router.put("/offer/update", isAuthenticated, updateOffer);

//DELETE
const deleteOffer = async (req, res) => {
  try {
    //look for existingOffer in Offer collection
    const offer2delete = await Offer.findOne({ _id: req.fields.id });
    //if offer exist, then delete it from User collection and from cloudinary
    if (offer2delete) {
      await cloudinary.api.delete_resources([
        offer2delete.product_image.public_id,
      ]);
      await cloudinary.api.delete_folder(
        `/vinted-clone/offers/${offer2delete._id}`
      );
      await offer2delete.delete();
      res.status(200).json("Offer deleted successfully");
    } else {
      res.status(400).json("Offer doesn't exist");
    }
  } catch (error) {
    res.status(400).json(error.message);
  }
};
router.delete("/offer/delete", isAuthenticated, deleteOffer);

//SEARCH
//Searching functionality will return the number of objects and some keys and values
const searchOffers = async (req, res) => {
  try {
    //Initialization
    const filters = {};
    const query = req.query;
    let sort = {};
    let inSkip;
    //destructuring of the req.query object with properties related to the Offer model
    const { title, descrip, priceMin, priceMax, city, brand, color } =
      req.query;

    if (priceMax) {
      filters.product_price = { $lte: priceMax };
    }
    if (priceMin) {
      filters.product_price = { $gte: priceMin };
    }
    if (priceMax && priceMin) {
      filters.product_price.$lte = priceMax;
    }
    //sort object will be pass to sort() like that: sort({product_price: "asc"})
    if (query.sort) {
      sort.product_price = query.sort.replace("price-", "");
    }
    //Mathematical trick to skip the number of objects corresponding to previous pages
    if (query.page) {
      inSkip = 3 * (query.page - 1);
    } else {
      inSkip = 0;
    }
    //Checking with key to look for in the Offer collection
    if (title) {
      filters.product_name = new RegExp(title, "i");
    }
    if (descrip) {
      filters.product_description = RegExp(descrip, "i");
    }
    if (city) {
      filters.product_details.city = new RegExp(city, "i");
    }
    if (brand) {
      filters.product_details.brand = new RegExp(brand, "i");
    }
    if (color) {
      filters.product_details.color = new RegExp(color, "i");
    }
    //find search by chaining several functions
    const filteredOffers = await Offer.find(filters) //find all the offers with the pair key value of Offer model
      .populate({ path: "owner", select: "account" }) //populate the owner key from Offer only with account and note with private datas such as salt, token or hash
      .sort(sort) //apply the filter for sorting in the inscrease or decrease order
      .skip(inSkip) //the pages according to the exact number page to show
      .limit(3); //limit 3 results per page

    //count documents in search results
    const numDoc = await Offer.countDocuments(filteredOffers);
    const resultat = { count: numDoc, offers: filteredOffers };
    //send answer to client
    res.status(200).json(resultat);
  } catch (error) {
    res.status(400).json("Bad request");
  }
};
router.get("/offers", searchOffers);

//export module
module.exports = router;
