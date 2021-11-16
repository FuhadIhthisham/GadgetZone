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
var OtpPhone
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
          console.log("phone check ress>>>>>>"+ress);
          OtpPhone = phone
          console.log(OtpPhone);
          res.render("otp-verify",{OtpPhone});
        });
      }else{
        req.session.userLoginErr = "Invalid Phone Number";
        res.redirect("/login");
    }
  });
  OtpPhone = null   //  changed to default value
});

//post otp verify
router.get("/otp-verify",(req,res)=>{
  res.header(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  );
  let phoneNumber = req.query.phonenumber;
  let otpNumber = Number(req.query.otpnumber);
  console.log("phone::::"+phoneNumber);
  console.log("otp::::"+otpNumber);
  client.verify
  .services(serviceSid)
  .verificationChecks.create({
    to:"+91"+phoneNumber,
    code:otpNumber
  })
  .then((resp=>{
    if(resp.valid){
      userHelper.phoneCheck(phoneNumber).then((response)=>{
        req.session.user = response.user;
       console.log("session user in otp>>>>> "+req.session.user);
        req.session.user.loggedIn = true;
        let valid = true;
       res.send(valid);
      })
    }else{
      let valid = false;

      res.send(valid);
    }
  }));
})


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
      signupSuccess,
      loginErr: req.session.userLoginErr,
    });
  }
  req.session.userLoginErr = false;
  signupSuccess = null
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


// GET FORGOT PASSWORD PAGE
var forgotPassErr
router.get('/forgot-pass',(req,res,next)=>{
  res.header(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
    );
    res.render('forgot-pass',{forgotPassErr})
  })
  

  // forgot pass phone number page post
router.post("/forgot-pass", function (req, res, next) {
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
          OtpPhone = phone
          console.log(OtpPhone);
          res.render("forget-otp",{OtpPhone});
        });
      }else{
        forgotPassErr = "No Account With This Phone Number";
        res.redirect("/forgot-pass");
    }
  }); 
  forgotPassErr = null
});




// FORGET PASSWORD GET CHECK OTP and verify
router.get("/forgot-otp",(req,res)=>{
  res.header(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  );
  let phoneNumber = req.query.phonenumber;
  let otpNumber = Number(req.query.otpnumber);
  console.log("phone::::"+phoneNumber);
  console.log("otp::::"+otpNumber);
  client.verify
  .services(serviceSid)
  .verificationChecks.create({
    to:"+91"+phoneNumber,
    code:otpNumber
  })
  .then((resp=>{
    if(resp.valid){
          console.log("forgot pass OTP verified ");
          let valid = true;
          res.send(valid);
        }
        else{
          let valid = false;
          console.log("OTP  ERRORRRRRRRRRRR!!!!!!!!!!!!!!");
          res.send(valid);  
        }
  }));
})


// GET RESET PASSWORD PAGE
  router.get("/reset-password", function (req, res, next) {
    res.header(
      "Cache-Control",
      "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
    );
    console.log("reset otp>>>>>>>>>>>>>>"+OtpPhone);
    res.render("reset-password", { title: "GadgetZone",OtpPhone });
  });

  // post resetted password
  router.post('/reset-pass',(req,res,next)=>{
    console.log(req.body);
    userHelper.resetPass(req.body).then((response)=>{
      if(response){
        signupSuccess = "Password Reset Success"
        res.redirect('/login')
      }
    });
  })


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
  res.header(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  );
  if (!req.session?.user?.loggedIn) {
    res.render("signup", { title: "GadgetZone" });
  } else {
    res.redirect("/");
  }
});

// signup post
var userSignup
router.post("/signup",(req,res,next)=>{
  
  userHelper.userCheck(req.body).then((ress)=>{
    let errorMsg = ress.msg;
    if(ress.userExist){
      console.log("User exist");
      res.render("signup", { errorMsg });
    }
    else {
      userSignup = req.body
      console.log("not exist");

      // sent OTP
      client.verify
        .services(serviceSid)
        .verifications.create({
          to: `+91${req.body.phone}`,
          channel: "sms",
        })
        .then((ress) => {
          console.log("phone check ress>>>>>>"+ress);
          let signupPhone = req.body.phone
          console.log(signupPhone);
          res.render('signupOtp',{signupPhone})
        });


      
    }
  })
})

// resend otp route
router.post('/resendOtp',(req,res)=>{
  console.log(req.query);
})

// SignupOTP GET CHECK OTP and verify
var signupSuccess
router.get("/signupOtp",(req,res)=>{
  res.header(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  );
  let phoneNumber = req.query.phonenumber;
  let otpNumber = Number(req.query.otpnumber);
  console.log("phone::::"+phoneNumber);
  console.log("otp::::"+otpNumber);
  client.verify
  .services(serviceSid)
  .verificationChecks.create({
    to:"+91"+phoneNumber,
    code:otpNumber
  })
  .then((resp=>{
    if(resp.valid){

      userHelper.addUser(userSignup).then((response)=>{
        if(response.status){
          console.log("Signup Success");
          let valid = true;
          signupSuccess = "Welcome and Happy Shopping, Signup Success"
          res.send(valid);
        }
        else{
          let valid = false;
          res.send(valid);
          console.log("Signup ERRORRRRRRRRRRR!!!!!!!!!!!!!!");
        }
      })
    }
  }));
})


router.get("/checkout", function (req, res, next) {
  res.render("checkout", { title: "GadgetZone", user: req.session.user });
});

router.get("/logout", function (req, res, next) {
  req.session.user.loggedIn = false;
  req.session.user = null;
  res.redirect("/");
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
