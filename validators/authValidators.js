const { body } = require("express-validator");
const userQueries = require("../db/user");

const signUpValidator = [
    body("username")
    .trim()
    .notEmpty().withMessage("Username cannot be empty!")
    .isLength({max: 255}).withMessage("Username is too long")
    .custom(async (value) =>{
        let exists;
        try{
            exists = await userQueries.usernameExists(value);
        }catch(err) {throw new Error("Database Error!")};
        if(exists) throw new Error("Username is already taken");
        return true;
    }),

    body("password")
    .notEmpty().withMessage("Password cannot be empty")
    .isLength({max: 255}).withMessage("Password is too long"),
    
    body("confirmpassword")
    .custom((value, {req}) => value === req.body.password).withMessage("Passwords do not match"),
];

const logInValidator = [
    body("username")
    .trim()
    .notEmpty().withMessage("Username cannot be empty!")
    .isLength({max: 255}).withMessage("Username is too long"),

    body("password")
    .notEmpty().withMessage("Password cannot be empty")
    .isLength({max: 255}).withMessage("Password is too long"),
]

module.exports = { signUpValidator, logInValidator}