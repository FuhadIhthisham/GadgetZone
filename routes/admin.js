var express = require("express");
var router = express.Router();
var session = require("express-session");
const adminHelper = require("../helpers/admin-helper");

// file system
const fs = require('fs')


const adminData = {
  email: "fuhad@mail.com",
  pass: "12345",
};
/* GET admin dashboard. */
router.get("/", verifyLogin, function (req, res, next) {
  res.header(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  );
  res.render("admin/admin-dashboard", {
    title: "Admin",
    admin: true,
    header: "ADMIN DASHBOARD",
  });
});

function verifyLogin(req, res, next) {
  if (req.session?.adminLoggedIn) {
    next();
  } else {
    res.redirect("/admin/login");
  }
}

/* GET admin login page. */
router.get("/login", function (req, res, next) {
  if (req.session.adminLoggedIn) {
    res.redirect("/admin");
  } else {
    res.render("admin/admin-login", {
      title: "Admin",
      admin: true,
      noSidebar: true,
      loginErr: req.session.adminLoginErr,
    });
  }
  req.session.adminLoginErr = false;
});

// post admin credentials
router.post("/login", function (req, res, next) {
  if (
    adminData.email === req.body?.email &&
    adminData.pass === req.body?.pass
  ) {
    console.log("login success");
    req.session.adminLoggedIn = true;
    res.redirect("/admin");
  } else {
    req.session.adminLoginErr = "Invalid Username or Password";
    res.redirect("/admin/login");
  }
});

// logout admin
router.get("/logout", function (req, res, next) {
  req.session.adminLoggedIn = false;
  res.redirect("/admin/login");
});

// category management
var catMsg;
router.get("/category", verifyLogin, function (req, res, next) {
  adminHelper.getCategory().then((allCategory) => {
    res.render("admin/category", {
      admin: true,
      header: "CATEGORY MANAGEMENT",
      catMsg,
      subCatMsg,
      allCategory,
    });
    catMsg = null;
    subCatMsg = null;
  });
});

// add category
router.post("/addCategory", function (req, res, next) {
  adminHelper.addCategory(req.body).then((response) => {
    catMsg = response;
    res.redirect("/admin/category");
  });
});

// add subcategory
var subCatMsg;
router.post("/addSubcategory", function (req, res, next) {
  adminHelper.addCategory(req.body).then((response) => {
    subCatMsg = response;
    res.redirect("/admin/category");
  });
});

// delete subcategory
router.get("/delete-subcategory/", function (req, res, next) {
  adminHelper.deletesubCategory(req.query).then((response) => {
    res.redirect("/admin/category");
  });
});

// delete Category
router.get("/delete-category/", function (req, res, next) {
  adminHelper.deleteCategory(req.query).then((response) => {
    res.redirect("/admin/category");
  });
});

// Brand management
var brandMsg;
router.get("/brand", verifyLogin, function (req, res, next) {
  adminHelper.getBrand().then((allBrand) => {
    res.render("admin/brand-manage", {
      admin: true,
      header: "BRAND MANAGEMENT",
      brandMsg,
      allBrand,
    });
    brandMsg = null;
  });
});

// add Brand
router.post("/addBrand", function (req, res, next) {
  adminHelper.addBrand(req.body).then((response) => {
    brandMsg = response;
    if(brandMsg.status && brandMsg.result){
      let brandLogo = req.files.brandLogo
      let id = response.result.insertedId
      brandLogo.mv('./public/images/brand-logo/'+id+'.png',(err,done)=>{
        if(!err){
          console.log("Brand added success");
          res.redirect("/admin/brand");
        }
        else {
          console.log("brand added failed");
          res.redirect("/admin/brand");
        }
      })
    }
    else{
      console.log("brand already exists");
      res.redirect("/admin/brand");
    }
  });
});

// delete brand
router.get("/delete-brand/", function (req, res, next) {
  adminHelper.deleteBrand(req.query).then((response) => {
    if(response){
      
      // To delete brand logo file
      fs.unlink('./public/images/brand-logo/'+req.query.id+'.png', (err) => {
        if (err) {
            console.log(err);
        }
        else{

          console.log("File is deleted.");
        }
    });
    res.redirect("/admin/brand");
    }
  });
});

// Add product
router.get("/add-product", verifyLogin, function (req, res, next) {
  res.render("admin/add-product", {
    title: "Add Product",
    admin: true,
    header: "PRODUCT MANAGEMENT",
  });
});


module.exports = router;