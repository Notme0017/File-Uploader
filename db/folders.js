const prisma = require("../lib/prisma");

class Folder {
    async getTopLevelFolders(userId){
        return prisma.folder.findMany({
            where: {userId, parentId: null},
            orderBy: {name: "asc"},
        });
    };

    async getFolderById(id, userId){
        return prisma.folder.findFirst({
            where: {id, userId},
            include: {
                children: true,
                files: true,
            }
        });
    };

    async createFolder({name, userId, parentId = null}){
        return prisma.folder.create({
            data: {name, userId, parentId},
        });
    };

    async renameFolder (id, userId, newName){
        return prisma.folder.updateMany({
            where: { id, userId },
            data: {name: newName},
        });
    };

    async deleteFolder (id, userId){
        return prisma.folder.deleteMany({
            where: {id, userId},
        });
    };

    async getParentId (id, userId){
        const folder =  prisma.folder.findFirst({
            where: {id, userId},
            select: {parentId: true},
        });
        return folder?.parentId ?? null;
    };

    async getBreadCrumbs(folderId, userId){
        const breadCrumbs = [];
        let currentId = folderId;

        while(currentId){
            const folder = await prisma.folder.findFirst({
                where: {id: currentId, userId},
                select: {id: true, name: true, parentId: true}
            });

            if(!folder) break;

            breadCrumbs.unshift({id: folder.id, name: folder.name});
            currentId = folder.parentId;
        }
        return breadCrumbs;
    }

    async getAllFoldersFlat(userId){
        return await prisma.folder.findMany({
            where: {userId: userId},
            select: {id: true, name: true, parentId: true},
            orderBy: {name: "asc"},
        });
    };

    async getFolderPathLabels(folderId, userId){
        const breadCrumbs = await this.getBreadCrumbs(folderId, userId);
        return breadCrumbs.map(f => f.name).join("/");
    };

    async getAllDescendantFolderIds(folderId, userId){
        const ids = [folderId];

        const children = await prisma.folder.findMany({
            where: {parentId: folderId, userId: userId},
            select: {id: true},
        });

        for(const child of children){
            const childIds = await this.getAllDescendantFolderIds(child.id, userId)
            ids.push(...childIds);
        };

        return ids;
    }
}

module.exports = new Folder();