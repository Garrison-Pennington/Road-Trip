var key = "AIzaSyBnWnCJha6_cQE_PTzVBUpqsH5gzkbvUuE";
var searchRadius = 50000;
var waypointSpacing = searchRadius*1.25;
var maxWaypointSpacing = waypointSpacing*1.25;
var foursquareClientId = "VGOXMO5JN5KMAEA30G1ZXZPZULAIPQ2MG3WS3NRHS2E52YYE";
var foursquareClientSecret = "HF4AHPPFI1BCFNEXNSZ1D1Q2ZDF1FCDCQGTFDBELRTTXCB0A";
var foursquareCredentials = "client_id=" + foursquareClientId + "&client_secret=" + foursquareClientSecret + "&v=20190505&";
//DIRECTIONS API
var directionsRequest = "https://maps.googleapis.com/maps/api/directions/json?key="+key+"&";// + Parameters
/* Required Parameters
Origin: One of three
- Address EX: 24+Sussex+Drive+Ottawa+ON
- Latitude, Longitude EX: 41.43206,-81.38992
- Place ID EX: place_id:ChIJ3S-JXmauEsRUcIaWtf4MzE
Destination: Same as Origin
Key: API Key

Optional Parameters
Mode: one of four
 - driving (default)
 - walking
 - bicycling
 - transit

Waypoints: Array of
 - (Lat,Long)
 - Place ID
 - Address
 - Encoded Polyline
*/

//Nearby Search
var nearbyRequest = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?key="+key+"&radius=" +searchRadius +"&";// + Parameters
/* Required Parameters
Location:
 - Latitude,Longitude
 Radius: Number 0-50,000


Optional Parameters
Keyword: string
Minprice Maxprice: 0-4
Opennow: True/False
Type: Supported type, see https://developers.google.com/places/web-service/supported_types
*/

// Foursquare Venue Details Request
var foursquareDetailsRequest = "https://api.foursquare.com/v2/venues/XXIDXX?" + foursquareCredentials;

// Foursquare Venue Search Search Request
var foursquareVenueSearch = "https://api.foursquare.com/v2/venues/search?" + foursquareCredentials;

//Snap to Road
var snapRequest = "https://roads.googleapis.com/v1/snapToRoads?key=" + key +"&path="; // + Points  lat,lng|lat,lng

// Location String String ---> JSON
// Searches near given coordinates for places of a given type related to the keywords and returns all results
function nearbySearch(coordinates,keywords,type){
  var url = nearbyRequest + "location="+coordinates+"&keyword="+keywords+"&type="+type;
  var response = JSON.parse(UrlFetchApp.fetch(url).getContentText());
  return response;
}

function testNearby(){
  var test = nearbySearch("37.811410,-122.238268","pizza","restaurant");
  return test.results;
}

// JSON ---> {Name: {Ratings:float,User_ratings_total: int, price_level: int, place_id: String}}
function getPlaceInfo(place){
  var temp = {};
  temp.rating = (place.rating);
  temp.user_ratings_total = (place.user_ratings_total);
  temp.price_level = (place.price_level);
  temp.place_id = (place.place_id);
  temp.location = (place.geometry.location);
  temp.name = place.name;
  return temp;
  }

// Place[] ---> {Name: {Ratings:float,User_ratings_total: int, price_level: int, place_id: String}}
// Take a place result array and return a Dictionary with summary info about the place
function getInfoForAllPlaces(places){
  var dict = {};
  for(var p = 0; p<places.length; p++){
    dict[places[p].name] = getPlaceInfo(places[p]);
  }
  return dict;
}

function testPlaceInfo(){
  var test = [];
  var nearby = testNearby();
  test.push(getPlaceInfo(nearby[0]));
  test.push(getPlaceInfo(nearby[1]));
  test.push(getPlaceInfo(nearby[2]));
  return test;
}

//Location Location ---> Route(JSON)
//Take two locations, A,B, and find the route from A to B
function getABRoute(start,end) {
  var url = directionsRequest+"origin="+start+"&destination="+end;
  var response = UrlFetchApp.fetch(url).getContentText();
  return JSON.parse(response);
}

function testAB(){
  var data = getABRoute("Oakland,CA","New York City");
  return data;
}

// Location Location ---> String[]
// Gets all coordinate pairs to search near for Points of Interest
function getAllSearchCoordinates(start, end){
  var json = getABRoute(start,end);
  var steps = json.routes[0].legs[0].steps;
  var coordinates = [json.routes[0].legs[0].start_location.lat +","+json.routes[0].legs[0].start_location.lng];
  var counter = 0;
  for(var s = 0; s<steps.length;s++){
    var coor_string = steps[s].start_location.lat +","+steps[s].start_location.lng;
    var distance = steps[s].distance.value;
    if(counter + distance >= waypointSpacing && counter + distance < maxWaypointSpacing){
      coordinates.push(coor_string);
      counter = 0;
    }else if(counter + distance > maxWaypointSpacing){
      var end_string = steps[s].end_location.lat +","+steps[s].end_location.lng;
      coordinates = coordinates.concat(findSearchPointsEXT(coor_string, end_string, distance));
      counter = 0;
    }else{
      counter += distance;
    }
  }
  coordinates.push(json.routes[0].legs[0].end_location.lat +","+json.routes[0].legs[0].end_location.lng);
  return coordinates;
}

function testSearchCoordinates(){
  var test = getAllSearchCoordinates("Oakland,CA","Vancouver, BC");
  return test;
}

//String String Int ---> String[]
//Takes the coordinate pairs of start and end coordinates and the distance between the points and returns a list of points along the route
function findSearchPointsEXT(start, end, distance){
  var startX = parseFloat(start.split(",")[0]);
  var startY = parseFloat(start.split(",")[1]);
  var endX = parseFloat(end.split(",")[0]);
  var endY = parseFloat(end.split(",")[1]);
  var dt = Math.round(distance/waypointSpacing);
  var dx = (endX-startX)/dt;
  var dy = (endY-startY)/dt;
  var points = [start];
  for(var i = 1; i < dt; i++){
    var newX = startX+(dx*i);
    var newY = startY+(dy*i);
    points.push(newX+","+newY);
  }
  points.push(end);
  return points;
}

function testPointFinder(){
  var test = findSearchPointsEXT("39.761467,-119.637036","40.855586,-113.209453",761220);
  return test;
}

//String[] {keywords:[],type:String} ---> Array
//Takes an array of coordinates and a JSON object of search info and returns an array of JSON results
function searchAlongRoute(points, search){
  var keys = "";
  for(var i = 0; i<search.keywords.length; i++){
    keys += search.keywords[i] + ",";
  }
  var type = search.type;
  var results = [];
  for(var i = 0; i<points.length;i++){
    results.push(nearbySearch(points[i],keys,type));
  }
  return results;
}

function testSearchAlongRoute(){
  var search = createSearch(["huckleberry"],"");
  var test = searchAlongRoute(testSearchCoordinates(),search);
  return test;
}

//String[] String ---> {keywords:[],type:String}
// Takes a list of keywords and location type and creates an object with those properties
function createSearch(keywords,type){
  var search = {};
  search.keywords = keywords;
  search.type = type;
  return search;
}

// Searches[] ---> JSON
//Takes a list of JSON search results and returns basic info of all results
function getResultsInfo(results){
  var places = {};
  for(var i = 0; i<results.length;i++){
    var temp = getInfoForAllPlaces(results[i].results);
    for(var p in temp){
      places[p] = temp[p];
    }
  }
  return places;
}

function testResultsInfo(){
  var test = getResultsInfo(testSearchAlongRoute());
  return test;
}

function dumpInfoToSheet(info){
  var sheet = SpreadsheetApp.getActiveSheet();
  counter = 1;
  for(var p in info){
    sheet.getRange(counter,1).setValue(p);
    sheet.getRange(counter,2).setValue(info[p].rating);
    sheet.getRange(counter,3).setValue(info[p].user_ratings_total);
    sheet.getRange(counter,4).setValue(info[p].price_level);
    sheet.getRange(counter,5).setValue(info[p].place_id);
    sheet.getRange(counter,6).setValue(info[p].location.lat);
    sheet.getRange(counter,7).setValue(info[p].location.lng);
    counter+=1;
  }
}

function testDump(){
  dumpInfoToSheet(testResultsInfo());
}

function tester(){
  //Logger.log(testSearchAlongRoute());
  Logger.log(filterResultsByRating(getResultsInfo(testSearchAlongRoute())));
}

// JSON ---> JSON
// Filter out results with low ratings and review counts
function filterResultsByRating(results){
  temp = {}
  for(var r in results){
    if(results[r].user_ratings_total > 10){
      if(results[r].rating >= 4.5){
        temp[r] = results[r];
  }}}
  return temp;
}

// JSON ---> String
// Gets the Foursquare ID of a place from google search results
function getFoursquareId(place){
  var name = place.name;
  var lat = place.location.lat;
  var lng = place.location.lng;
  var intent = "match";
  var url = foursquareVenueSearch + "name=" + name + "&ll=" + lat +"," + lng + "&intent=" + intent;
  var response = UrlFetchApp.fetch(foursquareVenueSearch + "name=" + name + "&ll=" + lat +"," + lng + "&intent=" + intent);
  var fPlace = JSON.parse(response.getContentText());
  return fPlace.response.venues[0].id;
}

function testFsId(){
  var test = testPlaceInfo();
  var result = getFoursquareId(test[0]);
  Logger.log(result);
  return result;
}

function getFoursquareDetails(id){
  var url = foursquareDetailsRequest.replace('XXIDXX',id);
  var response = UrlFetchApp.fetch(url);
  var details = JSON.parse(response.getContentText());
  return details;
}

function testDetails(){
  var test = getFoursquareDetails(testFsId());
  Logger.log(test);
  return test
}
