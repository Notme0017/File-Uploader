const {Router} = require("express");
const { signUpFormGet, signUpFormPost, loginFormGet, loginFormPost, logoutPost } = require("../controllers/authController");
const { signUpValidator, logInValidator } = require("../validators/authValidators");
const router = Router();

router.get("/sign-up", signUpFormGet);
router.post("/sign-up", signUpValidator, signUpFormPost);
router.get("/log-in", loginFormGet);
router.post("/log-in", logInValidator, loginFormPost);
router.post("/log-out", logoutPost);

module.exports = router;