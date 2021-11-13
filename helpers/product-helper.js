var db = require("../config/connection");
var collections = require("../config/constants");
const bcrypt = require("bcrypt");
var objectId = require("mongodb").ObjectId;
const { response } = require("express");
const { Collection } = require("mongodb");

module.exports = {
     // Add product to Database
  addProduct: (productData) => {
    return new Promise(async (resolve, reject) => {
      let isProduct = await db
        .get()
        .collection(collections.PRODUCT_COLLECTION)
        .findOne({ productName: productData.productName }); //finds for a document in db of product name of req.body
      if (isProduct) {

          //if same subcategory is in subcategory array shows error
          resolve({ status: false, msg: "This Product Already Exist" });
      } else {
        //if there is no document of product name, add product
        await db
          .get()
          .collection(collections.PRODUCT_COLLECTION)
          .insertOne(productData).then((result)=>{
            console.log(result);
            resolve({
              result,
              status: true,
              msg: "Product Added Successfully",
            });
          })
      }
    });
  },

   //   get subcategory datas
   getSubcategory: (data) => {
    return new Promise(async (resolve, reject) => {
      let allSubcategory = await db
        .get()
        .collection(collections.PRODUCT_CATEGORY)
        .findOne({category: data.category})
        if(allSubcategory){
          resolve(allSubcategory.subcategory);
        }
        else{
            console.log("Error Getting getSubcategory");
        }
    });
  },

  // Get all products
  getAllProducts:()=>{
    return new Promise(async (resolve,reject)=>{
      let allProducts = await db.get().collection(collections.PRODUCT_COLLECTION).find({}).toArray()
      resolve(allProducts)
    })
  },

   //   delete product
   deleteProduct: (data) => {
    return new Promise(async (resolve, reject) => {
      console.log("deleting id: "+data);
        await db
        .get()
        .collection(collections.PRODUCT_COLLECTION)
        .deleteOne({ _id: objectId(data.id) })
        .then((response) => {
          console.log("response: "+response);
          resolve(response);
        });
    });
  },
  // Get one product
    getOneProduct:(data)=>{
    return new Promise(async (resolve,reject)=>{
      let oneProduct = await db.get().collection(collections.PRODUCT_COLLECTION).find({_id: objectId(data.id)}).toArray()
      resolve(oneProduct[0])
    })
  },
    // Update products
    updateProduct: (productData) => {
      return new Promise(async (resolve, reject) => {
        let isProduct = await db
          .get()
          .collection(collections.PRODUCT_COLLECTION)
          .findOne({ productName: productData.productName }); //finds for a document in db of product name of req.body
        if (isProduct) {
  
            //if same subcategory is in subcategory array shows error
            resolve({ status: false, msg: "This Product Already Exist" });
        } else {
          //if there is no document of product name, add product
          await db
            .get()
            .collection(collections.PRODUCT_COLLECTION)
            .insertOne(productData).then((result)=>{
              console.log(result);
              resolve({
                result,
                status: true,
                msg: "Product Added Successfully",
              });
            })
        }
      });
    },

}