const bcrypt = require("bcryptjs");

exports.hashPassword = async (password) =>{
  return await bcrypt.hash(password, 10);
};

exports.matchPassword = async(password, userPassword) =>{
  return await bcrypt.compare(password, userPassword);
}