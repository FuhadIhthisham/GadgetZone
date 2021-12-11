var express = require("express");
const session = require("express-session");
const { response } = require("../app");
const adminHelper = require("../helpers/admin-helper");
const productHelper = require("../helpers/product-helper");
var router = express.Router();
var userHelper = require("../helpers/user-helpers");

const paypal = require("paypal-rest-sdk");

paypal.configure({
  mode: "sandbox", //sandbox or live
  client_id: "ASXKDw5IGYcTR1oV9aYV-oG9ZlUN5M2rwIWBVsQTK713O5tRp7iq0CQRnfQieWzWeDvabX57PRhVhDPy",
  client_secret: "ECUMa0lsTfQvU3jRP_21gg2MT8L4yElZv3Ppb-f0XnqBeSiCTjLx8-Iv4U9ZI1MVzKdeMa1XKofrJgm2",
});

var objectId = require("mongodb").ObjectId;

const allStates = require("../config/lists").allStates;

// twilio API

const accountSid = process.env.accountSid; ///// REMOVE THESE LINES BEFORE PUSING TO GIT
const authToken = process.env.authToken;
const serviceSid = process.env.serviceSid;
const client = require("twilio")(accountSid, authToken);

/* GET home page. */

let cartCount;
router.get("/", verifyLogin, async (req, res, next) => {

  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id);
  } else {
    cartCount = null;
  }

  const date = new Date()
  
  await productHelper.checkOfferExpiry(new Date).then((resp)=>{
    console.log("responseeee>>>>>>>>>>>>>>");
    console.log(resp);
  })

  let banners = await adminHelper.getBanner();
  productHelper.getAllProducts().then((allProducts) => {
    let user = req.session.user;
    res.render("index", {
      title: "GadgetZone",
      user,
      allProducts,
      cartCount,
      banners,
    });
  });
  cartMsg = null;
});

// verify login
function verifyLogin(req, res, next) {
  if (req.session?.user?.loggedIn) {
    adminHelper.checkBlock(req.session.user).then((isBlock) => {
      if (!isBlock) {
        next();
      } else {
        blockMsg = "Sorry, This user is Blocked";
        res.redirect("/login");
      }
    });
  } else {
    next();
  }
}
// verify block
function verifyBlock(req, res, next) {
  if (req.session?.user?.loggedIn) {
    adminHelper.checkBlock(req.session.user).then((isBlock) => {
      if (!isBlock) {
        next();
      } else {
        blockMsg = "Sorry, This user is Blocked";
        res.redirect("/login");
      }
    });
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
var userSignup;
router.post("/signup", (req, res, next) => {
  userHelper.userCheck(req.body).then((ress) => {
    let errorMsg = ress.msg;
    if (ress.userExist) {
      console.log("User exist");
      res.render("signup", { errorMsg });
    } else {
      userSignup = req.body;
      console.log("not exist");

      // sent OTP
      client.verify
        .services(serviceSid)
        .verifications.create({
          to: `+91${req.body.phone}`,
          channel: "sms",
        })
        .then((ress) => {
          console.log("phone check ress>>>>>>" + ress);
          let signupPhone = req.body.phone;
          console.log(signupPhone);
          res.render("signupOtp", { signupPhone });
        });
    }
  });
});

// login get
var blockMsg;
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
      blockMsg,
      loginErr: req.session.userLoginErr,
    });
  }
  req.session.userLoginErr = false;
  blockMsg = "";
  signupSuccess = null;
});

// login post
router.post("/login", (req, res, next) => {
  userHelper.loginUser(req.body).then((response) => {
    if (response.status) {
      if (!response.user.userBlocked) {
        console.log("login success");
        req.session.user = response.user;
        req.session.user.loggedIn = true;
        res.redirect("/");
      } else {
        blockMsg = "Sorry, This user is blocked";
        res.redirect("/login");
      }
    } else {
      req.session.userLoginErr = "Invalid username or password";
      res.redirect("/login");
    }
  });
});

// phone number page post
var OtpPhone;
router.post("/phone-verify", function (req, res, next) {
  res.header(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  );
  var phone = req.body.phone;
  req.session.mob = phone; //mobile otp login number storing in session
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
  OtpPhone = null; //  changed to default value
});

//post otp verify
router.get("/otp-verify", (req, res) => {
  res.header(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  );
  let phoneNumber = req.query.phonenumber;
  let otpNumber = req.query.otpnumber;
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
          req.session.mob = null;
          res.send(valid);
        });
      } else {
        let valid = false;

        res.send(valid);
      }
    });
});

// resend otp route
router.get("/resendOtp", (req, res) => {
  res.header(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  );
  client.verify
    .services(serviceSid)
    .verifications.create({
      to: `+91${req.session.mob}`,
      channel: "sms",
    })
    .then((ress) => {
      console.log("phone check ress>>>>>>" + ress);
      let OtpPhone = req.session.mob;
      console.log(OtpPhone);
      res.render("otp-verify", { OtpPhone });
    });
});

// GET FORGOT PASSWORD PAGE
var forgotPassErr;
router.get("/forgot-pass", (req, res, next) => {
  res.header(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  );
  res.render("forgot-pass", { forgotPassErr });
});

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
          OtpPhone = phone;
          console.log(OtpPhone);
          res.render("forget-otp", { OtpPhone });
        });
    } else {
      forgotPassErr = "No Account With This Phone Number";
      res.redirect("/forgot-pass");
    }
  });
  forgotPassErr = null;
});

// FORGET PASSWORD GET CHECK OTP and verify
router.get("/forgot-otp", (req, res) => {
  res.header(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  );
  let phoneNumber = req.query.phonenumber;
  req.session.mob = phoneNumber;
  let otpNumber = req.query.otpnumber;
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
        console.log("forgot pass OTP verified ");
        let valid = true;
        res.send(valid);
      } else {
        let valid = false;
        console.log("OTP  ERRORRRRRRRRRRR!!!!!!!!!!!!!!");
        res.send(valid);
      }
    });
});

// resend otp route
router.get("/resendotp", (req, res) => {
  res.header(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  );
  client.verify
    .services(serviceSid)
    .verifications.create({
      to: `+91${req.session.mob}`,
      channel: "sms",
    })
    .then((ress) => {
      console.log("phone check ress>>>>>>" + ress);
      let OtpPhone = req.session.mob;
      console.log(OtpPhone);
      res.render("otp-verify", { OtpPhone });
    });
});

// GET RESET PASSWORD PAGE
router.get("/reset-password", function (req, res, next) {
  res.header(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  );
  console.log("reset otp>>>>>>>>>>>>>>" + OtpPhone);
  req.session.mob = null;
  res.render("reset-password", { title: "GadgetZone", OtpPhone });
});

// post resetted password
router.post("/reset-pass", (req, res, next) => {
  console.log(req.body);
  userHelper.resetPass(req.body).then((response) => {
    if (response) {
      signupSuccess = "Password Reset Success";
      res.redirect("/login");
    }
  });
});

// SignupOTP GET CHECK OTP and verify
var signupSuccess;
router.get("/signupOtp", (req, res) => {
  res.header(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  );
  let phoneNumber = req.query.phonenumber;
  let otpNumber = req.query.otpnumber;
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
        userHelper.addUser(userSignup).then((response) => {
          if (response.status) {
            console.log("Signup Success");
            let valid = true;
            signupSuccess = "Welcome and Happy Shopping, Signup Success";
            res.send(valid);
          } else {
            let valid = false;
            res.send(valid);
            console.log("Signup ERRORRRRRRRRRRR!!!!!!!!!!!!!!");
          }
        });
      }
    });
});

router.get("/logout", function (req, res, next) {
  if(req.session?.user){
    req.session.user.loggedIn = false;
    req.session.user = null;
  }
  res.redirect("/");
});

router.get("/product-details", async (req, res, next) => {
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id);
  }
  productHelper.getOneProduct(req.query.id).then((response) => {
    res.render("product-details", {
      title: "GadgetZone",
      user: req.session.user,
      productDetails: response,
      cartCount,
    });
  });
});

// get product lists

var isSubProducts
var subCatName
var isBrandProducts
var brandName

router.get("/product-list", async function (req, res, next) {
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id);
  }
  let allCategory = await productHelper.getAllSubcategory()
  let allBrands = await productHelper.getAllBrands()
  let user = req.session?.user;
  if(isSubProducts){
    let subProducts = await productHelper.getSubcatProducts(subCatName)
    res.render("product-list", {
      title: "GadgetZone",
      user,
      cartCount,
      allCategory,
      allBrands,
      subProducts,
    });
  }
  else if(isBrandProducts){
    let brandProducts = await productHelper.getBrandProducts(brandName)
    res.render("product-list", {
      title: "GadgetZone",
      user,
      cartCount,
      allCategory,
      allBrands,
      brandProducts,
    });
  }
  else{
    productHelper.getAllProducts().then(async (allProducts) => {
      res.render("product-list", {
        title: "GadgetZone",
        user,
        allProducts,
        allBrands,
        cartCount,
        allCategory,
      });
    });
  }
  isSubProducts = false
  subCatName = null
  isBrandProducts = false
  brandName = null
});


router.post("/getSubProducts",(req,res)=>{
  isSubProducts = true
  subCatName = req.body.subName
  res.json({status:true})
})

router.get("/getBrandProducts",(req,res)=>{
  isBrandProducts = true
  brandName = req.query.brandName
  res.json({status:true})
})

// cart view page
router.get("/cart", async (req, res, next) => {
  if (req.session?.user?.loggedIn) {
    let products = await userHelper.getCartProducts(req.session.user._id);
    console.log(products);
    let grandTotal = await userHelper.getGrandTotal(req.session.user._id);
    if (products.length == 0) {
      cartMsg = "Cart is Empty";
      grandTotal = 0.0;
    } else {
      grandTotal = grandTotal[0]?.grandTotal;
    }
    res.render("shopping-cart", {
      title: "GadgetZone",
      user: req.session.user,
      products,
      grandTotal,
      cartMsg,
    });
  } else {
    res.redirect("/login");
  }
});

// Addto cart
var cartMsg;
router.post("/add-to-cart/:id", function (req, res, next) {
  if (req.session?.user) {
    userHelper
      .addToCart(req.params.id, req.session.user._id, req.body.productTotal)
      .then((response) => {
        if (!response?.productExist) {
          res.json({ status: true });
        } else {
          res.json({ productExist: true });
        }
      });
  } else {
    res.json({ status: false });
  }
});

// change cart product quantity
router.post("/change-quantity", verifyBlock, (req, res) => {
  userHelper.changeQuantity(req.body).then(async (response) => {
    // response.total = await userHelper.totalAmount(req.session.user._id)
    res.json(response);
  });
});

// delete product from cart
router.post("/delete-cart-product", verifyBlock, (req, res) => {
  userHelper
    .deleteCartProduct(req.body, req.session.user._id)
    .then((response) => {
      res.json(response);
    });
});


// post check coupon offer
var couponMsg
router.post("/check-coupon", verifyLogin,async (req, res, next) => {
  console.log(req.body);
  await productHelper.checkCouponOffer(req.body.code,req.session.user._id).then((resp)=>{
    if(resp.status){
      res.json(resp.couponExist)
    }
    else if(resp.isUsed){
      console.log("Already Used by user>>>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<");
      let isUsed = true
      res.json({isUsed})
    }
    else{
      resp = false
      res.json(resp)
    }
  })
});

// View Checkout page 
router.get("/checkout", verifyBlock, async function (req, res, next) {
  let products = await userHelper.getCartProducts(req.session.user._id);
  if (products.length != 0) {
    let addresses = await userHelper.getAddress(req.session.user._id);
    console.log(products);
    let grandTotal = await userHelper.getGrandTotal(req.session.user._id);
    grandTotal = grandTotal[0]?.grandTotal;
    res.render("checkout", {
      title: "GadgetZone",
      user: req.session.user,
      addresses,
      products,
      grandTotal,
      checkoutAddressMsg,
    });
    checkoutAddressMsg = null;
  }
  else {
    res.redirect("/");
  }
});


// view checkout page on buy now
router.get("/buy-now", verifyBlock, async function (req, res, next) {
  var proId = req.query.proId
  let products = await productHelper.getOneProduct(proId)
    let addresses = await userHelper.getAddress(req.session.user._id);
    console.log(products);
    res.render("buy-now", {
      title: "GadgetZone",
      user: req.session.user,
      addresses,
      products,
    });
});

router.post("/add-buynow-address", verifyBlock, function (req, res, next) {
  userHelper.addAddress(req.session.user, req.body).then((resp) => {
    if (resp?.addressExist) {
      checkoutAddressMsg = "Sorry, This Address Already Exists";
      console.log("address exist");
      res.redirect("/buy-now");
    } else {
      checkoutAddressMsg = "New Address Added";
      res.redirect("/buy-now");
    }
  });
});

// place order in checkout page
var code
router.get("/place-order", verifyBlock, async function (req, res, next) {
  let discount
  code = req.query.code
  let grandTotal = await userHelper.getGrandTotal(req.session.user._id);
  let products = await userHelper.getCartProductsList(req.session.user._id);
  let address = await userHelper.getOneAddress(
    req.query.addressId,
    req.session.user._id
  );
  grandTotal = grandTotal[0]?.grandTotal;
  grandTotal = parseInt(grandTotal);
  address = address[0].address;

  if(req.query.code !== 'undefined'){
    discount = parseInt(req.query.disc)
    grandTotal = grandTotal-discount
  }

  isBuyNow = false
  let rzpId = new objectId(); // creating an id for razorpay
  userHelper
    .placeOrder(
      req.query.payment,
      req.session.user._id,
      address,
      products,
      grandTotal,
      code
    )
    .then((resp) => {
      // if payment method is COD
      if (req.query.payment == "COD") {
        res.json({ codSuccess: true });
      }

      // If payment method is paypal
      else if (req.query.payment == "paypal") {
        req.session.orderDetails = resp;
        console.log(resp);
        console.log(grandTotal);
        dollarTotal = (grandTotal / 70).toFixed(2);
        dollarTotal = dollarTotal.toString();
        const create_payment_json = {
          intent: "sale",
          payer: {
            payment_method: "paypal",
          },
          redirect_urls: {
            return_url: "https://www.gadgetzone.site/success",
            cancel_url: "https://www.gadgetzone.site/cancel",
          },
          transactions: [
            {
              item_list: {
                items: [
                  {
                    name: "GadgetZone",
                    sku: "1212",
                    price: dollarTotal,
                    currency: "USD",
                    quantity: 1,
                  },
                ],
              },
              amount: {
                currency: "USD",
                total: dollarTotal,
              },
              description: "Thanks for shopping with GadgetZone",
            },
          ],
        };

        paypal.payment.create(create_payment_json, function (error, payment) {
          if (error) {
            throw error;
          } else {
            for (let i = 0; i < payment.links.length; i++) {
              if (payment.links[i].rel == "approval_url") {
                let url = payment.links[i].href;
                res.json({ data: true, url });
              }
            }
          }
        });
      }

      // if payment method is razorpay
      else {
        req.session.orderDetails = resp;
        grandTotal = parseInt(grandTotal);
        userHelper.generateRazorpay(rzpId, grandTotal).then((resp) => {
          res.json(resp);
        });
      }
    });
});


// place order in buynow page
var isBuyNow
router.get("/place-order-buynow", verifyBlock, async function (req, res, next) {
  let proId = req.query.proId
  let products
  let grandTotal
  let address
  let discount
  code = req.query.code
  isBuyNow = true
  products = await productHelper.getOneProduct(proId);
  discount = parseInt(req.query.disc)

  if(products[0].productVariants[0].offerPrice){
    grandTotal = products[0].productVariants[0].offerPrice
    
    if(req.query.code !== 'undefined'){
      grandTotal = grandTotal-discount
    }
  }
  else{
    grandTotal = products[0].productVariants[0].productPrice

    if(req.query.code !== 'undefined'){
      grandTotal = grandTotal-discount
    }
  }
  address = await userHelper.getOneAddress(
  req.query.addressId,
  req.session.user._id
  );

  
  let rzpId = new objectId(); // creating an id for razorpay
  address = address[0].address;
  userHelper
    .placeBuynowOrder(
      req.query.payment,
      req.session.user._id,
      address,
      products,
      grandTotal,
      code
    )
    .then((resp) => {
      // if payment method is COD
      if (req.query.payment == "COD") {
        res.json({ codSuccess: true });
      }

      // If payment method is paypal
      else if (req.query.payment == "paypal") {
        req.session.orderDetails = resp;
        console.log(resp);
        console.log(grandTotal);
        dollarTotal = (grandTotal / 70).toFixed(2);
        dollarTotal = dollarTotal.toString();
        const create_payment_json = {
          intent: "sale",
          payer: {
            payment_method: "paypal",
          },
          redirect_urls: {
            return_url: "https://www.gadgetzone.site/success",
            cancel_url: "https://www.gadgetzone.site/cancel",
          },
          transactions: [
            {
              item_list: {
                items: [
                  {
                    name: "GadgetZone",
                    sku: "1212",
                    price: dollarTotal,
                    currency: "USD",
                    quantity: 1,
                  },
                ],
              },
              amount: {
                currency: "USD",
                total: dollarTotal,
              },
              description: "Thanks for shopping with GadgetZone",
            },
          ],
        };

        paypal.payment.create(create_payment_json, function (error, payment) {
          if (error) {
            throw error;
          } else {
            for (let i = 0; i < payment.links.length; i++) {
              if (payment.links[i].rel == "approval_url") {
                let url = payment.links[i].href;
                res.json({ data: true, url });
              }
            }
          }
        });
      }

      // if payment method is razorpay
      else {
        req.session.orderDetails = resp;
        grandTotal = parseInt(grandTotal);
        userHelper.generateRazorpay(rzpId, grandTotal).then((resp) => {
          res.json(resp);
        });
      }
    });
});



// if paypal is success
var dollarTotal;
router.get("/success", async (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;
  console.log(dollarTotal);
  const execute_payment_json = {
    payer_id: payerId,
    transactions: [
      {
        amount: {
          currency: "USD",
          total: dollarTotal,
        },
      },
    ],
  };
  paypal.payment.execute(
    paymentId,
    execute_payment_json,
    function (error, payment) {
      if (error) {
        console.log(error.response);
        throw error;
      } else {
        console.log(JSON.stringify(payment));

        userHelper.changePaymentStatus(req.session.orderDetails,isBuyNow,code,req.session.user._id).then(() => {
          console.log("Payment Success");
          res.redirect("/order-placed");
        });
      }
    }
  );
});

router.get("/cancel", (req, res) => {
  res.render('payment-cancel',{title: "GadgetZone", user: req.session.user})
});

router.post("/verify-payment", verifyBlock, function (req, res, next) {
  console.log(req.body);
  console.log(code+" this is code>>>>>>>>>>>>>>>>>");
  let orderDetails = req.session.orderDetails;
  console.log(orderDetails);
  userHelper
    .verifyPayment(req.body)
    .then(() => {
      userHelper.changePaymentStatus(orderDetails,isBuyNow,code).then(() => {
        console.log("Payment Success");
        res.json({ status: true });
      });
    })
    .catch((err) => {
      console.log(err);
      res.json({ status: false });
    });
});

router.get("/order-placed", verifyBlock, async function (req, res, next) {
  res.render("order-placed", { title: "GadgetZone", user: req.session.user });
});

router.get("/my-orders", verifyBlock,async function (req, res, next) {
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id);
  } else {
    cartCount = null;
  }
  userHelper.getAllOrders(req.session.user._id).then((allOrders) => {
    res.render("my-orders", {
      title: "GadgetZone",
      user: req.session.user,
      allOrders,
      cartCount
    });
  });
});

router.post("/cancel-product", verifyBlock, function (req, res, next) {
  userHelper
    .cancelProduct(req.body.orderId, req.body.proId)
    .then((allOrders) => {
      res.json({ status: true });
    });
});


// Get wishlist products
router.get("/wishlist", verifyBlock,async function (req, res, next) {
  var wishlistMsg
  let wishlists = await userHelper.getWishlist(req.session.user._id)
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id);
  }
  if(wishlists.length == 0){
    wishlistMsg = "Wishlist is Empty"
  }
  res.render("wishlist", { title: "GadgetZone", user: req.session.user, wishlists, cartCount, wishlistMsg });
  wishlistMsg = null
});

// add products to wishlist
router.post("/add-to-wishlist", verifyBlock, function (req, res, next) {
  if(req.session?.user){
    userHelper.addToWishlist(req.body.proId,req.body.userId).then((resp)=>{
      if(resp?.productExist){
        res.json({productExist:true})
      }
      else{
        res.json({status:true})
      }
    })
  }
  else{
    res.json({status:false})
  }
});


// remopve products from wishlist
router.post("/remove-wishlist", verifyBlock, function (req, res, next) {
  if(req.session?.user){
    userHelper.removeWishlist(req.body.proId,req.body.userId).then((resp)=>{
      if(resp){
        res.json({status:true})
      }
      else{
        res.json({status:false})
      }
    })
  }
});




// user profile page get
var profileMsg;
router.get("/user-profile", verifyBlock, async function (req, res, next) {
  let user = await userHelper.getOneUser(req.session.user._id);
  await userHelper.getAddress(req.session.user._id).then((resp) => {
    res.render("user-profile", {
      title: "GadgetZone",
      user,
      resp,
      profileMsg,
      cartCount,
      changePassMsg,
    });
    profileMsg = null;
    changePassMsg = null;
  });
});

// change user password
var changePassMsg = null;
router.post("/change-password", verifyBlock, function (req, res, next) {
  userHelper.changePassword(req.session.user._id, req.body).then((resp) => {
    if (resp.status) {
      profileMsg = "Password Updated Successfully";
      res.redirect("/user-profile");
    } else {
      changePassMsg = resp.changePassMsg;
      console.log("Password not updated");
      res.redirect("/user-profile");
    }
  });
});

// add address get
router.get("/add-address", verifyBlock, function (req, res, next) {
  res.render("add-address", {
    title: "GadgetZone",
    user: req.session.user,
    allStates,
    addressMsg,
  });
  addressMsg = null;
});

// add address post
var addressMsg;
router.post("/add-address", verifyBlock, function (req, res, next) {
  console.log(req.body);
  userHelper.addAddress(req.session.user, req.body).then((resp) => {
    if (resp?.addressExist) {
      addressMsg = "Sorry, This Address Already Exists";
      console.log("address exist");
      res.redirect("/add-address");
    } else {
      profileMsg = "New Address Added";
      res.redirect("/user-profile");
    }
  });
});
// add checkout address
var checkoutAddressMsg;
router.post("/add-checkout-address", verifyBlock, function (req, res, next) {
  userHelper.addAddress(req.session.user, req.body).then((resp) => {
    if (resp?.addressExist) {
      checkoutAddressMsg = "Sorry, This Address Already Exists";
      console.log("address exist");
      res.redirect("/checkout");
    } else {
      checkoutAddressMsg = "New Address Added";
      res.redirect("/checkout");
    }
  });
});

// edit address get
router.get("/edit-address", verifyBlock, function (req, res, next) {
  userHelper.getOneAddress(req.query.id, req.session.user._id).then((resp) => {
    res.render("edit-address", {
      title: "GadgetZone",
      user: req.session.user,
      allStates,
      addressMsg,
      address: resp,
    });
  });
});

// edit address post
var addressMsg;
router.post("/edit-address", verifyBlock, function (req, res, next) {
  userHelper
    .editAddress(req.session.user._id, req.body, req.query.id)
    .then((resp) => {
      if (resp) {
        profileMsg = "Address Updated Successfully";
        res.redirect("/user-profile");
      } else {
        console.log("Address not updated");
      }
    });
});

// edit user post
router.post("/edit-profile", verifyBlock, function (req, res, next) {
  userHelper.editProfile(req.session.user._id, req.body).then((resp) => {
    if (resp) {
      profileMsg = "Profile Updated Successfully";
      res.redirect("/user-profile");
    } else {
      console.log("Profile not updated");
    }
  });
});

// delete address
router.post("/delete-address", verifyBlock, function (req, res, next) {
  console.log(req.body.addressId);
  userHelper.deleteAddress(req.session.user._id, req.body.addressId).then((resp) => {
    res.json({ status: true });
  });
});

module.exports = router;
