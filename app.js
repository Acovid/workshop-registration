var express = require("express"),
  bodyParser = require("body-parser"),
  Cloudant = require("@cloudant/cloudant"),
  fs = require('fs');

var app = express();

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({
  extended: true
}));

//enforce https on all pages
app.enable('trust proxy');
app.use(function (req, res, next) {
  if (req.secure || process.env.BLUEMIX_REGION === undefined) {
    next();
  } else {
    console.log('redirecting to https');
    res.redirect('https://' + req.headers.host + req.url);
  }
});

// CLOUDANT DB PREPARATION
var db;
var cloudant;
var dbCredentials = {
  dbName: 'participants'
};

function getDBCredentialsUrl(jsonData) {
  var vcapServices = JSON.parse(jsonData);
  return vcapServices["cloudantNoSQLDB"][0]["credentials"]["url"];
};

function initDBConnection() {
  if (process.env.VCAP_SERVICES) {
    dbCredentials.url = getDBCredentialsUrl(process.env.VCAP_SERVICES);
  } else {
    dbCredentials.url = getDBCredentialsUrl(fs.readFileSync("vcap_local.json", "utf-8"));
  }

  cloudant = Cloudant(dbCredentials.url);

  // check if DB exists if not create
  cloudant.db.create(dbCredentials.dbName, function (err, res) {
    if (err) {
      console.log('Could not create new db: ' + dbCredentials.dbName + ', it might already exist.');
    }
  });

  db = cloudant.use(dbCredentials.dbName);
};

initDBConnection();
// END OF CLOUDANT PREPARATION

// ROUTES
app.post("/", function (req, res) {
  var dbEntry = req.body.participant;
  db.insert(dbEntry, function (err, body) {
    if (err) {
      console.log(err);
    } else {
      console.log("Successfully added a new participant");
      // console.log(body);
      res.render("registered");
    }
  });
});
// END OF ROUTES

// START SERVER
app.listen(process.env.PORT || 3000, function () {
  console.log("server running!!!")
});