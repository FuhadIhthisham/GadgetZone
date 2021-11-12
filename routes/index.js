var express = require("express");
const session = require("express-session");
const { response } = require("../app");
var router = express.Router();
var userHelper = require("../helpers/user-helpers");

/* GET home page. */
router.get("/", (req, res, next) => {
  let user = req.session.user;
  res.render("index", { title: "GadgetZone", user });
});

// verify login
function verifyLogin(req, res, next) {
  if (req.session?.user?.loggedIn) {
    next();
  } else {
    res.redirect("/login");
  }
}

// login get
router.get("/login", (req, res, next) => {
  if (req.session.user?.loggedIn) {
    res.redirect("/");
  } else {
    res.render("user-login", {
      title: "GadgetZone",
      loginErr: req.session.userLoginErr,
    });
  }
  req.session.userLoginErr = false
});

// login post
router.post("/login", (req, res, next) => {
  userHelper.loginUser(req.body).then((response) => {
    if (response.status) {
      console.log("login success");
      req.session.user = response.user;
      req.session.user.loggedIn = true;
      console.log(req.session.user);
      res.redirect("/");
    } else {
      req.session.userLoginErr = "Invalid username or password";
      res.redirect("/login");
    }
  });
});

// signup get
router.get("/signup", (req, res, next) => {

  if (!req.session?.user?.loggedIn) {
    res.render("signup", { title: "GadgetZone" });
  } else {
    res.redirect("/");
  }

});

// signup post
router.post("/signup", (req, res, next) => {
  delete req.body.confirmPass
  userHelper.addUser(req.body).then((response) => {
    let errorMsg = response.msg;
    if (response.status) {
      console.log(response.msg);
      res.render("signup", { errorMsg });
    }
    // else if (req.session.userLoggedIn) {
    //   res.redirect("/");
    // }
    else {
      res.redirect("/login");
      // signupSuccess = true;
      // userBlocked = false;
    }
  });
});

router.get("/checkout", function (req, res, next) {
  res.render("checkout", { title: "GadgetZone", user:req.session.user });
});

router.get("/otp-verify", function (req, res, next) {
  res.render("otp-verify", { title: "GadgetZone" });
});

router.get("/logout", function (req, res, next) {
  req.session.user.loggedIn = false
  req.session.user = null
  res.redirect('/')
});

router.get("/reset-password", function (req, res, next) {
  res.render("reset-password", { title: "GadgetZone" });
});

router.get("/product-details", function (req, res, next) {
  res.render("product-details", { title: "GadgetZone", user:req.session.user });
});

router.get("/product-list", function (req, res, next) {
  res.render("product-list", { title: "GadgetZone", user:req.session.user });
});

router.get("/shopping-cart", function (req, res, next) {
  res.render("shopping-cart", { title: "GadgetZone", user:req.session.user });
});

router.get("/wishlist", function (req, res, next) {
  res.render("wishlist", { title: "GadgetZone", user:req.session.user });
});

module.exports = router;
