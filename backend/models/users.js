const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const userSchema = mongoose.Schema({
  email: { type: String, required: true, unique: true },
  // unique:true permet aux utilisateurs de pas s'inscrire plusieurs fois avec la même adresse
  password: { type: String, required: true },
});

userSchema.plugin(uniqueValidator);
// on utilise aussi le plugin mangoose uniquevalidator pour utilisateur s'inscrive une seule fois
module.exports = mongoose.model('User', userSchema);
