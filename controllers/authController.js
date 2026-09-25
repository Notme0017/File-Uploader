const { validationResult, matchedData } = require("express-validator");
const { hashPassword } = require("../config/bcrypt");
const userQueries = require("../db/user");
const passport = require("../config/passport");

exports.signUpFormGet = async(req, res, next) =>{
    try{
        res.render("sign-up", {
            title: "Sign Up",
        })
    }catch(err){
        next(err);
    }
};

exports.signUpFormPost = async(req, res, next) =>{
    try{
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            const dbFailed = errors.array().some(e => e.msg === "Database Error!");
            if(dbFailed) return next(new Error("Database error during sign up!"));
            return res.status(400).render("sign-up", {
                title: "Sign Up",
                errors: errors.array(),
                username: req.body.username,
            });
        }

        const {username, password} = matchedData(req);
        const hashedPassword = await hashPassword(password);
        await userQueries.createUser({username, password: hashedPassword});

        res.redirect("/");
    }catch(err){
        next(err);
    }
};

exports.loginFormGet = async(req, res, next) =>{
    try{
        res.render("log-in", {
            title: "Log In"
        });
    }catch(err){
        next(err);
    }
};

exports.loginFormPost = async(req, res, next) =>{
    try{
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).render("log-in", {
                title: "Log In",
                errors: errors.array(),
                username: req.body.username,
            });
        }
        passport.authenticate("local", (err, user, info) =>{
            if(err) return next(err);

            if(!user){
                return res.status(400).render('log-in', {
                    title: "Log In",
                    errors: [{msg: info?.message || "Invalid username or password"}],
                });
            }

            req.logIn(user, (err) =>{
                if(err) return next(err);
                return res.redirect("/");
            });
        })(req, res, next);
    }catch(err){
        next(err);
    }
};

exports.logoutPost = async (req, res, next) => {
    req.logout((err) =>{
        if(err) return next(err);
        res.redirect("/");
    });
};

exports.isAuthenticated = (req, res, next) =>{
    if(req.isAuthenticated()) return next();
    res.redirect("/auth/log-in");
};