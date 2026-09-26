const prisma = require("../lib/prisma");

class SharedLinkQueries {
    async createSharedLink(folderId, durationMs){
        const expiresAt = new Date(Date.now() + durationMs);
        return prisma.sharedLink.create({
            data: {folderId, expiresAt},
        });
    };

    async getSharedLink(id){
        return prisma.sharedLink.findUnique({
            where: {id},
        });
    };
}

module.exports = new SharedLinkQueries();