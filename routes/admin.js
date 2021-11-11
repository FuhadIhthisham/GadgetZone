var express = require('express');
var router = express.Router();
var session = require('express-session')


const adminData = {
  email: 'fuhad@mail.com',
  pass: '12345'
}
/* GET users listing. */
router.get('/',verifyLogin, function(req, res, next) {
  res.header(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  );
  res.render('admin/admin-dashboard',{title: 'Admin',admin: true})
});

function verifyLogin(req,res,next){
  if(req.session?.adminLoggedIn)
    {
      next()
    }
    else {
      res.redirect('/admin/login')
    }
}

/* GET admin login page. */
router.get('/login', function(req, res, next) {

  
  if(req.session.adminLoggedIn){
    res.redirect('/admin')
  }
  else{
    
    res.render('admin/admin-login',{title: 'Admin',admin: true, noSidebar: true, loginErr: req.session.adminLoginErr})
  }
  req.session.adminLoginErr = false
});

// post admin credentials
router.post('/login', function(req, res, next) {

  if(adminData.email === req.body?.email && adminData.pass === req.body?.pass){
    console.log('login success');
    req.session.adminLoggedIn = true
    res.redirect('/admin')
  }
  else{
    req.session.adminLoginErr = 'Invalid Username or Password'
    res.redirect('/admin/login')
  }
});

router.get('/logout', function(req, res, next) {

  req.session.adminLoggedIn = false
  res.redirect('/admin/login')
});

module.exports = router;
