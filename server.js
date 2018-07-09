const express = require("express")
const mongoose = require("mongoose")
const bodyParser = require("body-parser")
const { User, Question, Category } = require("./schema")

const mongooseUri =
  process.env.NODE_ENV === "production"
    ? process.env.MONGOOSE_URI
    : require("./secrets.json").MONGOOSE_SRV
try {
  mongoose.connect(
    mongooseUri,
    {
      poolSize: 10,
      useNewUrlParser: true,
      autoIndex: false
    }
  )
  mongoose.connection.on("error", err => {
    throw err
  })

  const app = express()
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))

  const port = process.env.NODE_ENV === "production" ? process.env.PORT : 3000

  app.get("/", (req, res) => res.send("web-dev-prep-server"))
  app.get("/categories", async (req, res) => {
    try {
      res.json(await Category.find())
    } catch (error) {
      res.json({
        error: {
          message: error.message,
          stack: error.stack
        }
      })
    }
  })
  app.get("/questions/:category", async (req, res) => {
    try {
      const category = await Category.find({ name: req.params.category })
      res.json({
        category
      })
    } catch (error) {
      res.json({
        error: {
          message: error.message,
          stack: error.stack
        }
      })
    }
  })

  app.post("/questions/add", async (req, res) => {
    try {
      const foundCategory = await Category.findOne({ name: req.body.category })
      const questionId = new mongoose.Types.ObjectId()
      if (foundCategory) {
        foundCategory.questions = [...foundCategory.questions, questionId]
        const [savedQuestion, updatedCategory] = await Promise.all([
          await new Question({
            _id: questionId,
            title: req.body.title,
            content: req.body.content,
            category: foundCategory.id,
            options: req.body.options,
            answer: req.body.answer
          }).save(),
          await foundCategory.save()
        ])
        res.json({
          question: savedQuestion
        })
      } else {
        const categoryId = new mongoose.Types.ObjectId()
        const [savedQuestion, savedCategory] = await Promise.all([
          await new Category({
            _id: categoryId,
            name: req.body.category,
            questions: [questionId]
          }).save(),
          await new Question({
            _id: questionId,
            title: req.body.title,
            content: req.body.content,
            category: categoryId,
            options: req.body.options,
            answer: req.body.answer
          }).save()
        ])
        res.json({
          question: savedQuestion
        })
      }
    } catch (error) {
      res.json({
        error: {
          message: error.message,
          stack: error.stack
        }
      })
    }
  })

  app.listen(3000, () =>
    console.log(`web-dev-prep-server running on port ${port}`)
  )
} catch (err) {
  console.error(err)
}
