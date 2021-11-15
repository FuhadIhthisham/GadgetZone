var express = require("express");
const session = require("express-session");
const { response } = require("../app");
const productHelper = require("../helpers/product-helper");
var router = express.Router();
var userHelper = require("../helpers/user-helpers");

// twilio API

const accountSid = ""; ///// REMOVE THESE LINES BEFORE PUSING TO GIT
const authToken = "";
const serviceSid = "";
const client = require("twilio")(accountSid, authToken);

// phone number page post
var OtpPhone;
router.post("/phone-verify", function (req, res, next) {
  res.header(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  );
  var phone = req.body.phone;
  phone = phone.toString();
  userHelper.phoneCheck(phone).then((response) => {
    if (response.userExist) {
      client.verify
        .services(serviceSid)
        .verifications.create({
          to: `+91${req.body.phone}`,
          channel: "sms",
        })
        .then((ress) => {
          console.log("phone check ress>>>>>>" + ress);
          OtpPhone = phone;
          console.log(OtpPhone);
          res.render("otp-verify", { OtpPhone });
        });
    } else {
      req.session.userLoginErr = "Invalid Phone Number";
      res.redirect("/login");
    }
  });
});

//post otp verify
router.get("/otp-verify", (req, res) => {
  res.header(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  );
  let phoneNumber = req.query.phonenumber;
  let otpNumber = Number(req.query.otpnumber);
  console.log("phone::::" + phoneNumber);
  console.log("otp::::" + otpNumber);
  client.verify
    .services(serviceSid)
    .verificationChecks.create({
      to: "+91" + phoneNumber,
      code: otpNumber,
    })
    .then((resp) => {
      if (resp.valid) {
        userHelper.phoneCheck(phoneNumber).then((response) => {
          req.session.user = response.user;
          console.log("session user in otp>>>>> " + req.session.user);
          req.session.user.loggedIn = true;
          let valid = true;
          res.send(valid);
        });
      } else {
        let valid = false;

        res.send(valid);
      }
    });
});

// login get
router.get("/login", (req, res, next) => {
  res.header(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  );
  if (req.session.user?.loggedIn) {
    res.redirect("/");
  } else {
    res.render("user-login", {
      title: "GadgetZone",
      loginErr: req.session.userLoginErr,
    });
  }
  req.session.userLoginErr = false;
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

/* GET home page. */
router.get("/", (req, res, next) => {
  productHelper.getAllProducts().then((allProducts) => {
    let user = req.session.user;
    res.render("index", { title: "GadgetZone", user, allProducts });
  });
});

// verify login
function verifyLogin(req, res, next) {
  if (req.session?.user?.loggedIn) {
    next();
  } else {
    res.redirect("/login");
  }
}

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
  delete req.body.confirmPass;
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
  res.render("checkout", { title: "GadgetZone", user: req.session.user });
});

router.get("/logout", function (req, res, next) {
  req.session.user.loggedIn = false;
  req.session.user = null;
  res.redirect("/");
});

router.get("/reset-password", function (req, res, next) {
  res.render("reset-password", { title: "GadgetZone" });
});

router.get("/product-details", function (req, res, next) {
  res.render("product-details", {
    title: "GadgetZone",
    user: req.session.user,
  });
});

router.get("/product-list", function (req, res, next) {
  res.render("product-list", { title: "GadgetZone", user: req.session.user });
});

router.get("/shopping-cart", function (req, res, next) {
  res.render("shopping-cart", { title: "GadgetZone", user: req.session.user });
});

router.get("/wishlist", function (req, res, next) {
  res.render("wishlist", { title: "GadgetZone", user: req.session.user });
});

module.exports = router;
