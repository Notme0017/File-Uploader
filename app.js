require("dotenv/config");

const express = require("express");
const path = require("node:path");
const session = require("express-session");
const {PrismaSessionStore} = require("@quixo3/prisma-session-store");

const prisma = require("./lib/prisma");
const indexRouter = require("./routes/indexRouter");
const authRouter = require("./routes/authRouter");
const folderRouter = require("./routes/folderRouter");

const passport = require("./config/passport");

const app = express();

const assetPath = path.join(__dirname, "public");
app.use(express.static(assetPath));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.urlencoded({extended: true}));

app.use(
  session({
    cookie: {
      maxAge: 5 * 60 * 60 * 1000 
    },
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    store: new PrismaSessionStore(prisma, {
      checkPeriod: 30 * 1000,
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  }),
);

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) =>{
  res.locals.user = req.user || null;
  next();
});

app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/folders", folderRouter);

app.use((req, res, next) =>{
  res.status(404).send("Page not found! Idiot")
});

app.use((err, req, res, next) =>{
  console.error(err);
  res.status(err.statusCode || 500).send(err.message || "Something went wrong!");
});

const PORT = 8080;
app.listen(PORT, (err) =>{
  if(err) throw err;
  console.log("Express listening on port: 8080!");
})