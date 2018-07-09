const mongoose = require("mongoose")
const Schema = mongoose.Schema

var userSchema = new Schema({
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  correctQuestions: [Schema.Types.ObjectId],
  wrongQuestions: [Schema.Types.ObjectId]
})

var questionSchema = new Schema({
  title: {
    type: String,
    unique: true,
    required: true
  },
  content: String,
  category: Schema.Types.ObjectId,
  options: [String],
  answer: Number
})

var categorySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  questions: [Schema.Types.ObjectId]
})

module.exports = {
  User: mongoose.model("User", userSchema),
  Question: mongoose.model("Question", questionSchema),
  Category: mongoose.model("Category", categorySchema)
}
