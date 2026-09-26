const folderQueries = require("../db/folders");
const fileQueries = require("../db/files");
const CustomError = require("../errors/CustomError");
const path = require("node:path");
const fs = require("node:fs/promises");
const { validationResult, matchedData } = require("express-validator");
const cloudinary = require("../config/cloudinary");

function uploadBufferToCloudinary(buffer){
    return new Promise((resolve, reject) =>{
        const stream = cloudinary.uploader.upload_stream(
            {resource_type: "auto", folder: "file-uploader"},
            (error, result) =>{
                if(error) return reject(error);
                resolve(result);
        });
        stream.end(buffer);
    });
}

exports.uploadFileGet = async (req, res, next) =>{
    const folderId = req.query.folderId || null;
    res.render("upload-file", {
        title: "Upload File",
        folderId: folderId,
    });
};

exports.uploadFilePost = async (req, res, next) =>{
    try{
        if(!req.file) return res.status(400).send("No file uploaded");

        const {folderId} = req.body;
        const normalizedFolderId = folderId ? Number(folderId): null;

        if(normalizedFolderId){
            const folder = await folderQueries.getFolderById(normalizedFolderId, req.user.id);
            if(!folder) throw new CustomError(400, "Invalid Target Folder!");
        }

        const result = await uploadBufferToCloudinary(req.file.buffer);

        await fileQueries.addFile({
            name: req.file.originalname,
            size: req.file.size,
            mimeType: req.file.mimetype,
            url: result.secure_url,
            publicId: result.public_id,
            resource_type: result.resource_type,
            userId: req.user.id,
            folderId: normalizedFolderId,
        });

        res.redirect(normalizedFolderId ? `/folders/${normalizedFolderId}`: "/dashboard");
    }catch(err){
        next(err);
    }
};

exports.viewFileGet = async (req, res, next) =>{
    try{
        const fileId = Number(req.params.id);
        if(Number.isNaN(fileId)) return CustomError(404, "Invalid File Id");

        const file = await fileQueries.getFileById(fileId, req.user.id);
        if(!file) throw new CustomError(404, "Page not found!");

        res.render("file-view", {
            file: file
        });
    }catch(err){
        next(err);
    }
};

exports.moveFileGet = async(req, res, next) =>{
    try{
        const fileId = Number(req.params.id);
        const file = await fileQueries.getFileById(fileId, req.user.id);
        if(!file) throw new CustomError(404, "File not found!");

        const allFolders = await folderQueries.getAllFoldersFlat(req.user.id);

        const byId = Object.fromEntries(allFolders.map(f => [f.id, f]));

        function buildPath(folder) {
            const parts = [folder.name];
            let current = folder;
            while(current.parentId){
                current = byId[current.parentId];
                if(!current) break;
                parts.unshift(current.name);
            }
            return parts.join("/");
        };

        const folderOptions = allFolders.map(f => ({
            id: f.id,
            label: buildPath(f),
        }));

        res.render("move-file", {file: file,
            folderOptions: folderOptions,
        })
    }catch(err){
        next(err);
    }
};

exports.moveFilePost = async(req, res, next) =>{
    try{
        const fileId = Number(req.params.id);
        const { folderId } = req.body;
        const normalizedFolderId = folderId? Number(folderId): null;

        const file = await fileQueries.getFileById(fileId, req.user.id);
        if(!file) throw new CustomError(404, "Not access to the file!");

        if(normalizedFolderId){
            const targetFolder = await folderQueries.getFolderById(normalizedFolderId);
            if(!targetFolder){
                throw new CustomError(404, "Folder not found");
            }

        }
        await fileQueries.moveFile(fileId, req.user.id, normalizedFolderId);

        res.redirect(normalizedFolderId ? `/folders/${normalizedFolderId}`: "/dashboard");
    }catch(err){
        next(err);
    }
};

exports.downloadFileGet = async(req, res, next) =>{
    try{
        const fileId = Number(req.params.id);
        if(Number.isNaN(fileId)) throw new CustomError(400, "Invalid File Id");

        const file = await fileQueries.getFileById(fileId, req.user.id);
        if(!file) throw new CustomError(400, "File not found!");

        res.redirect(file.url);

        //const downloadUrl = file.url("/upload/", `/upload/fl_attachment:${encodeURIComponent(file.name)}/`);
        //res.redirect(downloarUrl);
    }catch(err){
        next(err);
    }
};

exports.renameFileGet = async(req, res, next) =>{
    try{
        const fileId = Number(req.params.id);
        if(Number.isNaN(fileId)) throw new CustomError(400, "Invalid File");
    
        const file = await fileQueries.getFileById(fileId, req.user.id);
        if(!file) throw new CustomError(400, "File not found!");
    
        res.render("rename-file", {
            title: "Rename File",
            file: file
        });
    }catch(err){
        next(err);
    }
};

exports.renameFilePost = async(req, res, next) =>{
    try{
        const fileId = Number(req.params.id);
        if(Number.isNaN(fileId))throw new CustomError(400, "Invalid File");

        const file = await fileQueries.getFileById(fileId, req.user.id);
        if(!file) throw new CustomError(400, "File not found!");

        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).render("rename-file", {
                tilte: "Rename File",
                file: file
            })
        };
        const {name} = matchedData(req);
        await fileQueries.renameFile(fileId, req.user.id, name);

        const folderId = await fileQueries.getFolderByFileId(fileId, req.user.id);

        res.redirect(folderId? `/folders/${folderId}`: "/dashbaord");
    }catch(err){
        throw(err);
    }
};

exports.deleteFilePost = async (req, res, next) =>{
    try{
        fileId = Number(req.params.id);
        if(Number.isNaN(fileId)) throw new CustomError(400, "Invalid File Id");

        const file = await fileQueries.getFileById(fileId, req.user.id);
        if(!file) throw new CustomError(404, "File not found!");

        const folderId = await fileQueries.getFolderByFileId(fileId, req.user.id);

       if(file.publicId){
        try{
            await cloudinary.uploader.destroy(file.publicId, {resource_type: file.resourceType || "image"});
        }catch(err){
            next(err);
        }
       }
        await fileQueries.deleteFile(fileId, req.user.id);

        res.redirect(folderId? `/folders/${folderId}`: "/dashboard");
    }catch(err){
        next(err);
    }
};