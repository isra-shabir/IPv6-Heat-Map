var express = require("express");
var path = require("path");
var bodyParser = require("body-parser"); 

var app = express();
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());

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

// parse the data, and store in memory
var fs = require('fs');
var parse = require('csv').parse; // server side module to parse a csv file.

var totalCount; // total lat,longs
var globalData; // our parsed data array
var IPTable;  // our desired values (lat,long, & IPv6 of these lat,long)
var densityHash; // count of IPv6 for each lat, long
var densityList;

var parser = parse(function(err, data){

  totalCount = data.length;
  globalData = data;

  IPTable = []; // table: [[IpV6, [lat, long]], ... , [[IpV6],[lat,long]]]
  densityHash = {}; // hash: {[lat,long] : count}
  for (var i =0; i < globalData.length; i++){

    IPTable.push([globalData[i][1], [globalData[i][7], globalData[i][8]]]);
    latLong = [IPTable[i][1]];

    if (densityHash[latLong]) {
      densityHash[latLong] +=1;
    }
    else {
      densityHash[latLong] = 1;
  }
  }
  densityList = [];
  Object.keys(densityHash).forEach(function(key){
        var b = key.split(',').map(Number);
        b.push(densityHash[key]/totalCount);
        densityList.push(b);
      });
  // console.log(densityList);
  // console.log(globalData);
  });

fs.createReadStream('file.csv').pipe(parser);


/*
*  "/"  endpoint                                    
*  sends the data required to populate heatmap
*/
app.get('/', function(req, res) {

  res.send(densityList);

});

/*
*  "/"  endpoint                                    
*  sends the data required to populate heatmap
*/
app.get("/geodata", function(req, res) {
  console.log(req.body);
});


