const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  image: { type: String },
  grade: { type: String, required: true },
  institution: { type: String, required: true },
  country: { type: String, required: true },
  city: { type: String, required: true },
  labs: [{ type: String, required: true }],
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);
