var express = require("express");
var path = require("path");
var bodyParser = require("body-parser"); 

var app = express();
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: true })); 


// parse the data, and store in memory
var fs = require('fs');
var parse = require('csv').parse; // server side module to parse a csv file.

var totalCount; // total lat,longs
var globalData; // our parsed data array from csv file
var  IPTable;; // table: [[IpV6, [lat, long]], ... , [[IpV6],[lat,long]]]
var densityHash; // count of IPv6 for each lat, long
var densityList; // 

var parser = parse(function(err, data){

  totalCount = data.length;
  globalData = data;

  IPTable = []; // table: [[IpV6, [lat, long]], ... , [[IpV6],[lat,long]]]
  densityHash = {}; // hash: {[lat,long] : count}

  for (var i =0; i < globalData.length; i++){
    IPTable.push([globalData[i][1], [globalData[i][7], globalData[i][8]]]);
    latLong = [IPTable[i][1]]; // the lat/long array

    if (densityHash[latLong]) { // counting the total IPv6 values worldwide
      densityHash[latLong] +=1;
    }
    else {
      densityHash[latLong] = 1;
  }
  }
  densityList = []; // density for each lat, long pair
  Object.keys(densityHash).forEach(function(key){
        var b = key.split(',').map(Number);
        b.push(densityHash[key]/totalCount);
        densityList.push(b);
      });
  });
fs.createReadStream('file.csv').pipe(parser);


/*
*  "/"  endpoint                                    
*  renders homepage html 
*/
app.get('/', function(req, res) {
  res.sendFile(__dirname + "/public/index.html");
});


/*
*  "/heatmap" endpoint
*  sends [[lat,long, intensity], ..., []].
*  used by client to populate heatmap
*/


app.post('/heatmap', function(req, res) {
  res.send(densityList);
});


/*
*  "/geodata"  endpoint                                    
*   uses the params sent from the client side
*   sends response to client with list of interested
*   coordinates.
*   If no coordinates with IPv6, sends a message
*/
app.post("/geodata", function(req, res) {

  var valueList;
  for (var key in req.body) {
     valueList = req.body[key];
  }
 
  var minLat = valueList[0]; 
  var maxLat = valueList[1];
  var minLong = valueList[2];
  var maxLong = valueList[3];

  var geoList = [];

  for (var i =0; i < densityList.length; i++ ) {
      var lat = densityList[i][0];
      var lon = densityList[i][1];
     
      if (lat > minLat && lat < maxLat){
          if (lon > minLong && lon < maxLong){
              geoList.push(densityList[i]);
  }}};

  if (typeof geoList !== 'undefined' && geoList.length > 0) { 
     res.send(geoList); 
  } else {
     res.send("No coordinates within this bounding box"); 
  } 
});


// Initialize the app.
var server = app.listen(process.env.PORT || 8080, function () {
  var port = server.address().port;
  console.log("App now running on port", port);
  });


// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason);
  res.status(code || 500).json({"error": message});
}


