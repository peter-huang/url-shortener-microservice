"use strict";

var express = require("express");
var mongo = require("mongodb");
var mongoose = require("mongoose");

var cors = require("cors");

var app = express();

// Basic Configuration
var port = process.env.PORT || 3000;

// Setup BodyParser
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));

// Setup DNS lookup
var dns = require("dns");

// Setup MongoDB
process.env.MONGO_URI = "YourMongoDBAuthentication";
var db = mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Setup Schema
const RedirectUrlSchema = new mongoose.Schema({
  short_url: String,
  original_url: String,
});

var RedirectUrl = mongoose.model("RedirectUrl", RedirectUrlSchema);

/** this project needs a db !! **/

// mongoose.connect(process.env.DB_URI);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// your first API endpoint...
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.listen(port, function () {
  console.log("Node.js listening ...");
});

// API url shorterner
app.post("/api/shorturl/new", (req, res, next) => {
  const url = req.body.url;

  const regUrlEx = /^https?:\/\/www\.[\w-]+\.[\w-/]+$/g;

  // Invalid url
  if (!regUrlEx.test(url)) {
    console.log("Error " + url);

    res.json({
      error: "invalid URL",
    });
  } else {
    // Count number of documents in collection
    RedirectUrl.countDocuments({}, (err, count) => {
      if (err) {
        console.log(err);
      } else {
        // Insert new document
        const i = url.indexOf(".") + 1;

        const d = new RedirectUrl({
          short_url: url.substring(i, i + 1) + count,
          original_url: url,
        });

        d.save((err, docs) => {
          if (err) {
            console.log("Insert error: " + err);
          }
        });

        res.json({
          original_url: url,
          short_url: url.substring(i, i + 1) + count,
        });
      }
    });
  }
});

// API url shorterner - redirect based on short url
app.get("/api/shorturl/:dataString", (req, res, next) => {
  const shortUrl = req.params.dataString;

  RedirectUrl.find({ short_url: shortUrl }, (err, results) => {
    if (err) {
      res.send("No such shorten url in found in our database.");
    } else {
      if (results.length > 0) {
        res.redirect(301, results[0].original_url);
      } else {
        res.send("No such shorten url in found in our database.");
      }
    }
  });
});

app.get("/api/shorturl/", (req, res, next) => {
  res.json({
    error: "Invalid short url",
  });
});
