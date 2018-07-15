const express = require("express")
const mongoose = require("mongoose")
const bodyParser = require("body-parser")
const { OAuth2Client } = require("google-auth-library")
const jwt = require("jsonwebtoken")
const { User, Question, Category } = require("./schema")

const secret =
  process.env.NODE_ENV === "production"
    ? process.env
    : require("./secrets.json")

const mongooseUri = secret.MONGOOSE_SRV
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

  const port = secret.PORT

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

  app.get("/categories/:category", async (req, res) => {
    try {
      if (req.query.populate && JSON.parse(req.query.populate)) {
        const category = await Category.find({
          name: req.params.category
        }).populate({
          path: "questions",
          model: "Question"
        })
        res.json({
          category
        })
      } else {
        const category = await Category.find({ name: req.params.category })
        res.json({
          category
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
  app.get("/questions/:id", async (req, res) => {
    try {
      const question = await Question.find({ _id: req.params.id })
      res.json({
        question
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

  app.get("/users/:googleId/", async (req, res) => {
    try {
      const user = await User.findOne({ googleId: req.params.googleId })
      user ? res.json({ user }) : res.json({ user: null })
    } catch (error) {
      res.json({
        error: {
          message: error.message,
          stack: error.stack
        }
      })
    }
  })

  app.get("/users/:googleId/token", async (req, res) => {
    try {
      const client = new OAuth2Client(secret.GOOGLE_API_KEY)
      const [ticket, foundUser] = await Promise.all([
        client.verifyIdToken({
          idToken: req.headers.id_token,
          audience: secret.QUIZ_APP_CLIENT_ID
        }),
        User.findOne({ googleId: req.params.googleId })
      ])
      const payload = ticket.getPayload()

      if (foundUser) {
        const profileToken = await jwt.sign(
          { googleId: foundUser.googleId },
          secret.PROFILE_TOKEN_SECRET
        )
        res.json({
          profileToken
        })
      } else {
        const newUser = new User({
          googleId: req.params.googleId,
          correctQuestions: [],
          wrongQuestions: []
        })
        const [savedUser, profileToken] = await Promise.all([
          newUser.save(),
          jwt.sign(
            { googleId: req.params.googleId },
            secret.PROFILE_TOKEN_SECRET
          )
        ])
        res.json({
          profileToken
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
