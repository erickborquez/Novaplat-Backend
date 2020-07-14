const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const HttpError = require('../models/http-error');
const User = require('../models/user');

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, '-password');
  } catch (err) {
    const error = new HttpError(
      'Fetching users failed, please try again later',
      500
    );
    return next(error);
  }
  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    const error = new HttpError(
      'Invalid input, please check your input data.',
      422
    );
    return next(error);
  }
  const { name, email, password, country, city, grade, institution } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      'Signed up failed, please try again later',
      500
    );
    return next(error);
  }
  if (existingUser) {
    const error = new HttpError(
      'User exists already, please log in instead',
      402
    );
    return next(error);
  }

  let hashedPassword;

  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError('Could not create user,please try again.', 500);
    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    image: null,
    password: hashedPassword,
    country,
    city,
    grade,
    institution,
    labs: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      'Signing up failed, please try again later',
      500
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      process.env.JWT_KEY,
      { expiresIn: '7d' }
    );
  } catch (err) {
    const error = new HttpError(
      'Signing up failed, please try again later.',
      500
    );
    return next(error);
  }

  let userData = JSON.parse(
    JSON.stringify(createdUser.toObject({ getters: true }))
  );
  delete userData.password;

  res.status(201).json({
    userData: userData,
    token: token,
  });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      'Loggin in up failed, please try again later.',
      500
    );
    return next(error);
  }
  if (!existingUser) {
    const error = new HttpError(
      'Invalid credentials, could not log you in.',
      401
    );
    return next(error);
  }

  let isValidPassword = false;

  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError(
      'Could not log you in, plase check your credentials and try again.',
      500
    );
    return next(error);
  }
  if (!isValidPassword) {
    const error = new HttpError(
      'Invalid credentials, could not log you in.',
      403
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      {
        userId: existingUser.id,
        email: existingUser.email,
      },
      process.env.JWT_KEY,
      { expiresIn: '7d' }
    );
  } catch (err) {
    const error = new HttpError(
      'Loggin in failed, please try again later.',
      500
    );
    return next(error);
  }
  let userData = JSON.parse(
    JSON.stringify(existingUser.toObject({ getters: true }))
  );
  delete userData.password;

  res.json({
    userData: userData,
    token: token,
  });
};

const updateUser = async (req, res, next) => {
  const userId = req.params.id;

  if (userId !== req.userData.userId) {
    const error = new HttpError(
      'You are not allowed to modify this element.',
      401
    );
    return next(error);
  }
  let user;
  try {
    user = await User.findById(userId, '-password');
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      'Something went wrong, could not update user.',
      500
    );
    return next(error);
  }

  for (let property in req.body) {
    user[property] = req.body[property];
  }

  if (req.file) {
    user.image = req.file.path;
  }

  if (req.body.password) {
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(req.body.password, 12);
    } catch (err) {
      console.log(err);
      const error = new HttpError(
        'Could not create user,please try again.',
        500
      );
      return next(error);
    }
    user.password = hashedPassword;
  }
  try {
    await user.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      'Something went wrong, please try again later.',
      500
    );
    return next(error);
  }
  res.json(user.toObject({ getters: true }));
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
exports.updateUser = updateUser;
