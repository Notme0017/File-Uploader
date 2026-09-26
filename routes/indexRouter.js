const { Router } = require("express");
const indexRouter = Router();

const {indexPageGet} = require("../controllers/indexController");
const { dashBoardGet } = require("../controllers/folderController");
const { isAuthenticated } = require("../controllers/authController");


indexRouter.get("/", indexPageGet);
indexRouter.get("/dashboard", isAuthenticated, dashBoardGet);

module.exports = indexRouter;