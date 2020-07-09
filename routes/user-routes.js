const express = require('express');
const router = express.Router();

const { check } = require('express-validator');
const {
  getUsers,
  signup,
  login,
  updateUser,
} = require('../controllers/users-controllers');
const checkAuth = require('../middlewares/check-auth');

router.get('/', getUsers);

router.post(
  '/signup',
  [
    check('name').not().isEmpty(),
    check('email').normalizeEmail().isEmail(),
    check('password').isLength({ min: 6 }),
  ],
  signup
);

router.post('/login', login);

router.use(checkAuth);

router.patch('/:id', updateUser);

module.exports = router;
