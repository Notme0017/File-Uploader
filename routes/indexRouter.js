const { Router } = require("express");
const indexRouter = Router();

const {indexPageGet} = require("../controllers/indexController");

indexRouter.get("/", indexPageGet);

module.exports = indexRouter;