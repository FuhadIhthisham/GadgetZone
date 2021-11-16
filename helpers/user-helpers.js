var db = require("../config/connection");
var collections = require("../config/constants");
const bcrypt = require("bcrypt");
var objectId = require("mongodb").ObjectId;
const { response } = require("express");

module.exports = {
  // Add user data to Database
  addUser: (userData) => {
    return new Promise(async (resolve, reject) => {
     
        userData.password = await bcrypt.hash(userData.password, 10);
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
            resolve({ userExist: true ,user});
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
          $or:
          [
            {email: userData.email},
            {phone:userData.phone}
          ] 
        });
      if (user) {
            resolve({ userExist: true ,
              msg: "User with this Phone number or email already exist"});
      } else {
        console.log("Phone not found");
        resolve({ userExist: false});
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
          .updateOne({phone: resetData.phonenumber},
            {
              $set:{
                password: resetData.newPass
              }
            })
          .then((data) => {
            resolve({ status: true });
          });
    });
  },
  
};
