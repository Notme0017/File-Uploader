const sharedLinkQueries = require("../db/sharedLinks");
const folderQueries = require("../db/folders");
const CustomError = require("../errors/CustomError");
const prisma = require("../lib/prisma");

exports.shareFolderGet = async(req, res, next) =>{
    try{
        const folderId = Number(req.params.id);
        if(Number.isNaN(folderId)) throw new CustomError(400, "Invalid Folder Id!");

        const folder = await folderQueries.getFolderById(folderId, req.user.id);
        if(!folder) throw new CustomError(400, "Invlaid Folder");

        res.render("share-folder", {
            folder: folder,
        });
    }catch(err){
        next(err);
    }
};


exports.shareFolderPost = async(req, res, next) =>{
    try{
        const folderId = Number(req.params.id);
        if(Number.isNaN(folderId)) throw new CustomError(400, "Invalid Folder Id!");

        const folder = await folderQueries.getFolderById(folderId, req.user.id);
        if(!folder) throw new CustomError(400, "Invalid Folder");

        const duration = Number(req.body.duration);
        if(Number.isNaN(duration)) throw new CustomError(400, "Invalid Duration");

        const link = await sharedLinkQueries.createSharedLink(folderId, duration);
        const shareUrl = `${req.protocol}://${req.get("host")}/share/${link.id}`;

        res.render("share-link-result", {
            shareUrl: shareUrl,
        });
    }catch(err){
        next(err);
    }
};

async function getFolderTree(folderId) {
    const folder = await prisma.folder.findUnique({
        where: {id: folderId},
        include: {files: true, children: true},
    });

    if(!folder) return null;

    const childTrees = await Promise.all(
        folder.children.map((child) => getFolderTree(child.id))
    );

    return {...folder, childre: childTrees};
}

exports.viewSharedFolder = async (req, res, next) =>{
    try{
        const link = await sharedLinkQueries.getSharedLink(req.params.id);
        if(!link) throw new CustomError(404, "Link not found");

        if(link.expiresAt < new Date()){
            return res.status(410).render("share-expired");
        }

        const folderTrees = await getFolderTree(link.folderId);
        if(!folderTrees) throw new CustomError(404, "Folder no longer exists!");

        res.render("shared-folder", {
            folder: folderTrees,
            shareId: link.id
        })
    }catch(err){
        next(err);
    }
};

async function isFileInTree(fileId, rootFolderId) {
    const file = await prisma.file.findUnique({where: {id: fileId}});
    if(!file || file.folderId === null) return false;

    async function collectFolderIds(id) {
        const children = await prisma.folder.findMany({
            where: {parentId: id},
            select: {id: true},
        });
        let ids = [id];
        for (const child of children){
            ids = ids.concat(await collectFolderIds(child.id));
        }
        return ids;
    }

    const validFolderIds = await collectFolderIds(rootFolderId);
    return validFolderIds.includes(file.folderId);
}

exports.downloadSharedFile = async (req, res, next) =>{
    try{
        const link = await sharedLinkQueries.getSharedLink(req.params.id);
        if(!link) throw new CustomError(404, "Link not found");

        if(link.expiresAt < new Date()){
            return res.status(410).render("share-expired");
        }

        const fileId = Number(req.params.fileId);
        if(Number.isNaN(fileId)) throw new CustomError(400, "Invalid file id!");

        const allowed = await isFileInTree(fileId, link.folderId);
        if(!allowed) throw new CustomError(403, "File not part of the shared folder");

        const file = await prisma.file.findUnique({where: {id: fileId}});
        res.redirect(file.url);
    }catch(err){
        next(err);
    }
}