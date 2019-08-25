var searchRadius = 50000;
var waypointSpacing = searchRadius*1.25;
var maxWaypointSpacing = waypointSpacing*1.25;


// *** APIs ***
// Google Authentication
var google_project_key = "AIzaSyBnWnCJha6_cQE_PTzVBUpqsH5gzkbvUuE";
// Foursquare Authentication and version
var foursquareCredentials = "client_id=VGOXMO5JN5KMAEA30G1ZXZPZULAIPQ2MG3WS3NRHS2E52YYE&client_secret=HF4AHPPFI1BCFNEXNSZ1D1Q2ZDF1FCDCQGTFDBELRTTXCB0A&v=20190505&";
// Yelp Authentication
var yelp_key = "rBj-CkCKNRMa4bL-mogTgo90v05i1D2OnyWwMQDKA4tJd_hbXt3qgWpDPBtknQAVLBNOnaUCz58uiO6DXTow0aeZDeomeok1OXLA59dbebJknF86TyQoKw_ae4JhXXYx";
//==========================================================================================================================================
// DIRECTIONS API
// URI's
// Directions Request
var directionsRequest = "https://maps.googleapis.com/maps/api/directions/json?key="+google_project_key+"&";// + Parameters
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

//Snap to Road
var snapRequest = "https://roads.googleapis.com/v1/snapToRoads?key=" + google_project_key +"&path="; // + Points  lat,lng|lat,lng
//==========================================================================================================================================
// PLACES API
// Nearby Search
var nearbyRequest = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?key="+google_project_key+"&radius=" +searchRadius +"&";// + Parameters
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

// Details request for address
var placeAddressRequest = "https://maps.googleapis.com/maps/api/place/details/json?key=" + google_project_key + "&fields=formatted_address" + "&placeid=";
/* Required Parameters:
 - key: Applications API key, already included in variable
 - placeid: Google's unique identifier for a place, parameter already declared, just add the id to the end of the string for a useable URL

 Optional:
  - fields: which details to be returned, set to formatted address for the scope of the application
*/

// Place Search request
var placeSearchRequest = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json?key=" + google_project_key + "&fields=formatted_address,place_id,rating,price_level,user_ratings_total,name&";
/* Required Parameters:
  - key: API key, already included in var
  - input: name, address, phone number etc. to search for
  - inputtype: one of
    - textquery
    - phonenumber (must be in international format)

  Optional:
  - fields: which fields to return about the place
  - location: lat,lng
*/

//==========================================================================================================================================
// FOURSQUARE API
// URI's
// Foursquare Venue Details Request
var foursquareDetailsRequest = "https://api.foursquare.com/v2/venues/XXIDXX?" + foursquareCredentials;

// Foursquare Venue Search Search Request
var foursquareVenueSearch = "https://api.foursquare.com/v2/venues/search?" + foursquareCredentials;

//==========================================================================================================================================
// YELP API
// Match Request
var yelpMatchRequest = "https://api.yelp.com/v3/businesses/matches";

// Details request
var yelpDetailsRequest = "https://api.yelp.com/v3/businesses/";




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
  var response = UrlFetchApp.fetch(url);
  var fPlace = JSON.parse(response.getContentText());
  return fPlace.response.venues[0].id;
}

function testFsId(){
  var test = testPlaceInfo();
  var result = getFoursquareId(test[0]);
  return [result, test[0]];
}

function getFoursquareDetails(id){
  var url = foursquareDetailsRequest.replace('XXIDXX',id);
  var response = UrlFetchApp.fetch(url);
  var details = JSON.parse(response.getContentText());
  return details;
}

function testDetails(){
  id = testFsId()
  var test = getFoursquareDetails(id[0]);
  return [test, id[1]]
}

// JSON ---> JSON
// Take foursquare venue details and return an object containing the name, rating details, and price
function foursquareRating(details){
  temp = {}
  temp.name = details.response.venue.name;
  temp.rating = details.response.venue.rating;
  temp.ratingSignals = details.response.venue.ratingSignals;
  temp.price = details.response.venue.price.tier;
  return temp;
}

function testFsRating(){
  var details = testDetails();
  var result = foursquareRating(details[0]);
  Logger.log(details[1]);
  Logger.log(result);
  return result;
}

// String ---> {street:str, city:str, state:str, country:str}
function getAddressComponents(formatted){
  comps = formatted.split(",");
  for(i = 0; i<comps.length;i++){
    comps[i] = comps[i].trim();
  }
  temp = {};
  temp.street = comps[0];
  temp.city = comps[1];
  temp.state = comps[2].substring(0,2);
  temp.country = comps[3].substring(0,2);
  return temp;
}

// {name:str, address:str} ---> JSON
// Get yelp business details from a name and address and return the yelpID
function yelpMatchID(details){
  var url = yelpMatchRequest + "?";
  var loc = getAddressComponents(details.address);
  url += "name=" + details.name;
  url += "&address1=" + loc.street;
  url += "&city=" + loc.city;
  url += "&state=" + loc.state;
  url += "&country=" + loc.country;
  var authHeader = "Bearer " + yelp_key;
  var options = {headers: {Authorization: authHeader}}
  var response = UrlFetchApp.fetch(url, options);
  var info = JSON.parse(response.getContentText());
  return info.businesses[0].id;
}

function testYelpMatchID(){
  var place = testPlaceInfo()[0];
  var address = getFormattedAddressByID(place.place_id);
  details = {};
  details.name = place.name;
  details.address = address;
  var test = yelpMatchID(details);
  Logger.log(test);
  return test;
}

// String ---> String
// Take a google place ID and return the formatted address of the place
function getFormattedAddressByID(id){
  var url = placeAddressRequest + id;
  var response = UrlFetchApp.fetch(url);
  var json = JSON.parse(response.getContentText());
  return json.result.formatted_address;
}

function testAddressByID(){
  var info = testPlaceInfo();
  //Logger.log(info);
  var test = getFormattedAddressByID(info[0].place_id);
  //Logger.log(test);
  return test;
}

// String ---> {name:str, price:int(1-4), rating:float(1-5), review_count:int}
// Return price and rating info from yelp by a yelp id
function getYelpRating(id){
  var url = yelpDetailsRequest + id;
  var authHeader = "Bearer " + yelp_key;
  var options = {headers: {Authorization: authHeader}}
  var response = UrlFetchApp.fetch(url, options);
  var info = JSON.parse(response.getContentText());
  temp = {};
  temp.name = info.name;
  temp.price = info.price.length;
  temp.rating = info.rating;
  temp.review_count = info.review_count;
  return temp;
}

function testYelpRating(){
  var id = testYelpMatchID();
  var test = getYelpRating(id);
  Logger.log(test);
  return test;
}
