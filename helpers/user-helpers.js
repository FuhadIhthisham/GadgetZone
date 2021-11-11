var db = require("../config/connection");
var collections = require("../config/constants");
const bcrypt = require("bcrypt");
var objectId = require("mongodb").ObjectId;
const { response } = require("express");

module.exports = {
  // Add user data to Database
  addUser: (userData) => {
    return new Promise(async (resolve, reject) => {
      let userEmail = await db
        .get()
        .collection(collections.USER_COLLECTION)
        .findOne({
          $or:[
            {
              email: userData.email
            },
            {
              phone: userData.phone
            }
          ]
        });
      if (
        userData.phone === userEmail?.phone ||
        userData.email === userEmail?.email
      ) {
        if (userData.phone === userEmail?.phone) {
          resolve({
            status: true,
            msg: "User with this Phone number already exist",
          });
        }
        else if (userData.email === userEmail?.email) {
          resolve({ status: true, msg: "User with this Email already exist" });
        }
      } 
      else {
        userData.password = await bcrypt.hash(userData.password, 10);
        db.get()
          .collection(collections.USER_COLLECTION)
          .insertOne(userData)
          .then((data) => {
            resolve({ status: false });
          });
      }
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
};
