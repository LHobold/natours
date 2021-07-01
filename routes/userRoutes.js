const express = require('express');

const router = express.Router();

const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
//////////////////////////////////////////////////////////////////////////////

// NO-AUTH Routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
router.get('/logout', authController.logout);
router.post('/confirm/:token', authController.confirmEmail);

// USER Routes
router.use(authController.protect);

router.patch('/changePassword', authController.updatePassword);

router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete('/deleteMe', userController.deleteMe);
router.get('/me', userController.getMeId, userController.getMe);

// ADMIN Routes
router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.changeUser)
  .delete(userController.deleteUser);

module.exports = router;
