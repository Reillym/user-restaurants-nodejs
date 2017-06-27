const express = require('express');
const router = express.Router();
const storeController = require('../controllers/store-controller');
const userController = require('../controllers/user-controller');
const reviewController = require('../controllers/review-controller');
const authController = require('../controllers/auth-controller');
const { catchErrors } = require('../handlers/errorHandlers');
/*
  STORES
*/
// GET ALL STORES
router.get('/', catchErrors(storeController.getStores));
// GET ALL STORES
router.get('/stores', catchErrors(storeController.getStores));
// PAGINATION
router.get('/stores/page/:page', catchErrors(storeController.getStores));
// GET ADD STORE IF LOGGED IN
router.get('/add', 
  authController.isLoggedIn,
  storeController.addStore
);
// POST STORE
router.post('/add',
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.createStore)
);
// UPDATE STORE
router.post('/add/:id',
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.updateStore)
);
// EDIT STORE
router.get('/stores/:id/edit', catchErrors(storeController.editStore));
// SHOW STORE
router.get('/store/:slug', catchErrors(storeController.showStoreBySlug));
// GET STORES BY TAG
router.get('/tags', catchErrors(storeController.getStoresByTag));
// GET STORES BY TAG
router.get('/tags/:tag', catchErrors(storeController.getStoresByTag));
/*
  USERS
*/
// GET LOGIN FORM
router.get('/login', userController.loginForm);
// GET REGISTER FORM
router.get('/register', userController.registerForm);
// REGISTER USER
router.post('/register',
  userController.validateRegister,
  catchErrors(userController.register),
  authController.login
);
// LOGIN USER
router.post('/login', authController.login);
// LOGOUT USER
router.get('/logout', authController.logout);
// GET ACCOUNT IF LOGGED IN
router.get('/account',
  authController.isLoggedIn, 
  userController.account
);
// UPDATE ACCOUNT
router.post('/account', catchErrors(userController.updateAccount));
// GET FORGOT PASSWORD PAGE
router.post('/account/forgot', catchErrors(authController.forgot));
// GET ACCOUNT RESET WITH TOKEN
router.get('/account/reset/:token', catchErrors(authController.reset));
// UPDATE PASSWORD
router.post('/account/reset/:token', 
  authController.confirmedPasswords,
  catchErrors(authController.update)
);
// SHOW MAP
router.get('/map', storeController.mapPage);
// GET FAVORITES
router.get('/favorites',
  authController.isLoggedIn,
  catchErrors(storeController.getFavorites)
);
// REVIEWS
router.post('/reviews/:id',
  authController.isLoggedIn,
  catchErrors(reviewController.addReview)
);
// TOP STORES
router.get('/top', catchErrors(storeController.getTopStores));
/*
  STORE API
*/
// Search API
router.get('/api/search', catchErrors(storeController.searchStores));
// Nearby Stores API
router.get('/api/stores/near', catchErrors(storeController.mapStores));
// Favorite Stores API
router.post('/api/stores/:id/favorite', catchErrors(storeController.favoriteStore));

module.exports = router;
