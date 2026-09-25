require("dotenv/config");
const {PrismaPg} = require("@prisma/adapter-pg");
const {PrismaClient} = require("../generated/prisma");

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({connectionString});
const prisma = new PrismaClient({adapter});

module.exports = prisma;