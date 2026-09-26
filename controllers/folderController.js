const { validationResult } = require("express-validator");
const folderQueries = require("../db/folders");
const fileQueries = require("../db/files");
const cloudinary = require("../config/cloudinary");

exports.dashBoardGet = async (req, res, next) => {
    try{
        console.log(req.user);
        const folders = await folderQueries.getTopLevelFolders(req.user.id);
        const files = await fileQueries.getTopLevelFile(req.user.id);

        if(!folders) throw Error("Unable to fetch the rubber voice.");

        res.render("dashboard", {
            title: "Dashboard",
            folders: folders,
            files: files,
        })
    }catch(err){
        next(err);
    }

};

exports.newFolderGet = async (req, res, next) =>{
    try{
        const parentId = req.query.parentId || null;
        res.render("new-folder", {
            title: "New Folder",
            parentId: parentId,
        });
    }catch(err){
        next(err);
    }
};

exports.newFolderPost = async (req, res, next) =>{
    try{
        
        const {name, parentId} = req.body;
        const normalizedParentId = parentId ? Number(parentId) : null;
        
        if(normalizedParentId){
            const parent = await folderQueries.getFolderById(normalizedParentId, req.user.id);
            if(!parent){
                return res.status(400).render("new-folder", {
                    parentId: normalizedParentId,
                    error: "Invalid parent folder",
                });
            }
            const errors = validationResult(req);
            if(!errors.isEmpty()){
                return res.status(400).render("new-folder", {
                    parentId: normalizedParentId,
                    errors: errors,
                })
            }
        }

        const folder = await folderQueries.createFolder({
            name,
            userId: req.user.id,
            parentId: normalizedParentId,
        });

        res.redirect(normalizedParentId ? `/folders/${normalizedParentId}`: "/dashboard");
    }catch(err){
        next(err);
    }
};

exports.showFolderGet = async (req, res, next) =>{
    try{
        const id = Number(req.params.id);
        if(Number.isNaN(id)){
            return res.status(400).send("Invalid Folder Id!");
        }
        const folder = await folderQueries.getFolderById(id, req.user.id);

        const breadCrumbs = await folderQueries.getBreadCrumbs(id, req.user.id);

        res.render("folder", {
            title: "Folder",
            folder: folder,
            breadcrumbs: breadCrumbs,
        });
    }catch(err){
        next(err);
    };
};

exports.renameFolderGet = async(req, res, next) =>{
    try{
        const id = Number(req.params.id);   
        //catch for invalid id

        const folder = await folderQueries.getFolderById(id, req.user.id);
        //catch for no folder

        res.render("rename-folder", {
            title: "Rename Folder",
            folder: folder,
        })
    }catch(err){
        next(err);
    }
};

exports.renameFolderPost = async (req, res, next) => {
    try{
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            res.status(400).render("rename-folder", {
                title: "Rename Folder",
                errors: errors,
            });
        }

        const id = Number(req.params.id);
        const newName = req.body.name;
        //catch for invalid id
        await folderQueries.renameFolder(id, req.user.id, newName);
        res.redirect(`/folders/${id}`);
    }catch(err){
        next(err);
    }
};

exports.deleteFolderPost = async (req, res, next) =>{
    try{
        const folderId = Number(req.params.id);
        //catch for invalid folder id
        const parentId = await folderQueries.getParentId(folderId, req.user.id);

        const allFolders = await folderQueries.getAllDescendantFolderIds(folderId, req.user.id);

        const files = await fileQueries.getFileByFolderIds(allFolders, req.user.id);

        for(const file of files){
            if(file.publicId){
                try{
                    await cloudinary.uploader.destroy(file.publicId, {
                        resource_type: file.resource_type || "image",
                    });
                }catch(err){
                    next(err);
                }
            }
        }

        await folderQueries.deleteFolder(folderId, req.user.id);
        if(!parentId) res.redirect("/dashboard");
        else res.redirect(`/folders/${parentId}`);
    }catch(err){
        next(err);
    }
};