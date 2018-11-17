const { promisify } = require('util');
const request = require('request');
const cheerio = require('cheerio');
const graph = require('fbgraph');
const { LastFmNode } = require('lastfm');
const tumblr = require('tumblr.js');
const GitHub = require('@octokit/rest');
const Twit = require('twit');
const stripe = require('stripe')(process.env.STRIPE_SKEY);
const twilio = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
const Linkedin = require('node-linkedin')(process.env.LINKEDIN_ID, process.env.LINKEDIN_SECRET, process.env.LINKEDIN_CALLBACK_URL);
const clockwork = require('clockwork')({ key: process.env.CLOCKWORK_KEY });
const paypal = require('paypal-rest-sdk');
const lob = require('lob')(process.env.LOB_KEY);
const ig = require('instagram-node').instagram();
const { Venues, Users } = require('node-foursquare')({
  secrets: {
    clientId: process.env.FOURSQUARE_ID,
    clientSecret: process.env.FOURSQUARE_SECRET,
    redirectUrl: process.env.FOURSQUARE_REDIRECT_URL
  },
  foursquare: {
    mode: 'foursquare',
    version: 20140806,
  }
});

/**
 * GET /api
 * List of API examples.
 */
exports.getApi = (req, res) => {
  res.render('api/index', {
    title: 'API Examples'
  });
};
const mongoose = require('mongoose');

var clothingSchema = new mongoose.Schema({
  img: { data: Buffer, contentType: String },
  originalname: String,
  path: String,
  colors: { type: String, text: true },
  styles: { type: String, text: true },
  garments: { type: String, text: true }
});
// db.clothings.createIndex( { colors: "text", styles: "text" , garments: "text"} )
// db.clothings.find( { $text: { $search: "grey brown black vintage coat" } } )

// clothingSchema.ensureIndex({ colors: "text", sport: "text", favoriteColor: "text" });
var ClothingModel = mongoose.model('Clothing', clothingSchema)

//messy coqnitive code
var FormData = require('form-data');
var fs = require('fs');
var API_URL = 'https://fashion.recoqnitics.com/analyze'
var ACCESS_KEY = '64fe4742fec11da36934'
var SECRET_KEY = '67e0d64280582bcdb426fc3131bd0c06f2bfdacd'
//Please edit the parameters above to suit your needs

function searchPhoto(photo, resHandle) {
  let formdata = {
   filename: fs.createReadStream(photo.path),
   access_key: ACCESS_KEY,
   secret_key: SECRET_KEY
 }

 request.post({ url: API_URL, formData: formdata }, (err, res, body) => {
   parseResults(JSON.parse(res.body), photo, resHandle)
 })
}

function parseResults(data, photo, resHandle) {
  var colorArr = []
  data.person.colors.forEach(function(element) {
    colorArr.push(element.colorGeneralCategory)
  });
  var colorArr = [...new Set(colorArr)]

  var styleArr = []
  data.person.styles.forEach(function(element) {
    styleArr.push(element.styleName)
  });
  var styleArr = [...new Set(styleArr)]

  var garmentArr = []
  data.person.garments.forEach(function(element) {
    garmentArr.push(element.typeName)
  });
  var garmentArr = [...new Set(garmentArr)]
  console.log(colorArr)
  console.log(styleArr)
  console.log(garmentArr)

  var searchStr = colorArr.join(' ') + ' ' + styleArr.join(' ') + ' ' + garmentArr.join(' ')
  ClothingModel.find({ $text: { $search: searchStr } }, function(err, docs) {
    console.log(docs);
    resHandle.render('api/search', {
      title: 'Image Search',
      docs
    });
  });
}


function uploadPhoto(photo) {
  let formdata = {
   filename: fs.createReadStream(photo.path),
   access_key: ACCESS_KEY,
   secret_key: SECRET_KEY
 }

 request.post({ url: API_URL, formData: formdata }, (err, res, body) => {
   uploadGarment(JSON.parse(res.body), photo)
 })
}

function uploadGarment(data, photo) {
  console.log(data)

  var colorArr = []
  data.person.colors.forEach(function(element) {
    colorArr.push(element.colorGeneralCategory)
  });
  var colorArr = [...new Set(colorArr)]

  var styleArr = []
  data.person.styles.forEach(function(element) {
    styleArr.push(element.styleName)
  });
  var styleArr = [...new Set(styleArr)]

  var garmentArr = []
  data.person.garments.forEach(function(element) {
    garmentArr.push(element.typeName)
  });
  var garmentArr = [...new Set(garmentArr)]

  let msg = new ClothingModel({
    img: photo.file,
    originalname: photo.originalname,
    path: photo.path.replace('public/', ''),
    colors: colorArr,
    styles: styleArr,
    garments: garmentArr
  });
  msg.save()
     .then(doc => {
       console.log('Successfully added the following garment to the db.')
       console.log(doc)
     })
     .catch(err => {
       console.error(err)
     })
}

/**
 * GET /api/upload
 * File Upload API example.
 */

var docs = [{originalname: '', path: '', colors: '', styles: '', garments:''}];
exports.getFileUpload = (req, res) => {
  res.render('api/search', {
    title: 'Image Search',
    docs
  });
};

exports.postFileUpload = (req, res, next) => {
  console.log(req.file);
  searchPhoto(req.file, res)
  req.flash('success', { msg: 'File was uploaded successfully. Please wait shortly for the results.' });
  // res.redirect('/api/search');
};

exports.getAddGarment = (req, res) => {
  res.render('api/upload', {
    title: 'Upload Garment'
  });
};

exports.postAddGarment = (req, res, next) => {
  console.log(req.file);
  uploadPhoto(req.file);
  req.flash('success', { msg: 'File was uploaded successfully to the database.' });
  res.redirect('/api/upload');
};
