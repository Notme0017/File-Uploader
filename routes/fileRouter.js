const { Router } = require("express");
const router = Router();
const multer = require('multer');

const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocesssignml.document",
];

const upload = multer({
    storage: multer.memoryStorage(),
    limits:{
        fileSize: 10* 1024 * 1024,
    },
    fileFilter: (req, file, cb) =>{
        if(ALLOWED_MIME_TYPES.includes(file.mimetype)){
            cb(null, true);
        }else{
            cb(new Error("File type not allowed"), false);
        }
    },
});

const { isAuthenticated } = require("../controllers/authController");
const { uploadFileGet, uploadFilePost, viewFileGet, moveFileGet, moveFilePost, downloadFileGet, renameFileGet, renameFilePost, deleteFilePost } = require("../controllers/fileController");
const nameValidator = require("../validators/fileValidators");


router.use(isAuthenticated);

//uplaod
router.get("/upload", uploadFileGet);
router.post("/upload", (req, res, next) => {
 upload.single("file")(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).render("upload-file", {
                    title: "Upload File",
                    folderId: req.body.folderId || null,
                    error: "File is too large. Max size is 10MB.",
                });
            }
            return res.status(400).render("upload-file", {
                title: "Upload File",
                folderId: req.body.folderId || null,
                error: "Upload error: " + err.message,
            });
        } else if (err) {
            return res.status(400).render("upload-file", {
                title: "Upload File",
                folderId: req.body.folderId || null,
                error: err.message,
            });
        }
        next();
    });}, uploadFilePost);
    

//view file
router.get("/:id", viewFileGet);
router.get("/:id/download", downloadFileGet);

//move file
router.get("/:id/move", moveFileGet);
router.post("/:id/move", moveFilePost);

//rename file
router.get("/:id/rename", renameFileGet);
router.post("/:id/rename", nameValidator, renameFilePost);

//delete file
router.post("/:id/delete", deleteFilePost);

module.exports = router;