var db = require("../config/connection");
var collections = require("../config/constants");
const bcrypt = require("bcrypt");
var objectId = require("mongodb").ObjectId;
const { response } = require("express");

const Razorpay = require("razorpay");
const { resolve } = require("path");

var instance = new Razorpay({
  key_id: 'rzp_test_GT3btMNJZ1MvHn',
  key_secret: 'TB6tin0qYcGhVvbql1RrncV0',
});


module.exports = {
  // Add user data to Database
  addUser: (userData) => {
    return new Promise(async (resolve, reject) => {
      userData.password = await bcrypt.hash(userData.password, 10);
      let today = Date(Date.now());
      let date = today.toString();
      userData.date = date;
      db.get()
        .collection(collections.USER_COLLECTION)
        .insertOne(userData)
        .then((data) => {
          resolve({ status: true });
        });
    });
  },

  // checking login details on database
  loginUser: (userData) => {
    let response = {};
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collections.USER_COLLECTION)
        .findOne({ email: userData.email });
      if (user) {
        bcrypt.compare(userData.password, user.password).then((status) => {
          if (status) {
            response.user = user;
            response.status = true;
            resolve(response);
          } else {
            console.log("login Failed");
            console.log(response);
            resolve({ status: false });
          }
        });
      } else {
        console.log("User not found");
        resolve({ status: false });
      }
    });
  },
  // checking OTP number details on database
  phoneCheck: (userPhone) => {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collections.USER_COLLECTION)
        .findOne({ phone: userPhone });
      if (user) {
        console.log("Phone found on db");
        resolve({ userExist: true, user });
      } else {
        console.log("Phone not found");
        resolve({ userExist: false });
      }
    });
  },

  // checking duplication of User details on database
  userCheck: (userData) => {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collections.USER_COLLECTION)
        .findOne({
          $or: [{ email: userData.email }, { phone: userData.phone }],
        });
      if (user) {
        resolve({
          userExist: true,
          msg: "User with this Phone number or email already exist",
        });
      } else {
        console.log("Phone not found");
        resolve({ userExist: false });
      }
    });
  },

  // Reset password
  resetPass: (resetData) => {
    return new Promise(async (resolve, reject) => {
      resetData.newPass = await bcrypt.hash(resetData.newPass, 10);
      console.log(resetData.newPass);
      console.log(resetData.phonenumber);
      db.get()
        .collection(collections.USER_COLLECTION)
        .updateOne(
          { phone: resetData.phonenumber },
          {
            $set: {
              password: resetData.newPass,
            },
          }
        )
        .then((data) => {
          resolve({ status: true });
        });
    });
  },

  addToCart: (proId, userId, total) => {
    total = parseInt(total)
    let prodObj = {
      item: objectId(proId),
      quantity: 1,
      subTotal:total,
    };
    return new Promise(async (resolve, reject) => {
      let userCart = await db
        .get()
        .collection(collections.CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      if (userCart) {
        let prodExist = userCart.products.findIndex(
          (product) => product.item == proId
        );
        if (prodExist == -1) {
        //   db.get()
        //     .collection(collections.CART_COLLECTION)
        //     .updateOne(
        //       { user: objectId(userId), "products.item": objectId(proId) },
        //       {
        //         $inc: { "products.$.quantity": 1 },
        //       }
        //     )
        //     .then(() => {
        //       resolve();
        //     });
        // } 
        // else {}
          await db
            .get()
            .collection(collections.CART_COLLECTION)
            .updateOne(
              { user: objectId(userId) },
              {
                $push: { products: prodObj },
              }
            )
            .then((response) => {
              resolve(response);
            });
        }
        else{
          resolve({msg:"Product Already Exists"})
        }
      } else {
        let cartObj = {
          user: objectId(userId),
          products: [prodObj],
        };
        db.get()
          .collection(collections.CART_COLLECTION)
          .insertOne(cartObj)
          .then(() => {
            resolve();
          });
      }
    });
  },

  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection(collections.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },

          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
              subTotal: "$products.subTotal"
            },
          },
          {
            $lookup: {
              from: collections.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              subTotal:1,
              product: {
                $arrayElemAt: ["$product", 0],
              },
            },
          },
        ])
        .toArray();
      resolve(cartItems);
    });
  },
  
  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let cart = await db
        .get()
        .collection(collections.CART_COLLECTION)
        .findOne({user: objectId(userId) });
      if (cart) {
        count = cart.products.length;
        console.log(count);
      }
      resolve(count);
    });
  },

  changeQuantity: (data) => {
    productTotal = parseInt(data.productTotal)
    price = parseInt(data.price)
    console.log(price);
    count = parseInt(data.count);
    return new Promise((resolve, reject) => {
      if (data.count == -1 && data.quantity == 1) {
        db.get()
          .collection(collections.CART_COLLECTION)
          .updateOne(
            { _id: objectId(data.cartId) },
            {
              $pull: { products: { item: objectId(data.product) } },
            }
          )
          .then((response) => {
            resolve({ removeProduct: true });
          });
      } else {
        db.get()
          .collection(collections.CART_COLLECTION)
          .updateOne(
            {
              _id: objectId(data.cartId),
              "products.item": objectId(data.product),
            },
            {
              $inc: { "products.$.quantity": count,"products.$.subTotal": price*count },
            },
          )
          .then((response) => {
            resolve(true);
          });
      }
    });
  },

  getGrandTotal: (userId) => {
    return new Promise(async (resolve, reject) => {
      let total = await db
        .get()
        .collection(collections.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },

          {
            $unwind: "$products",
          },
          {
            $group: {
              "_id": objectId(userId),
              "grandTotal": {$sum:"$products.subTotal"}
            }
          }
        ])
        .toArray();
      resolve(total)
    });
  },

  deleteCartProduct: (data) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.CART_COLLECTION)
        .updateOne(
          { _id: objectId(data.cartId) },
          {
            $pull: { products: { item: objectId(data.proId) } },
          }
        )
        .then((response) => {
          resolve(true);
        });
    });
  },



  placeOrder:(order,userId,address,products,total)=>{
    return new Promise((resolve,reject)=>{

      let deliveryStatus = order=="COD"?'Placed':'Pending'
      products.forEach(element => {
        element.status = deliveryStatus
      });

      // if(order === 'COD'){ 
        let orderObj = {
          deliveryDetails:{
              addressType: address.addressType,
              name: address.name,
              phone: address.phone,
              houseNumber: address.houseNumber,
              streetAddress: address.streetAddress,
              locality:address.locality,
              pincode: address.pincode,
              district:address.district,
              state: address.state,
          },
          userId: objectId(userId),
          dateISO: new Date().toLocaleString(),
          date: new Date(),
          paymentMethod: order,
          totalAmount:total,
          products:products,
        }
        
        db.get().collection(collections.ORDER_COLLECTION).insertOne(orderObj).then((resp)=>{
          db.get().collection(collections.CART_COLLECTION).deleteOne({user: objectId(userId)})
          resolve()
        })
        
      // }
      // else{

      // }

      // let orderObj = {
      //   deliveryDetails:{
      //       addressType: address.addressType,
      //       name: address.name,
      //       phone: address.phone,
      //       houseNumber: address.houseNumber,
      //       streetAddress: address.streetAddress,
      //       locality:address.locality,
      //       pincode: address.pincode,
      //       district:address.district,
      //       state: address.state,
      //   },
      //   userId: objectId(userId),
      //   dateISO: new Date().toISOString().slice(0,10),
      //   date: new Date(),
      //   paymentMethod: order,
      //   totalAmount:total,
      //   products:products,
      // }

      // db.get().collection(collections.ORDER_COLLECTION).insertOne(orderObj).then((resp)=>{
      //   db.get().collection(collections.CART_COLLECTION).deleteOne({user: objectId(userId)})
      //   resolve()
      // })
      resolve(orderObj)


    })
  },

  generateRazorpay:(rzpId,total)=>{
    return new Promise((resolve,reject)=>{
      var options = {
        amount: total*100,
        currency: "INR",
        receipt: ""+rzpId
      }
      console.log(options);
      instance.orders.create(options,(err,order)=>{
        if(err){
          console.log(err);
        }
        else{

          console.log(order);
          resolve(order)
        }
      })
    })
  },


  verifyPayment:(details)=>{
    return new Promise((resolve,reject)=>{
      const crypto = require('crypto')
      var hmac = crypto.createHmac('sha256','TB6tin0qYcGhVvbql1RrncV0')
      hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
      hmac = hmac.digest('hex')
      if(hmac==details['payment[razorpay_signature]']){
        resolve()
      }else{
        reject()
      }
    })
  },

  changePaymentStatus:(orderDetails)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collections.ORDER_COLLECTION).updateOne({_id: objectId(orderDetails._id),"products.status": "Pending"},{
          $set:{
            "products.$.status": "Placed"
          }
        })

        resolve(true)

    })
  },



  getCartProductsList:(userId)=>{
    return new Promise(async (resolve,reject)=>{
      let cartProducts = await db.get().collection(collections.CART_COLLECTION).findOne({user: objectId(userId)})
      resolve(cartProducts?.products)
    })
  },


  getAllOrders: (userId)=>{
    return new Promise(async(resolve,reject)=>{
      let allOrders = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
        {
          $match:{
            userId: objectId(userId)
          }
        },
        {
          $unwind: "$products"
        },
        {
          $project:{
            item: "$products.item",
            quantity: "$products.quantity",
            subTotal: "$products.subTotal",
            status: "$products.status",
            cancelled: "$products.cancelled",
            dateISO: "$dateISO",
            deliveryDetails: "$deliveryDetails"
          }
        },
        {
          $lookup:{
            from: collections.PRODUCT_COLLECTION,
            localField: "item",
            foreignField: "_id",
            as: "products"
          }
        },
        {
          $project:{
            item:1,
            quantity:1,
            subTotal:1,
            status:1,
            dateISO:1,
            deliveryDetails:1,
            cancelled:1,
            product: {
              $arrayElemAt: ["$products",0]
            }
          }
        },
        {
          $unwind: "$product.productVariants"
        }
      ]).toArray()
      console.log(allOrders);
      resolve(allOrders)
    })
  },


  cancelProduct:(orderId,proId)=>{
    return new Promise((resolve,reject)=>{
      db.get().collection(collections.ORDER_COLLECTION).updateOne({_id: objectId(orderId),"products.item": objectId(proId)},
      {
        $set: {
          "products.$.status": "Cancelled",
          "products.$.cancelled": true
        }
      })
      resolve()
    })
  },



  addAddress: (userId, data) => {
    data.addressId = new objectId()
    return new Promise(async (resolve, reject) => {
      let addressExist = await db
        .get()
        .collection(collections.USER_COLLECTION)
        .findOne({
          _id: objectId(userId._id),
          address: { $exists: true },
        });

      if (addressExist) {
        await db
          .get()
          .collection(collections.USER_COLLECTION)
          .findOne(
            {
              address: {
                $elemMatch: {
                  name: data.name,
                  phone: data.phone,
                  pincode: data.pincode,
                  locality: data.locality,
                  houseNumber: data.houseNumber,
                  streetAddress: data.streetAddress,
                  district: data.district,
                  state: data.state,
                },
              },
            }
          )
          .then((response) => {
            if (response) {
              console.log(response);
              console.log("address exist");
              resolve({addressExist:true});
            } else {
              db.get()
                .collection(collections.USER_COLLECTION)
                .updateOne(
                  { _id: objectId(userId._id) },
                  {
                    $push: {
                      address: data,
                    },
                  }
                )
                .then(() => {
                  console.log("address updated");
                  resolve()
                });
            }
          });
      } else {
        await db
          .get()
          .collection(collections.USER_COLLECTION)
          .updateOne(
            { _id: objectId(userId._id) },
            {
              $set: {
                address: [data],
              },
            }
          )
          .then(() => {
            resolve()
          });
      }
    });
  },

  // get user address
  getAddress:(userId)=>{
    return new Promise(async (resolve,reject)=>{
      let allAddress = await db.get().collection(collections.USER_COLLECTION).aggregate(
        [{
        $match:{
          _id: objectId(userId)
            }
        },
        {
          $project:{
            address:1,
            _id:0
          }
        },
        {
          $unwind:'$address'
        }
    ]).toArray()
      resolve(allAddress);
    })
  },

  deleteAddress: (userId,addressId)=>{
    return new Promise(async (resolve,reject)=>{
      await db.get().collection(collections.USER_COLLECTION).updateOne(
        {
          _id: objectId(userId),
          "address.addressId":objectId(addressId)
        },
        {
          $pull: {
            address: {
              addressId: objectId(addressId)
            }
          }
        }).then((response)=>{
          console.log(response);
          resolve(resolve)
        })
    })
  },

  getOneAddress: (addressId,userId)=>{
    return new Promise(async (resolve,reject)=>{
      let oneAddress = await db.get().collection(collections.USER_COLLECTION).aggregate(
        [
        {
          $match:{
            _id: objectId(userId)
          }
        },
        {
          $unwind: "$address"
        },
        {
          $match:{
            "address.addressId": objectId(addressId)
          }
        },
        
      ]).toArray()  
      console.log(oneAddress);
      resolve(oneAddress);
    })
  },

  // edit user address
  editAddress:(userId,data,addressId)=>{
    return new Promise(async (resolve,reject)=>{
      console.log(data);
      console.log(addressId);
      await db.get().collection(collections.USER_COLLECTION).updateOne(
        {
          _id: objectId(userId),
          "address.addressId": objectId(addressId)
        },
        {
          $set: {
            "address.$.addressType": data.addressType,
            "address.$.name": data.name,
            "address.$.phone": data.phone,
            "address.$.pincode": data.pincode,
            "address.$.locality": data.locality,
            "address.$.houseNumber": data.houseNumber,
            "address.$.streetAddress": data.streetAddress,
            "address.$.district": data.district,
            "address.$.state": data.state,
          }
        }
        ).then((resp)=>{
          console.log(resp);
          resolve(resp)
        })
    })
  }
};
