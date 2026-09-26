const {Router} = require("express");
const router = Router();

const shareController = require("../controllers/shareController");

router.get("/:id", shareController.viewSharedFolder);
router.get("/:id/download/:fileId", shareController.downloadSharedFile);

module.exports = router;