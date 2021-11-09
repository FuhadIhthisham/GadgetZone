var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "GadgetZone" });
});


router.get("/login", function (req, res, next) {
  res.render("user-login", { title: "GadgetZone" });
});


router.get("/signup", function (req, res, next) {
  res.render("signup", { title: "GadgetZone" });
});


router.get("/checkout", function (req, res, next) {
  res.render("checkout", { title: "GadgetZone" });
});


router.get("/otp-verify", function (req, res, next) {
  res.render("otp-verify", { title: "GadgetZone" });
});


router.get("/product-details", function (req, res, next) {
  res.render("product-details", { title: "GadgetZone" });
});

router.get("/product-list", function (req, res, next) {
  res.render("product-list", { title: "GadgetZone" });
});


router.get("/shopping-cart", function (req, res, next) {
  res.render("shopping-cart", { title: "GadgetZone" });
});


router.get("/wishlist", function (req, res, next) {
  res.render("wishlist", { title: "GadgetZone" });
});

module.exports = router;
