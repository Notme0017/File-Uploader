const prisma = require("../lib/prisma");

class User {
    async getAllUsers() {
        return prisma.user.findMany();
    };

    async getUserById(id){
        return prisma.user.findUnique({
            where: { id },
            select:{
                id: true,
                username: true,
                createdAt: true,
            }
        });
    };

    async getUserByUsername(username){
        return prisma.user.findUnique({
            where: {username},
        });
    };

    async usernameExists(username){
        const user = await prisma.user.findUnique({
            where: {username},
            select: {id: true},
        });
        return !!user;
    }

    async createUser ({username, password}){
        return prisma.user.create({
            data: {username, password},
        });
    };
};

module.exports = new User();