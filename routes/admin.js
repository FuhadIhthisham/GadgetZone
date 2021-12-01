var express = require("express");
var router = express.Router();
var session = require("express-session");
const adminHelper = require("../helpers/admin-helper");
const productHelper = require("../helpers/product-helper");
const colours = require("../config/lists").colours;

// file system
const fs = require("fs");
const { response, json } = require("express");

const adminData = {
  email: "fuhad@mail.com",
  pass: "12345",
};
/* GET admin dashboard. */
router.get("/", verifyLogin,async function (req, res, next) {
  res.header(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  );

  let totalRevenue = await adminHelper.getRevenue()
  let deliveredOrders = await adminHelper.getDeliveredOrders()
  let totalProducts = await adminHelper.getTotalProducts()
  let totalUsers = await adminHelper.getTotalUsers()



  res.render("admin/admin-dashboard", {
    title: "Admin",
    admin: true,
    header: "ADMIN DASHBOARD",
    totalRevenue,
    deliveredOrders,
    totalProducts,
    totalUsers,
  });
});


router.get('/getChartDates',async(req,res)=>{
  let dailySales = await adminHelper.getdailySales()
  let catSales = await adminHelper.getCatSales()
  
  let dailyAmt = []
  let daysOfWeek = []
  let catSaleAmount = []
  let categoryName = []
  

  // mapping daily sales amount
  dailySales.map(daily=>{
    dailyAmt.push(daily.totalAmount)
  })


  // mapping daily sales dates
  dailySales.map(daily=>{
    daysOfWeek.push(daily._id) //Array of days in a week
  })
  console.log(daysOfWeek);


  // mapping category name and category amount
  catSales.map(cat=>{
    categoryName.push(cat._id)
    catSaleAmount.push(cat.totalAmount)
  })
  console.log(categoryName);
  console.log(catSaleAmount);



  res.json({daysOfWeek,dailyAmt,categoryName,catSaleAmount})
})


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

// delete brand with or without products
router.post("/delete-brand/", verifyLogin, function (req, res, next) {
  if (req.body.isPro === "yes" && req.body.isBrand === "yes") {
    productHelper.deleteBrand(req.body).then((response) => {
      if (response) {
        // To delete Brand and each products
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
        fs.unlink(
          "./public/images/brand-logo/" + response.getBrandId._id + ".png",
          (err) => {
            if (err) {
              console.log(err);
            } else {
              console.log("Brand logo is deleted.");
            }
          }
        );
      }
    });
    res.json({ status: true });
  } else if (req.body.isPro === "no" && req.body.isBrand === "yes") {
    console.log(req.body);
    console.log("noooooooo");

    productHelper.deleteBrand(req.body).then((response) => {
      fs.unlink(
        "./public/images/brand-logo/" + response.getBrandId._id + ".png",
        (err) => {
          if (err) {
            console.log(err);
          } else {
            console.log("brand logo is deleted.");
          }
        }
      );
      console.log("Brand deleted");
    });

    res.json({ status: true });
  }
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
            colours,
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
router.post("/add-product", verifyLogin, function (req, res, next) {
  req.body.productQuantity = parseInt(req.body.productQuantity);
  req.body.landingCost = parseInt(req.body.landingCost);
  req.body.productPrice = parseInt(req.body.productPrice);
  productHelper.addProduct(req.body).then((response) => {
    if (response) {
      productAddMsg = response;
      if (response.status) {
        let prodImg1 = req.files?.product_Image_1;
        let prodImg2 = req.files?.product_Image_2;
        let prodImg3 = req.files.product_Image_3;
        let prodImg4 = req.files?.product_Image_4;
        let variantId = response.variantid;
        let proid = response.result.insertedId;

        const path = `./public/images/product-images/${proid}`;

        fs.mkdir(path, (err) => {
          if (err) {
            throw err;
          }
          console.log("folder created");
        });

        // Moving Image 1
        prodImg1.mv(
          `./public/images/product-images/${proid}/${variantId}_1.jpg`,
          (err, done) => {
            if (!err) {
              // Moving Image 2
              prodImg2.mv(
                `./public/images/product-images/${proid}/${variantId}_2.jpg`,
                (err, done) => {
                  if (!err) {
                    // Moving Image 3
                    prodImg3.mv(
                      `./public/images/product-images/${proid}/${variantId}_3.jpg`,
                      (err, done) => {
                        if (!err) {
                          // Moving Image 4
                          prodImg4.mv(
                            `./public/images/product-images/${proid}/${variantId}_4.jpg`,
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
    console.log(response);
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
  productHelper.getOneProduct(req.body.id).then((result) => {
    productHelper.deleteProduct(req.body.id).then((response) => {
      if (response) {
        const path = `./public/images/product-images/${req.body.id}`;
        // To delete whole  product image folder

        try {
          fs.rmdirSync(path, { recursive: true });

          console.log(`${path} is deleted!`);
          console.log(`product image folder is deleted!`);
        } catch (err) {
          console.error(`Error while deleting ${path}.`);
        }
        res.redirect("/admin/view-product");
      } else {
        console.log("Couldn't delete product images[no response]");
        res.redirect("/admin/view-product");
      }
    });
  });
});

// delete product variant
// router.post("/delete-variant", verifyLogin, function (req, res, next) {
//   productHelper.getOneProduct(req.body.id).then((result) => {
//     productHelper.deleteProduct(req.body.id).then((response) => {
//       if (response) {
//         // To delete each product images
//         for (i = 1; i <= 4; i++) {
//           fs.unlink(
//             `./public/images/product-images/${req.body.id}_${i}.jpg`,
//             (err) => {
//               if (err) {
//                 console.log(err);
//               } else {
//                 console.log("product image is deleted.");
//               }
//             }
//           );
//         }
//         res.redirect("/admin/view-product");
//       } else {
//         console.log("Couldn't delete product images[no response]");
//         res.redirect("/admin/view-product");
//       }
//     });
//   });
// });

// get edit product page
var productEditMsg;
router.get("/edit-product/", verifyLogin, function (req, res, next) {
  productHelper.getOneProduct(req.query.id).then((result) => {
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
              colours,
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
  productHelper.getOneProduct(req.query.id).then((result) => {
    let prodImg1 = req.files?.product_Image_1;
    let prodImg2 = req.files?.product_Image_2;
    let prodImg3 = req.files?.product_Image_3;
    let prodImg4 = req.files?.product_Image_4;
    let prodId = req.query.id;
    let varId = req.query.varId;

    if (prodImg1) {
      fs.unlink(
        `./public/images/product-images/${prodId}/${varId}_1.jpg`,
        (err, done) => {
          if (!err) {
            prodImg1.mv(
              `./public/images/product-images/${prodId}/${varId}_1.jpg`,
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
        `./public/images/product-images/${prodId}/${varId}_2.jpg`,
        (err, done) => {
          if (!err) {
            prodImg2.mv(
              `./public/images/product-images/${prodId}/${varId}_2.jpg`,
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
        `./public/images/product-images/${prodId}/${varId}_3.jpg`,
        (err, done) => {
          if (!err) {
            prodImg3.mv(
              `./public/images/product-images/${prodId}/${varId}_3.jpg`,
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
        `./public/images/product-images/${prodId}/${varId}_4.jpg`,
        (err, done) => {
          if (!err) {
            prodImg4.mv(
              `./public/images/product-images/${prodId}/${varId}_4.jpg`,
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

// Add product variant
router.get("/add-variant/", verifyLogin, function (req, res, next) {
  productHelper.getOneProduct(req.query).then((result) => {
    if (result) {
      adminHelper.getBrand().then((allBrand) => {
        if (allBrand) {
          adminHelper.getCategory().then((allCategory) => {
            res.render("admin/add-variant", {
              title: "Add Variant",
              admin: true,
              header: "PRODUCT MANAGEMENT",
              productEditMsg,
              allCategory,
              allBrand,
              result,
              colours,
            });
          });
        }
      });
    } else {
      console.log("Couldn't get add product variant page[no result]");
      res.redirect("/admin/view-product");
    }
  });
});

// Get view user page
router.get("/view-users", verifyLogin, (req, res, next) => {
  adminHelper.getUsers().then((response) => {
    if (response) {
      res.render("admin/view-users", {
        title: "View Users",
        admin: true,
        header: "USER MANAGEMENT",
        allUsers: response,
      });
    }
  });
});

// block user
router.post("/block-user", verifyLogin, (req, res) => {
  adminHelper.blockUser(req.body.id).then((resp) => {
    if (response) {
      console.log("user blocked........");
      console.log(response);
      res.json({ status: true });
    } else {
      res.json({ status: false });
      console.log("user not blocked");
    }
  });
});

// unblock user
router.post("/unblock-user", verifyLogin, (req, res) => {
  adminHelper.unblockUser(req.body.id).then((resp) => {
    if (response) {
      console.log("user unblocked........");
      console.log(response);
      res.json({ status: true });
    } else {
      console.log("user not unblocked");
      res.json({ status: false });
    }
  });
});

// Get blocked users list page
router.get("/blocked-users", verifyLogin, (req, res, next) => {
  adminHelper.getBlockedUsers().then((response) => {
    console.log(response);
    if (response) {
      res.render("admin/blocked-users", {
        title: "blocked Users",
        admin: true,
        header: "USER MANAGEMENT",
        blockedUsers: response,
      });
    }
  });
});

// BANNER MANAGEMENT
router.get("/manage-banner", verifyLogin, async (req, res, next) => {
  let allBanner = await adminHelper.getBanner();
  res.render("admin/manage-banner", {
    title: "Banner Management",
    admin: true,
    header: "BANNER MANAGEMENT",
    allBanner,
  });
});

// post editted product
router.post("/manage-banner/", verifyLogin, function (req, res, next) {
  let topBannerImg1 = req.files?.top_banner_image_1;
  let topBannerImg2 = req.files?.top_banner_image_2;
  let topBannerImg3 = req.files?.top_banner_image_3;
  let offerImg = req.files?.offer_banner_image_1;

  console.log(req.body);

  if (topBannerImg1) {
    topBannerImg1.mv(
      `./public/images/banner-images/topBanner1.jpg`,
      (err, done) => {
        console.log("Image 1 updated.....");
      }
    );
  }
  if (topBannerImg2) {
    topBannerImg2.mv(
      `./public/images/banner-images/topBanner2.jpg`,
      (err, done) => {
        console.log("Image 2 updated.....");
      }
    );
  }
  if (topBannerImg3) {
    topBannerImg3.mv(
      `./public/images/banner-images/topBanner3.jpg`,
      (err, done) => {
        console.log("Image 3 updated.....");
      }
    );
  }
  if (offerImg) {
    offerImg.mv(
      `./public/images/banner-images/offerBanner.jpg`,
      (err, done) => {
        console.log("Image 4 updated.....");
      }
    );
  }

  adminHelper.addBanner(req.body).then((result) => {
    if (result) {
      productEditMsg = result;
      console.log("Updated product details");
      res.redirect("/admin/manage-banner");
    }
  });
});

// Get order management page
router.get("/manage-orders", verifyLogin, (req, res, next) => {
  adminHelper.viewOrders().then((response) => {
    if (response) {
      console.log(response);
      res.render("admin/order-management", {
        title: "Order Management",
        admin: true,
        header: "ORDER MANAGEMENT",
        allOrders: response,
      });
    }
  });
});

router.post("/status-update", verifyLogin, (req, res) => {
  let status = req.body.status;
  let orderId = req.body.orderId;
  let proId = req.body.proId;
  adminHelper.deliveryStatusUpdate(status, orderId, proId).then((resp) => {
    if (response) {
      console.log("Status Updated");
      res.json({ status: true });
    } else {
      console.log("status not updated");
      res.json({ status: false });
    }
  });
});

router.get("/ordered-products", verifyLogin, (req, res, next) => {
  let orderId = req.query.orderId;
  let userId = req.query.userId;
  let proId = req.query.proId;
  productHelper.getOrderProducts(orderId, userId, proId).then((products) => {
    console.log(products);
    res.render("admin/ordered-products", {
      products,
      title: "Ordered Products",
      admin: true,
      header: "ORDER MANAGEMENT",
    });
  });
});

router.post("/cancel-product", verifyLogin, (req, res) => {
  let orderId = req.body.orderId;
  let proId = req.body.proId;
  adminHelper.cancelProduct(orderId, proId).then((resp) => {
    if (response) {
      console.log("product cancelled");
      res.json({ status: true });
    } else {
      console.log("product not cancelled");
      res.json({ status: false });
    }
  });
});

// Get product offer management page
router.get("/product-offer", verifyLogin,async (req, res, next) => {
  let allProducts = await productHelper.getAllProducts()
  productHelper.getProductOffer()
  res.render("admin/product-offer", {
    title: "Offer Management",
    admin: true,
    header: "OFFER MANAGEMENT",
    allProducts
  });
});


// Post product offer management page
router.post("/product-offer", verifyLogin, (req, res, next) => {
  productHelper.addProductOffer(req.body).then((resp)=>{
    res.redirect('/product-offer')
  })
});




module.exports = router;
