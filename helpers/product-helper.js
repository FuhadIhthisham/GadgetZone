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
      let variantid = new objectId()
      let isProduct = await db
        .get()
        .collection(collections.PRODUCT_COLLECTION)
        .findOne({ productName: productData.productName }); //finds for a document in db of product name of req.body
      if (isProduct) {

          //if same product is in product array shows error
          resolve({ status: false, msg: "This Product Already Exist" });
      } else {
        //if there is no document of product name, add product
        await db
          .get()
          .collection(collections.PRODUCT_COLLECTION)
          .insertOne(
            {
              productName:productData.productName,
              productDescription:productData.productDescription,
              productBrand:productData.productBrand,
              productCategory:productData.productCategory,
              productSubcategory:productData.productSubcategory,
              productVariants: [{
                variantId: variantid,
                productColour:productData.productColour,
                productQuantity:productData.productQuantity,
                landingCost:productData.landingCost,
                productPrice:productData.productPrice,
              }]
            }).then((result)=>{
            console.log(result);
            resolve({
              result,
              status: true,
              variantid,
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
        .deleteOne({ _id: objectId(data) })
        .then((response) => {
          console.log(response);
          resolve(response);
        });
    });
  },
  // Get one product
    getOneProduct:(data)=>{
    return new Promise(async (resolve,reject)=>{
      let oneProduct = await db.get().collection(collections.PRODUCT_COLLECTION).find({_id: objectId(data)}).toArray()
      resolve(oneProduct)
    })
  },

    // Update products
    updateProduct: (productId,productData) => {
      return new Promise(async (resolve, reject) => {
        let isProduct = await db
          .get()
          .collection(collections.PRODUCT_COLLECTION)
          .findOne({ _id: objectId(productId.id) }); //finds for a document in db by product id
        if (isProduct) {

          await db
            .get()
            .collection(collections.PRODUCT_COLLECTION)
            .updateOne({_id: objectId(productId.id)},{
              $set:{
                productName:productData.productName,
                productDescription:productData.productDescription,
                productBrand:productData.productBrand,
                productCategory:productData.productCategory,
                productSubcategory:productData.productSubcategory,
                
              }}).then(async (result)=>{

              
                // await db
                // .get()
                // .collection(collections.PRODUCT_COLLECTION)
                // .updateOne({_id: objectId(productId.id)},{
                //   $push: { productVariants:
                //     {
                //       landingCost:productData.landingCost,
                //       productPrice:productData.productPrice,
                //       productColour:productData.productColour,
                //       productQuantity:productData.productQuantity,
                //     }
                //   }
                // })

                await db
                .get()
                .collection(collections.PRODUCT_COLLECTION)
                .updateOne({"productVariants.variantId": objectId(productId.varId)},{
                  $set: 
                    {
                      "productVariants.$.landingCost": productData.landingCost,
                      "productVariants.$.productPrice":productData.productPrice,
                      "productVariants.$.productColour":productData.productColour,
                      "productVariants.$.productQuantity":productData.productQuantity,
                    }
                })


              console.log(result);
              resolve({
                isProduct,
                status: true,
                msg: "Product Updated Successfully",
              });
            })
          } 
          else {
            console.log(productId);
            console.log(isProduct);
            //if there is no document of product name
            console.log("No product found...Failed update");
            resolve({
              status: false,
              msg: "Product Update Failed",
            });
          
        }
      });
    },
    


    //   delete product and subcategory
    deleteProAndSubcat: (proData) => {
    return new Promise(async (resolve, reject) => {

      let allProducts = await db.get().collection(collections.PRODUCT_COLLECTION).find({productSubcategory: proData.subcategory}).toArray()
      
      if(proData.isPro==="yes"){
         
          let deletePro =  await db
          .get()
          .collection(collections.PRODUCT_COLLECTION)
          .deleteMany({ productSubcategory: proData.subcategory })
          .then((response) => {
            console.log("Delete Product success::::::::: ")
          });
        }
        if(proData.item==='sub'){
          let deleteSub = await db
          .get()
          .collection(collections.PRODUCT_CATEGORY)
          .updateOne(
            { category: proData.category },
            { $pull: { subcategory: proData.subcategory } }
            ).then((res)=>{
              console.log("Delete Subcategory success ");
            })
          }
          resolve({allProducts})
    });
  },

    //   delete product and category
    deleteProAndCat: (proData) => {
    return new Promise(async (resolve, reject) => {

      let allProducts = await db.get().collection(collections.PRODUCT_COLLECTION).find({productCategory: proData.category}).toArray()

      //  To delete with products
      if(proData.isPro==="yes"){
         
          let deletePro =  await db
          .get()
          .collection(collections.PRODUCT_COLLECTION)
          .deleteMany({productCategory: proData.category})
          .then((response) => {
            console.log("Delete Product Success::::::: ")
          });
        }
        if(proData.item==='cat'){
          let deleteCat = await db
          .get()
          .collection(collections.PRODUCT_CATEGORY)
          .deleteOne({ category: proData.category })
          .then((res)=>{
              console.log("Delete Category Success: ");
            })
          }
          resolve({allProducts})
    });
  },

    //   delete product and brand 
    deleteBrand: (proData) => {
      return new Promise(async (resolve, reject) => {

        let allProducts = await db.get().collection(collections.PRODUCT_COLLECTION).find({productBrand: proData.brandName}).toArray()
        
        let getBrandId =  await db
          .get()
          .collection(collections.BRAND_COLLECTION)
          .findOne({brandName: proData.brandName})

        //  To delete with products
        if(proData.isPro){
          
            let deletePro =  await db
            .get()
            .collection(collections.PRODUCT_COLLECTION)
            .deleteMany({productBrand: proData.brandName})
            .then((response) => {
              console.log("Delete Product Success::::::: ")
            });

          }
          if(proData.isBrand){

            let deleteBrand = await db
              .get()
              .collection(collections.BRAND_COLLECTION)
              .deleteOne({ brandName: proData.brandName })
              .then((response) => {
                console.log("Delete Brand Success: ");
              });
            }
            resolve({allProducts,getBrandId})
      });
    },

    getOrderProducts:(orderId,userId)=>{
      return new Promise(async (resolve,reject)=>{
       let prod = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
          {
            $match:{_id: objectId(orderId)}
          },
          {
            $unwind: "$products"
          },
          {
            $project:{
              item: "$products.item",
              quantity: "$products.quantity",
              subTotal: "$products.subTotal",
              status: "$products.status"
            }
          },
          {
            $lookup:{
              from: collections.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product"
            }
          },
          {
            $project:{
              item:1,
              quantity:1,
              subTotal:1,
              status:1,
              product: {
                $arrayElemAt: ["$product",0]
              }
            }
          },
          {
            $unwind: "$product.productVariants"
          },
        ]).toArray()
        resolve(prod)
      })


    },


    addProductOffer:(data)=>{
      return new Promise(async (resolve,reject)=>{
        data.discount = parseInt(data.discount)
        discount = parseInt(data.discount)
        db.get().collection(collections.PRODUCT_OFFER).insertOne({data}).then(async(res)=>{
          
          let products = await db.get().collection(collections.PRODUCT_COLLECTION).aggregate([
            {
              $match:{productName: data.offerProduct}
            },
            {
              $unwind: "$productVariants"
            }
          ]).toArray()

          await products.map(async(product)=>{
            let productPrice = product.productVariants.productPrice
            productPrice = parseInt(productPrice)
            let discountPrice = productPrice-((productPrice*discount)/100)
            discountPrice = parseInt(discountPrice.toFixed(2))
            let variantId = product.productVariants.variantId + ""
            
            await db.get().collection(collections.PRODUCT_COLLECTION).updateOne(
              {
                _id:product._id,
                "productVariants.variantId": objectId(variantId)
              },
              {
                $set:{
                  "productVariants.$.offerPrice": discountPrice
                }
              })
          })
          resolve({status:true})
          
        })
      })
    },

    getProductOffer:()=>{
      return new Promise(async(resolve,reject)=>{
        let offerList = await db.get().collection(collections.PRODUCT_OFFER).find({}).toArray()
        console.log(offerList);

        await offerList.map((product)=>{
          console.log(product);
        })

        // let offerProducts = await db.get().collection(collections.PRODUCT_COLLECTION).aggregate([
        //   {
        //     $match:{productName}
        //   }
        // ])
        resolve(true)
      })
    }
    


}