const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');
const { catchErrors } = require('../handlers/errorHandlers');

// router.get('/', storeController.myMiddleware, storeController.homePage);
router.get('/', catchErrors(storeController.getStores));
router.get('/stores', catchErrors(storeController.getStores));
router.get('/stores/page/:page', catchErrors(storeController.getStores));
router.get('/add', authController.isLoggedIn, storeController.addStore);


router.post('/add', 
    storeController.upload, 
    catchErrors(storeController.resize), 
    catchErrors(storeController.createStore)
);

router.post('/add/:id',     
    storeController.upload, 
    catchErrors(storeController.resize), 
    catchErrors(storeController.updateStore)
);

router.get('/stores/:id/edit', catchErrors(storeController.editStore));

router.get('/store/:slug', catchErrors(storeController.getStoreBySlug));

router.get('/tags', catchErrors(storeController.getStoresByTag));
router.get('/tags/:tag', catchErrors(storeController.getStoresByTag));

router.get('/login', userController.loginForm);

router.get('/register', userController.registerForm);

router.post(
    '/register',
    userController.validateRegister,
    userController.register,
    authController.login
    );
    
router.get('/logout', authController.logout);
router.post('/login', authController.login);

router.get('/account', authController.isLoggedIn, userController.account);
router.post('/account', catchErrors(userController.updateAccount));
router.post('/account/forgot', catchErrors(authController.forgot));
router.get('/account/reset/:token', catchErrors(authController.reset));
router.post('/account/reset/:token', authController.confirmedPasswords, catchErrors(authController.update));

router.get('/map', storeController.mapPage);

// for incognito mode, where 'user' doesn't exist on req object, we use middleware authController.isLoggedIn
router.get('/hearts', authController.isLoggedIn, catchErrors(storeController.getHearts));
router.post('/reviews/:id', authController.isLoggedIn, catchErrors(reviewController.addReview));

router.get('/top', catchErrors(storeController.getTopStores));

/*
API
*/
router.get('/api/search', catchErrors(storeController.searchStores));
router.get('/api/stores/near', catchErrors(storeController.mapStores));
router.post('/api/stores/:id/heart', catchErrors(storeController.heartStore));



// Do work here
// router.get('/', (req, res) => {
//   const iuliia = {name: 'Iuliia', age: 100, cool: true};
//   // res.send('Hey! It works!');
//   // res.send(iuliia);
//   // res.json(req.query);
//   res.render('hello', {
//     cat: 'tom',
//     name: req.query.cat,
//     title: 'Page title!'
//   }); // hello - це назва файла у папці views без розширення .pug
//   // у файлі hello.pug використовуємо або cat (http://localhost:7777), або name (http://localhost:7777/?cat=cleopatra)

// });

// // http://localhost:7777/reverse/iuliia
// router.get('/reverse/:name', (req,res) =>{
//   res.send(req.params.name)
// })

module.exports = router;
