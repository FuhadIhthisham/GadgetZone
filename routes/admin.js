var express = require("express");
var router = express.Router();
var session = require("express-session");
const adminHelper = require("../helpers/admin-helper");
const productHelper = require("../helpers/product-helper");

// file system
const fs = require("fs");
const { response } = require("express");

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
router.post("/addCategory", verifyLogin, function (req, res, next) {
  adminHelper.addCategory(req.body).then((response) => {
    catMsg = response;
    res.redirect("/admin/category");
  });
});

// add subcategory
var subCatMsg;
router.post("/addSubcategory", verifyLogin, function (req, res, next) {
  adminHelper.addCategory(req.body).then((response) => {
    subCatMsg = response;
    res.redirect("/admin/category");
  });
});




// delete subcategory with or without its products
router.post("/delete-subcategory", verifyLogin, function (req, res, next) {
  if (req.body.isPro === "yes" && req.body.item === "sub") {
    productHelper.deleteProAndSubcat(req.body).then((response) => {
      if (response) {
        // To delete subcategory and each products
        let prod = response.allProducts;
        for (i = 0; i < prod.length; i++) {
          for (let j = 1; j <= 4; j++) {
            fs.unlink(
              `./public/images/product-images/${prod[i]._id}_${j}.jpg`,
              (err) => {
                if (err) {
                  console.log(err);
                } else {
                  console.log("product image is deleted.");
                }
              }
            );
          }
        }
      }
    });
  }
  if (req.body.isPro === "no" && req.body.item === "sub") {
    productHelper.deleteProAndSubcat(req.body).then((response) => {
      console.log("subcat deleted");
    });
  }
  res.json({ status: true });
});



// delete category with or without its products
router.post("/delete-category", verifyLogin, function (req, res, next) {
  if (req.body.isPro === "yes" && req.body.item === "cat") {
    productHelper.deleteProAndCat(req.body).then((response) => {
      if (response) {
        // To delete subcategory and each products
        let prod = response.allProducts;
        for (i = 0; i < prod.length; i++) {
          for (let j = 1; j <= 4; j++) {
            fs.unlink(
              `./public/images/product-images/${prod[i]._id}_${j}.jpg`,
              (err) => {
                if (err) {
                  console.log(err);
                } else {
                  console.log("product image is deleted.");
                }
              }
            );
          }
        }
      }
    });
    res.json({ status: true });
  }
  if (req.body.isPro === "no" && req.body.item === "cat") {
    console.log(req.body);
    productHelper.deleteProAndCat(req.body).then((response) => {
      console.log("Category deleted");
    });

    res.json({ status: true });
  }
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
router.post("/addBrand", verifyLogin, function (req, res, next) {
  adminHelper.addBrand(req.body).then((response) => {
    brandMsg = response;
    if (brandMsg.status && brandMsg.result) {
      let brandLogo = req.files.brandLogo;
      let id = response.result.insertedId;
      brandLogo.mv("./public/images/brand-logo/" + id + ".png", (err, done) => {
        if (!err) {
          console.log("Brand added success");
          res.redirect("/admin/brand");
        } else {
          console.log("brand added failed");
          res.redirect("/admin/brand");
        }
      });
    } else {
      console.log("brand already exists");
      res.redirect("/admin/brand");
    }
  });
});

// delete brand
router.post("/delete-brand/", verifyLogin, function (req, res, next) {
  adminHelper.deleteBrand(req.body).then((response) => {
    if (response) {
      // To delete brand logo file
      fs.unlink("./public/images/brand-logo/" + req.body.id + ".png", (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("File is deleted.");
        }
      });
      res.json({ status: true });
    }
  });
});

// get Add product page
router.get("/add-product", verifyLogin, function (req, res, next) {
  adminHelper.getCategory().then((allCategory) => {
    if (allCategory) {
      adminHelper.getBrand().then((allBrand) => {
        if (allBrand) {
          res.render("admin/add-product", {
            title: "Add Product",
            admin: true,
            header: "PRODUCT MANAGEMENT",
            allCategory,
            allBrand,
            productAddMsg,
          });
          productAddMsg = null;
        }
      });
    } else {
      console.log("Category get Unsuccess...!!!");
    }
  });
});

// add Product
var productAddMsg;
router.post("/addProduct", verifyLogin, function (req, res, next) {
  productHelper.addProduct(req.body).then((response) => {
    if (response) {
      productAddMsg = response;
      if (response.status) {
        let prodImg1 = req.files?.product_Image_1;
        let prodImg2 = req.files?.product_Image_2;
        let prodImg3 = req.files.product_Image_3;
        let prodImg4 = req.files?.product_Image_4;
        let prodId = response.result.insertedId;

        // Moving Image 1
        prodImg1.mv(
          `./public/images/product-images/${prodId}_1.jpg`,
          (err, done) => {
            if (!err) {
              // Moving Image 2
              prodImg2.mv(
                `./public/images/product-images/${prodId}_2.jpg`,
                (err, done) => {
                  if (!err) {
                    // Moving Image 3
                    prodImg3.mv(
                      `./public/images/product-images/${prodId}_3.jpg`,
                      (err, done) => {
                        if (!err) {
                          // Moving Image 4
                          prodImg4.mv(
                            `./public/images/product-images/${prodId}_4.jpg`,
                            (err, done) => {
                              if (!err) {
                                console.log("Images Added Success.........");
                                productAddMsg.status = true;
                                res.redirect("/admin/add-product");
                              }
                            }
                          );
                        } else {
                          console.log("Image 3 Adding issue!!!!!!!!");
                          productAddMsg.status = false;
                          productAddMsg.imageErr = "Image Upload Failed";
                          res.redirect("/admin/add-product");
                        }
                      }
                    );
                  } else {
                    console.log("Image 2 Adding issue!!!!!!!!");
                    productAddMsg.status = false;
                    productAddMsg.imageErr = "Image Upload Failed";
                    res.redirect("/admin/add-product");
                  }
                }
              );
            } else {
              console.log("Image 1 Adding issue!!!!!!!!");
              productAddMsg.status = false;
              productAddMsg.imageErr = "Image Upload Failed";
              res.redirect("/admin/add-product");
            }
          }
        );
        console.log("..............product added successfully............");
      } else {
        console.log("product adding unsuccessful response.status problem");
        res.redirect("/admin/add-product");
      }
    } else {
      console.log("product adding unsuccessful no response from db");
      res.redirect("/admin/add-product");
    }
  });
});

// find subcategory
router.get("/find-subcategory", verifyLogin, function (req, res, next) {
  productHelper.getSubcategory(req.query).then((response) => {
    res.send(response);
  });
});

// View products
router.get("/view-product", verifyLogin, function (req, res, next) {
  productHelper.getAllProducts().then((response) => {
    if (response) {
      res.render("admin/view-products", {
        title: "View Product",
        admin: true,
        header: "PRODUCT MANAGEMENT",
        productEditMsg,
        allProducts: response,
      });
    } else {
      console.log("view product response error!!!!");
    }
    productEditMsg = null;
  });
});

// delete product
router.post("/delete-product", verifyLogin, function (req, res, next) {
  console.log(req.body);
  console.log(req.body.id);
  productHelper.getOneProduct(req.body.id).then((result) => {
    productHelper.deleteProduct(req.body.id).then((response) => {
      if (response) {
        // To delete each product images
        for (i = 1; i <= 4; i++) {
          fs.unlink(
            `./public/images/product-images/${req.body.id}_${i}.jpg`,
            (err) => {
              if (err) {
                console.log(err);
              } else {
                console.log("product image is deleted.");
              }
            }
          );
        }
        res.redirect("/admin/view-product");
      } else {
        console.log("Couldn't delete product images[no response]");
        res.redirect("/admin/view-product");
      }
    });
  });
});

// get edit product page
var productEditMsg;
router.get("/edit-product/", verifyLogin, function (req, res, next) {
  productHelper.getOneProduct(req.query).then((result) => {
    if (result) {
      adminHelper.getBrand().then((allBrand) => {
        if (allBrand) {
          adminHelper.getCategory().then((allCategory) => {
            res.render("admin/edit-product", {
              title: "Edit Product",
              admin: true,
              header: "PRODUCT MANAGEMENT",
              productEditMsg,
              allCategory,
              allBrand,
              result,
            });
          });
        }
      });
    } else {
      console.log("Couldn't get edit product page[no result]");
      res.redirect("/admin/view-product");
    }
  });
});

// post editted product
router.post("/edit-product/", verifyLogin, function (req, res, next) {
  productHelper.getOneProduct(req.query).then((result) => {
    let prodImg1 = req.files?.product_Image_1;
    let prodImg2 = req.files?.product_Image_2;
    let prodImg3 = req.files?.product_Image_3;
    let prodImg4 = req.files?.product_Image_4;
    let prodId = result._id + "";

    if (prodImg1) {
      fs.unlink(
        `./public/images/product-images/${prodId}_1.jpg`,
        (err, done) => {
          if (!err) {
            prodImg1.mv(
              `./public/images/product-images/${prodId}_1.jpg`,
              (err, done) => {
                console.log("Image 1 updated.....");
              }
            );
          } else {
            console.log("Image 1 didn't updated");
          }
        }
      );
    }
    if (prodImg2) {
      fs.unlink(
        `./public/images/product-images/${prodId}_2.jpg`,
        (err, done) => {
          if (!err) {
            prodImg2.mv(
              `./public/images/product-images/${prodId}_2.jpg`,
              (err, done) => {
                console.log("Image 2 updated.....");
              }
            );
          } else {
            console.log("Image 2 didn't updated");
          }
        }
      );
    }
    if (prodImg3) {
      fs.unlink(
        `./public/images/product-images/${prodId}_3.jpg`,
        (err, done) => {
          if (!err) {
            prodImg3.mv(
              `./public/images/product-images/${prodId}_3.jpg`,
              (err, done) => {
                console.log("Image 3 updated.....");
              }
            );
          } else {
            console.log("Image 3 didn't updated");
          }
        }
      );
    }
    if (prodImg4) {
      fs.unlink(
        `./public/images/product-images/${prodId}_4.jpg`,
        (err, done) => {
          if (!err) {
            prodImg4.mv(
              `./public/images/product-images/${prodId}_4.jpg`,
              (err, done) => {
                console.log("Image 4 updated.....");
              }
            );
          } else {
            console.log("Image 4 didn't updated");
          }
        }
      );
    }
  });

  productHelper.updateProduct(req.query, req.body).then((result) => {
    if (result) {
      productEditMsg = result;
      console.log("Updated product details");
      res.redirect("/admin/view-product");
    }
  });
});

module.exports = router;
