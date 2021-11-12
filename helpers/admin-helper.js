var db = require("../config/connection");
var collections = require("../config/constants");
const bcrypt = require("bcrypt");
var objectId = require("mongodb").ObjectId;
const { response } = require("express");
const { Collection } = require("mongodb");

module.exports = {
  // Add product category to Database
  addCategory: (categoryData) => {
    return new Promise(async (resolve, reject) => {
      let isCategory = await db
        .get()
        .collection(collections.PRODUCT_CATEGORY)
        .findOne({ category: categoryData.category }); //finds for a document of category in req.body

      if (isCategory) {
        let dbSubcategory = isCategory.subcategory;
        let isSub = dbSubcategory.includes(categoryData.subcategory); //checks whether same subcategory is in subcategory array

        if (isSub) {
          //if same subcategory is in subcategory array shows error
          resolve({ status: false, msg: "This Subcategory Already Exist" });
        } else {
          //else update subcategory of that category
          await db
            .get()
            .collection(collections.PRODUCT_CATEGORY)
            .updateOne(
              { category: categoryData.category },
              { $push: { subcategory: categoryData.subcategory } }
            );

          resolve({
            status: true,
            msg: "Subcategory Added to Existing Category",
          });
        }
      } else {
        //if thereis no document of category, create category and subcategory
        await db
          .get()
          .collection(collections.PRODUCT_CATEGORY)
          .insertOne({
            category: categoryData.category,
            subcategory: [categoryData.subcategory],
          });
        resolve({
          status: true,
          msg: "Category Added Successfully",
        });
      }
    });
  },
  //   get category datas
  getCategory: () => {
    return new Promise(async (resolve, reject) => {
      let allCategory = await db
        .get()
        .collection(collections.PRODUCT_CATEGORY)
        .find()
        .toArray();
      resolve(allCategory);
    });
  },

  //   delete subcategory
  deletesubCategory: (data) => {
    return new Promise(async (resolve, reject) => {
      let result = await db
        .get()
        .collection(collections.PRODUCT_CATEGORY)
        .updateOne(
          { category: data.category },
          { $pull: { subcategory: data.subcategory } }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },
  //   delete Category
  deleteCategory: (data) => {
    return new Promise(async (resolve, reject) => {
      let result = await db
        .get()
        .collection(collections.PRODUCT_CATEGORY)
        .deleteOne({ category: data.category })
        .then((response) => {
          resolve(response);
        });
    });
  },

  //   get brand datas
  getBrand: () => {
    return new Promise(async (resolve, reject) => {
      let allBrand = await db
        .get()
        .collection(collections.BRAND_COLLECTION)
        .find({})
        .toArray();
      resolve(allBrand);
    });
  },

  // Add product brand to Database
  addBrand: (brandData) => {
    return new Promise(async (resolve, reject) => {
      let isBrand = await db
        .get()
        .collection(collections.BRAND_COLLECTION)
        .findOne({ brandName: brandData.brandName }); //finds for a document of brand in req.body 
      if (isBrand) {
        if (isBrand?.brandName === brandData.brandName) {
          //if same brand is in database brand, shows error
          resolve({ status: false, msg: "This Brand Already Exist" });
        }
      } else {
        //if thereis no document of brand, add brand
        await db.get().collection(collections.BRAND_COLLECTION).insertOne(brandData).then((result)=>{
          console.log(result);
          resolve({
            result,
            status: true,
            msg: "New Brand Added Successfully",
          });
        })
      }
    });
  },

  //   delete Brand
  deleteBrand: (data) => {
    return new Promise(async (resolve, reject) => {
      console.log(data);
      let result = await db
        .get()
        .collection(collections.BRAND_COLLECTION)
        .deleteOne({ _id: objectId(data.id) })
        .then((response) => {
          console.log(response);
          resolve(response);
        });
    });
  },
};
