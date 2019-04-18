var mongoose=require('mongoose');

var Schema = mongoose.Schema;
var UserSchema = new Schema({
  email: {type: String, required: true, unique: true},
  password: {type: String, required: true, min: 8},
  first: {type: String, required: true, min: 1, max: 20},
  last: {type: String, required: true, min: 1, max: 20},
  date: {type: Date, default: Date.now}
});

module.exports = mongoose.model('User', UserSchema);
