// ADMIN LOGIN VALIDATION
var adminLogin = $("#adminLogin");
adminLogin.validate({
  rules: {
    email: {
      required: true,
      email: true,
    },
    pass: {
      required: true,
      minlength: 5,
    },
  },
  messages: {
    email: {
      required: "This field is required",
    },
  },
});


// ADMIN ADD BRAND VALIDATION
var addBrandForm = $("#addBrandForm");
addBrandForm.validate({
  rules: {
    brandName: {
      required: true,
    },
    brandLogo: {
      required: true,
    },
  },
  messages: {
    brandLogo: {
      required: "Brand logo image is required",
    },
  },
});

// ADMIN ADD PRODUCT VALIDATION
var addProductForm = $("#addProductForm");
addProductForm.validate({
  rules: {
    productName: {
      required: true,
    },
    productDescription: {
      required: true,
    },
    productBrand: {
      required: true,
    },
    productCategory: {
      required: true,
    },
    productSubcategory: {
      required: true,
    },
    landingCost: {
      required: true,
      number:true
    },
    productPrice: {
      required: true,
      number:true
    },
    productQuantity: {
      required: true,
      number:true
    },
    productColour: {
      required: true,
    },
    product_Image_1: {
      required: true,
    },
    product_Image_2: {
      required: true,
    },
    product_Image_3: {
      required: true,
    },
    product_Image_4: {
      required: true,
    },
  },
});
// ADMIN EDIT PRODUCT VALIDATION
var editProductForm = $("#editProductForm");
editProductForm.validate({
  rules: {
    productName: {
      required: true,
    },
    productDescription: {
      required: true,
    },
    productBrand: {
      required: true,
    },
    productCategory: {
      required: true,
    },
    productSubcategory: {
      required: true,
    },
    landingCost: {
      required: true,
      number:true
    },
    productPrice: {
      required: true,
      number:true
    },
    productQuantity: {
      required: true,
      number:true
    },
    productColour: {
      required: true,
    },
  },

  submitHandler:
  //ON SUBMIT FORM
      function onsubmitForm(form){
        console.log(form)
        swal({
        title: "Are you sure?",
        text: "Once deleted, you will not be able to recover this imaginary file!",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((isOkay)=>{
        if(isOkay){
          form.submit()
        }
      })
      }

});





// USER LOGIN VALIDATION
var userLogin = $("#userLogin");
userLogin.validate({
  rules: {
    email: {
      required: true,
      email: true,
    },
    password: {
      required: true,
      minlength: 5,
    },
  },
  messages: {
    email: {
      required: "This field is required",
    },
  },
});

// ADD CATEGORY VALIDATION
var addCategoryForm = $("#addCategoryForm");
addCategoryForm.validate({
  rules: {
    category: {
      required: true,
    },
    subcategory: {
      required: true,
    },
  },
});

// ADD SUBCATEGORY VALIDATION
var addSubcategoryForm = $("#addSubcategoryForm");
addSubcategoryForm.validate({
  rules: {
    category: {
      required: true,
    },
    subcategory: {
      required: true,
    },
  },
});

// USER SIGNUP VALIDATION
var userSignup = $("#userSignupForm");
userSignup.validate({
  rules: {
    firstName: {
      required: true,
      minlength: 5,
    },
    lastName: {
      required: true,
      minlength: 1,
    },
    phone: {
      required: true,
      minlength: 10,
      number: true,
    },
    email: {
      required: true,
      email: true,
    },
    password: {
      required: true,
      minlength: 5,
    },
    confirmPass: {
      minlength: 5,
      equalTo: "#userPassword",
    },
  },
  messages: {
    email: {
      required: "This field is required",
    },
    phone: {
      minlength: "Phone Number Should Be 10 digit",
    },
    confirmPass: {
      equalTo: "Please Retype Same Password",
    },
  },
});

//   USER OTP FORM VALIDATION
var reqOtpForm = $("#reqOtpForm");
reqOtpForm.validate({
  rules: {
    phone: {
      required: true,
      number: true,
      minlength: 10,
    },
  },
  messages: {
    phone: {
      required: "Enter Mobile Number for Sending OTP",
      minlength: "Phone Number Should be 10 Digits",
    },
  },
});

//   FILTER INPUT FIELDS
function setInputFilter(textbox, inputFilter) {
  [
    "input",
    "keydown",
    "keyup",
    "mousedown",
    "mouseup",
    "select",
    "contextmenu",
    "drop",
  ].forEach(function (event) {
    textbox.addEventListener(event, function () {
      if (inputFilter(this.value)) {
        this.oldValue = this.value;
        this.oldSelectionStart = this.selectionStart;
        this.oldSelectionEnd = this.selectionEnd;
      } else if (this.hasOwnProperty("oldValue")) {
        this.value = this.oldValue;
        this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
      } else {
        this.value = "";
      }
    });
  });
}

// ONLY NUMBER IN PHONE FIELD
// setInputFilter(document.getElementById("phoneNumber"), function (value) {
//   return /^\d*$/.test(value);
// });

// ONLY CHARACTER IN NAME FIELD
setInputFilter(document.getElementById("signupName1"), function (value) {
  return /^[a-z]*$/i.test(value);
});
// ONLY CHARACTER IN NAME FIELD
setInputFilter(document.getElementById("signupName2"), function (value) {
  return /^[a-z]*$/i.test(value);
});

// ONLY 10 NUMBERS IN PHONE FIELD
setInputFilter(document.getElementById("phoneNumber"), function (value) {
  return /^\d*$/.test(value) && (value === "" || parseInt(value) <= 9999999999);
});


// Check whether password and retype password is equal in signup page
$(document).ready(function () {
  $("#ConfirmPassword").on("keyup", function () {
    var password = $("#Password").val();
    var confirmPassword = $("#ConfirmPassword").val();
    if (password != confirmPassword)
    $("#CheckPasswordMatch")
    .html("Password does not match !")
    .css("color", "red");
    else
    $("#CheckPasswordMatch").html("Password match !").css("color", "green");
  });
});
