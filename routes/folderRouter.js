const { Router } = require("express");
const router = Router();

const { newFolderGet, newFolderPost, showFolderGet, renameFolderGet, renameFolderPost, deleteFolderPost} = require("../controllers/folderController");
const { shareFolderGet, shareFolderPost } = require("../controllers/shareController");
const { isAuthenticated } = require("../controllers/authController");
const folderValidator = require("../validators/folderValidators");

router.get("/new", isAuthenticated, newFolderGet);
router.post("/new", isAuthenticated, folderValidator, newFolderPost);
router.get("/:id", isAuthenticated, showFolderGet);
router.get("/:id/rename", isAuthenticated, renameFolderGet);
router.post("/:id/rename", isAuthenticated, renameFolderPost);
router.post("/:id/delete", isAuthenticated, deleteFolderPost);
router.get("/:id/share", isAuthenticated, shareFolderGet);
router.post("/:id/share", isAuthenticated, shareFolderPost);

module.exports = router;