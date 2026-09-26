const { body } = require("express-validator");

const nameValidator = [
    body("name")
        .trim()
        .notEmpty().withMessage("File should have a name")
        .isLength({max: 255}).withMessage("File name is too long"),
]

module.exports = nameValidator;