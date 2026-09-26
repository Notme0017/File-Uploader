const prisma = require("../lib/prisma");

class File{
    
    async getFileById(id, userId){
        return prisma.file.findFirst({
            where: {id: id, userId: userId},
            orderBy: {name: "asc"},
        });
    };

    async getTopLevelFile(userId){
        return prisma.file.findMany({
            where: {folderId: null, userId: userId},
            orderBy: {name: 'asc'},
        });
    };

    async getFolderByFileId(id, userId){
        const file = await prisma.file.findFirst({
            where: {id: id, userId: userId},
            select: {folderId: true},
        });
        return file?.folderId ?? null;
    };

    async addFile({name, size, mimeType, url = null, userId, publicId, resourceType, folderId = null}){
        return prisma.file.create({
            data: {
                name: name,
                size:size,
                mimeType: mimeType,
                url: url,
                publicId: publicId,
                resourceType: resourceType,
                userId: userId,
                folderId: folderId
            },
        });
    };

    async moveFile(id, userId, newFolderId){
        return prisma.file.updateMany({
            where: {id: id,
                userId: userId },
            data: {folderId: newFolderId}
        });
    };

    async renameFile(id, userId, newName) {
        return prisma.file.updateMany({
            where: { 
                id: Number(id), 
                userId: Number(userId) 
            },
            data: { 
                name: newName 
            },
        });
    };

    async deleteFile(id, userId){
        return prisma.file.deleteMany({
            where: {id: id, userId: userId},
        });
    };

    async getFileByFolderIds(folderIds, userId){
        return prisma.file.findMany({
            where: {
                folderId: {in: folderIds},
                userId: userId,
            },
        });
    }
}

module.exports = new File();