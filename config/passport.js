const passport = require("passport");
const bcrypt = require("./bcrypt");
const LocalStrategy = require("passport-local").Strategy;
const userQueries = require("../db/user");

passport.use(
  new LocalStrategy (async (username, password, done) =>{
    try{
      const user = await userQueries.getUserByUsername(username);
      if(!user)
        return done(null, false, {message: "Incorrect Username"});

      const match = await bcrypt.matchPassword(password, user.password);
      if(!match) return done(null, false, {message: "Incorret Password"});

      return done(null, user);
    }catch(err){
      return done(err);
    }
  })
);

passport.serializeUser((user, done) =>{
  done(null, user.id);
});

passport.deserializeUser(async(id, done) =>{
  try{
    const user = await userQueries.getUserById(id);
    done(null, user);
  }catch(err){
    done(err);
  }
});

module.exports = passport;