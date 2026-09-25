
exports.indexPageGet = async (req, res, next) =>{
  res.render("index", {
    title: "Index",
  })
}