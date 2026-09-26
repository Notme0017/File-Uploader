const { validationResult } = require("express-validator");
const folderQuereies = require("../db/folders");

exports.dashBoardGet = async (req, res, next) => {
    try{
        console.log(req.user);
        const folders = await folderQuereies.getTopLevelFolders(req.user.id);

        if(!folders) throw Error("Unable to fetch the rubber voice.");

        res.render("dashboard", {
            title: "Dashboard",
            folders: folders
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
            const parent = await folderQuereies.getFolderById(normalizedParentId, req.user.id);
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

        const folder = await folderQuereies.createFolder({
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
        const folder = await folderQuereies.getFolderById(id, req.user.id);

        const breadCrumbs = await folderQuereies.getBreadCrumbs(id, req.user.id);

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

        const folder = await folderQuereies.getFolderById(id, req.user.id);
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
        await folderQuereies.renameFolder(id, req.user.id, newName);
        res.redirect(`/folders/${id}`);
    }catch(err){
        next(err);
    }
};

exports.deleteFolderPost = async (req, res, next) =>{
    try{
        const folderId = Number(req.params.id);
        //catch for invalid folder id
        const parentId = await folderQuereies.getParentId(folderId, req.user.id);
        await folderQuereies.deleteFolder(folderId, req.user.id);
        if(!parentId) res.redirect("/dashboard");
        else res.redirect(`/folders/${parentId}`);
    }catch(err){
        next(err);
    }
};