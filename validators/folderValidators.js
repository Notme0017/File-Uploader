const { body } = require("express-validator");

const folderValidator = [
    body("name")
    .trim()
    .notEmpty().withMessage("Folder should have a name")
    .isLength({max: 255}).withMessage("Folder name is too long"),
]

module.exports = folderValidator;