const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const imageSchema = new Schema(
  {
    filepath: String,
    filename: String,
    imageId: String,
    userId: String,
    projectId: String,
    created: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

const Image = mongoose.model("Image", imageSchema);

module.exports = Image;
