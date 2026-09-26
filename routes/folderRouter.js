const { Router } = require("express");
const router = Router();

const { newFolderGet, newFolderPost, showFolderGet, renameFolderGet, renameFolderPost, deleteFolderPost } = require("../controllers/folderController");
const { isAuthenticated } = require("../controllers/authController");
const folderValidator = require("../validators/folderValidators");

router.get("/new", isAuthenticated, newFolderGet);
router.post("/new", isAuthenticated, folderValidator, newFolderPost);
router.get("/:id", isAuthenticated, showFolderGet);
router.get("/:id/rename", isAuthenticated, renameFolderGet);
router.post("/:id/rename", isAuthenticated, renameFolderPost);
router.post("/:id/delete", isAuthenticated, deleteFolderPost);

module.exports = router;