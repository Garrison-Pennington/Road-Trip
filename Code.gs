var searchRadius = 11000;
var waypointSpacing = searchRadius*1.25;
var maxWaypointSpacing = waypointSpacing*1.25;
var country_codes = {};
country_codes["United States"] = "US";
country_codes["USA"] = "US";
country_codes["Canada"] = "CA";
country_codes["Colombia"] = "CO";
var state_codes = {};
state_codes["Antioquia"] = "ANT";
var yelp_supported_countries = ["US","CA"];

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
var placeDetailsRequest = "https://maps.googleapis.com/maps/api/place/details/json?key=" + google_project_key + "&placeid=";
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
  - locationbias: point:lat,lng
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
//======================================================================================================================
// FUNCTIONS
//======================================================================================================================
// GOOGLE FUNCTIONS

// String String ---> {name:{rating:float, rating_count:int, price:int, id:str}} OR ""
// Get atmosphere info for a place from google by its name and nearby lat long
function googleRatingsByNameAndLocation(name, location){
  var url = placeSearchRequest + "input=" + name + "&inputtype=textquery&locationbias=point:" + location;

  // API CALL
  var response = UrlFetchApp.fetch(url);

  var json = JSON.parse(response.getContentText());
  var temp = {};
  var details = json.candidates[0];

  if(json.status != "ZERO_RESULTS"){
    if(details.formatted_address != undefined){
      temp.address = details.formatted_address;
    }else{
      temp.address = "";
    }
    if(details.rating != undefined){
      temp.rating = details.rating;
    }else{
      temp.rating = "";
    }
    if(details.user_ratings_total != undefined){
      temp.rating_count = details.user_ratings_total;
    }else{
      temp.rating_count = "";
    }
    if(details.place_id != undefined){
      temp.id = details.place_id;
    }else{
      temp.id = "";
    }
    if(details.price_level != undefined){
      temp.price = details.price_level;
    }else{
      temp.price = "";
    }
  }else{
    Logger.log("Google returned zero results!");
    return "";
  }
  return temp;
}

function testGoogleRatingsByNameAndLocation(){
  var test = googleRatingsByNameAndLocation("The Star on Grand", "37.811527,-122.238814")
  Logger.log(test);
  return test;
}

function googleIDByCityAndState(city, state){
  var url = placeSearchRequest + "input=" + city + "," + state + "&inputtype=textquery";

  // API CALL
  var response = UrlFetchApp.fetch(url);

  var json = JSON.parse(response.getContentText());

  return json.candidates[0].place_id;
}

function testGoogleIDByCityAndState(){
  var test1 = googleIDByCityAndState("Oakland", "CA");
  var test2 = googleIDByCityAndState("San Diego", "CA");
  var test3 = googleIDByCityAndState("New York", "NY");

  Logger.log(test1);
  Logger.log(test2);
  Logger.log(test3);

  return test1
}


function googleCoorsByID(id){
  var url = placeDetailsRequest + id;

  // API CALL
  var response = UrlFetchApp.fetch(url);

  var json = JSON.parse(response.getContentText());

  var coors = json.result.geometry.location;
  return coors.lat + "," + coors.lng;
}

function testGoogleCoorsByID(){
  var test = googleCoorsByID(testGoogleIDByCityAndState());
  Logger.log(test);
  return test;
}

// String ---> String
// Take a google place ID and return the formatted address of the place
function googleFormattedAddressByID(id){
  var url = placeDetailsRequest + id + "&fields=formatted_address";

  // API CALL
  var response = UrlFetchApp.fetch(url);

  var json = JSON.parse(response.getContentText());
  return json.result.formatted_address;
}

function testGoogleFormattedAddressByID(){
  var info = testPlaceInfo();
  //Logger.log(info);
  var test = googleFormattedAddressByID(info[0].place_id);
  //Logger.log(test);
  return test;
}


// Location String String ---> JSON
// Searches near given coordinates for places of a given type related to the keywords and returns all results
function nearbySearch(coordinates,keywords,type){
  var url = nearbyRequest + "location="+coordinates+"&keyword="+keywords+"&type="+type+"&radius="+searchRadius;

  // API CALL
  var response = JSON.parse(UrlFetchApp.fetch(url).getContentText());

  return response;
}

function testNearby(){
  var test = nearbySearch("37.811410,-122.238268","pizza","restaurant");
  //Logger.log(test);
  return test.results;
}

// JSON ---> JSON
// Filter out results with low ratings and review counts
function filterResultsByRating(results){
  var temp = {}
  for(var r in results){
    if(results[r].user_ratings_total > 10){
      if(results[r].rating >= 4.5){
        temp[r] = results[r];
  }}}
  return temp;
}

function googleRatingsAndAddressByNearbyResults(results){
  var temp = {};
  for(var i = 0; i < results.length; i++){
    var r = results[i];
    var address = googleFormattedAddressByID(r.place_id);
    temp[r.name] = {};
    if(address != undefined){
      temp[r.name].address = address;
    }else{
      temp[r.name].address = "";
    }
    if(r.rating != undefined){
      temp[r.name].rating = r.rating;
    }else{
      temp[r.name].rating = "";
    }
    if(r.user_ratings_total != undefined){
      temp[r.name].rating_count = r.user_ratings_total;
    }else{
      temp[r.name].rating_count = "";
    }
    if(r.place_id != undefined){
      temp[r.name].id = r.place_id;
    }else{
      temp[r.name].id = "";
    }
    if(r.price_level != undefined){
      temp[r.name].price = r.price_level;
    }else{
      temp[r.name].price = "";
    }
    if(r.geometry.location != undefined){
      temp[r.name].location = r.geometry.location.lat + "," + r.geometry.location.lng;
    }else{
      temp[r.name].location = "";
    }
    temp[r.name].name = r.name;
  }
  return temp;
}

function testGoogleRatingsAndAddressByNearbyResults(){
  var test = googleRatingsAndAddressByNearbyResults(testNearby());
  Logger.log(test);
  return test;
}
//======================================================================================================================
// FOURSQUARE FUNCTIONS

// String String ---> String
// Gets the Foursquare ID of a place from name and lat,lng
function foursquareIDbyNameAndLocation(name, location){
  var url = foursquareVenueSearch + "query=" + name + "&ll=" + location + "&intent=checkin";

  // API CALL
  var response = UrlFetchApp.fetch(url);

  var fPlace = JSON.parse(response.getContentText());
  if(fPlace.response.venues[0] != undefined){
    return fPlace.response.venues[0].id;
  }else{
    return "";
  }
}

function testFoursquareIDbyNameAndLocation(){
  var test = testPlaceInfo()[0];
  var name = test.name;
  var location = test.location.lat + "," + test.location.lng;
  var result = foursquareIDbyNameAndLocation(name, location);
  return [result, test];
}

// String ---> JSON
// Gets the foursquare api details of a place from its FSID
function foursquareDetailsByID(id){
  var url = foursquareDetailsRequest.replace('XXIDXX',id);

  // API CALL
  var response = UrlFetchApp.fetch(url);

  var details = JSON.parse(response.getContentText());
  if(details != undefined){
    return details;
  }else{
    return "";
  }
}

function testFoursquareDetailsByID(){
  var id = testFoursquareIDbyNameAndLocation();
  var test = foursquareDetailsByID(id[0]);
  return [test, id[1]]
}

// JSON ---> JSON
// Take foursquare venue details and return an object containing the name, rating details, and price
function foursquareRatingByDetails(details){
  var temp = {};
  if(details.response.venue.name != undefined){
    temp.name = details.response.venue.name;
  }else{
    temp.name = "";
  }
  if(details.response.venue.rating != undefined){
    temp.rating = details.response.venue.rating;
  }else{
    temp.rating = "";
  }
  if(details.response.venue.ratingSignals != undefined){
    temp.rating_count = details.response.venue.ratingSignals;
  }else{
    temp.rating_count = "";
  }
  if(details.response.venue.price != undefined){
    temp.price = details.response.venue.price.tier;
  }else{
    temp.price = "";
  }
  if(details.response.venue.id != undefined){
    temp.id = details.response.venue.id;
  }else{
    temp.id = "";
  }
  if(details.response.venue.location != undefined){
    temp.address = details.response.venue.location.address + "," + details.response.venue.location.city + "," + details.response.venue.location.state + "," + details.response.venue.location.cc;
  }else{
    temp.id = "";
  }
  return temp;
}

function testFoursquareRatingByDetails(){
  var details = testDetails();
  var result = foursquareRatingByDetails(details[0]);
  Logger.log(details[1]);
  Logger.log(result);
  return result;
}
//======================================================================================================================
// YELP FUNCTIONS

// String ---> {street:str, city:str, state:str, country:str}
// Take a formatted address and break it down into its components and return them in an object
function getAddressComponents(formatted){
  var regex = /#/gi;
  formatted = formatted.replace(regex,"");
  var comps = formatted.split(",");
  if(isOnlyNumber(comps[0])){
   formatted = formatted.replace(",","");
    comps = formatted.split(",");
  }
  while(comps.length > 4){
    formatted = formatted.replace(",","");
    comps = formatted.split(",");
  }
  for(i = 0; i<comps.length;i++){
    comps[i] = comps[i].trim();
  }
  var temp = {};
  temp.street = comps[0];
  temp.city = comps[1];
  if(comps[2].length > 2){
    temp.state = state_codes[comps[2]];
  }else{
    temp.state = comps[2].substring(0,2);
  }
  if(comps[3].length > 3){
    temp.country = country_codes[comps[3]];
  }else{
    temp.country = comps[3].substring(0,2);
  }
  if(temp.country == "US" || temp.country == "CA"){
    temp.state = comps[2].substring(0,2);
  }
  return temp;
}

function isOnlyNumber(address){
  var nums_and_syms = "0123456789- "
  for(var i = 0; i < address.length; i++){
    if(nums_and_syms.indexOf(address[i]) == -1){
      return false;
    }
  }
  return true;
}

// String String ---> JSON
// Get yelp business details from a name and address and return the yelpID
function yelpIDByNameAndAddress(name, address){
  var url = yelpMatchRequest + "?";
  var loc = getAddressComponents(address);
  if(yelp_supported_countries.indexOf(loc.country) != -1){
    url += "name=" + name;
    url += "&address1=" + loc.street;
    url += "&city=" + loc.city;
    url += "&state=" + loc.state;
    url += "&country=" + loc.country;
    Logger.log(url)
    var authHeader = "Bearer " + yelp_key;
    var options = {headers: {Authorization: authHeader}}

    // API CALL
    var response = UrlFetchApp.fetch(url, options);
    var info = JSON.parse(response.getContentText());
    if(info.businesses[0] != undefined){
      return info.businesses[0].id;
    }else{
      return "";
    }
  }else{
    return "Unsupported country";
  }
}

function testYelpIDByNameAndAddress(){
  var place = testPlaceInfo()[0];
  var address = googleFormattedAddressByID(place.place_id);
  var test = yelpIDByNameAndAddress(place.name, address);
  Logger.log(test);
  return test;
}

// String ---> {name:str, price:int(1-4), rating:float(1-5), review_count:int}
// Return price and rating info from yelp by a yelp id
function yelpRatingByID(id){
  // API URL
  var url = yelpDetailsRequest + id;
  var authHeader = "Bearer " + yelp_key;
  var options = {headers: {Authorization: authHeader}}

  // API CALL
  var response = UrlFetchApp.fetch(url, options);

  var info = JSON.parse(response.getContentText());
  var temp = {};

  if(info.name != undefined){
    temp.name = info.name;
  }else{
    temp.name = "";
  }

  if(info.price != undefined){
    temp.price = info.price.length;
  }else{
    temp.price = "";
  }

  if(info.rating != undefined){
    temp.rating = info.rating;
  }else{
    temp.rating = "";
  }

  if(info.review_count != undefined){
    temp.rating_count = info.review_count;
  }else{
    temp.rating_count = "";
  }
  temp.id = id;
  return temp;
}

function testYelpRatingByID(){
  var id = testYelpIDByNameAndAddress();
  var test = yelpRatingByID(id);
  Logger.log(test);
  return test;
}
//======================================================================================================================


// String String ---> JSON
// Return ratings from Google, Foursquare, and Yelp given a name and location
function allRatingsByNameAndLocation(name, location){
  var temp = {};
  temp.name = name;
  temp.location = location;
  // Google
  var google = googleRatingsByNameAndLocation(name, location);
  // Foursquare
  var foursquare = {};
  var fs_id = foursquareIDbyNameAndLocation(name, location);
  if(fs_id != ""){
    var fs_details = foursquareDetailsByID(fs_id);
    if(fs_details != ""){
      var foursquare = foursquareRatingByDetails(fs_details);
    }
  }
  // Yelp
  var yelp = {};
  var country = google.address.split(",").pop().trim();
  if(yelp_supported_countries.indexOf(country_codes[country]) != -1){
    if(google != "" && google.address != ""){
      var yelp_id = yelpIDByNameAndAddress(name, google.address);
      if(yelp_id != "Unsupported country"){
        var yelp = yelpRatingByID(yelp_id);
      }
      temp.address = google.address;
      delete google.address;
    }else if(foursquare != "" && foursquare.address != ""){
      var yelp_id = yelpIDByNameAndAddress(name, foursquare.address);
      if(yelp_id != "Unsupported country"){
        var yelp = yelpRatingByID(yelp_id);
      }
    }else{
      var yelp = "";
    }
  }
  temp.yelp = yelp;
  temp.google = google;
  temp.foursquare = foursquare;
  return temp;
}


function allRatingsFromGoogleRating(data){
  var temp = {};
  temp.name = data.name.replace("|","");
  temp.location = data.location;
  var google = data;
  delete google.location;
  // Foursquare
  var foursquare = {};
  var fs_id = foursquareIDbyNameAndLocation(temp.name, temp.location);
  if(fs_id != ""){
    var fs_details = foursquareDetailsByID(fs_id);
    if(fs_details != ""){
      var foursquare = foursquareRatingByDetails(fs_details);
    }
  }
  // Yelp
  Logger.log(temp.name);
  Logger.log(google.address);
  var yelp = {};
  var country = google.address.split(",").pop().trim();;
  var cc = country_codes[country];
  if(yelp_supported_countries.indexOf(cc) != -1){
    if(google != "" && google.address != ""){
      var yelp_id = yelpIDByNameAndAddress(temp.name, google.address);
      if(yelp_id != "Unsupported country"){
        var yelp = yelpRatingByID(yelp_id);
      }
      temp.address = google.address;
      delete google.address;
    }else if(foursquare != "" && foursquare.address != ""){
      var yelp_id = yelpIDByNameAndAddress(temp.name, foursquare.address);
      if(yelp_id != "Unsupported country"){
        var yelp = yelpRatingByID(yelp_id);
      }
    }
  }
  temp.yelp = yelp;
  temp.google = google;
  temp.foursquare = foursquare;
  return temp;
}

function testAllRatingsFromGoogleRating(){
  var results = testGoogleRatingsAndAddressByNearbyResults();
  var t_name = "";
  for(k in results){
    t_name = k;
    break;
  }
  var test = allRatingsFromGoogleRating(results[t_name]);
  Logger.log(test);
  return test;
}

function testAllRatingsByNameAndLocation(){
  var test = allRatingsByNameAndLocation("The Star on Grand", "37.811527,-122.238814");
  //Logger.log(test);
  return test;
}

// JSON ListOf:String ---> {rating:float, count:int}
// Return the aggregate score of a place from all its review sources
function aggregateRating(ratings, sources){
  if (sources === undefined){
    sources = ["yelp","google","foursquare"];
  }
  var max_ratings = {};
  max_ratings.google = 4;
  max_ratings.foursquare = 9;
  max_ratings.yelp = 4;
  var total_count = 0;
  var total_score = 0;
  for(var s = 0; s < sources.length; s++){
    var source = sources[s];
    total_count += (ratings[source].rating_count ? ratings[source].rating_count : 0);
    total_score += (ratings[source].rating_count ? ratings[source].rating_count * ((ratings[source].rating-1)/max_ratings[source]) : 0);
  }
  var temp = {};
  temp.rating = (total_score/total_count) * 100;
  temp.rating_count = total_count;
  return temp;
}

function testAggregateRating(){
  var ratings = testAllRatingsByNameAndLocation();
  var score = aggregateRating(ratings);
  Logger.log(ratings.name + ": " + score.rating +"/100 out of " + score.rating_count +" reviews");
  return score;
}

// Take Names and Locations from the Active sheet and insert their reviews
function reviewPlacesInSheet(){
  var sheet = SpreadsheetApp.getActiveSheet();
  var data = sheet.getDataRange().getValues();
  for(var i = 1; i< data.length + 1; i++){
    if(typeof data[i][4] == "number"){

    }else{
      var name = data[i][0];
      var location = data[i][2];
      var reviews = allRatingsByNameAndLocation(name, location);
      // Google Ratings
      sheet.getRange(i+1, 6).setValue(reviews.google.rating);
      sheet.getRange(i+1, 7).setValue(reviews.google.rating_count);
      // Foursquare Ratings
      sheet.getRange(i+1, 8).setValue(reviews.foursquare.rating);
      sheet.getRange(i+1, 9).setValue(reviews.foursquare.rating_count);
      // Yelp Ratings
      sheet.getRange(i+1, 10).setValue(reviews.yelp.rating);
      sheet.getRange(i+1, 11).setValue(reviews.yelp.rating_count);
      // Aggregate
      agg = aggregateRating(reviews);
      sheet.getRange(i+1, 4).setValue(agg.rating);
      sheet.getRange(i+1, 5).setValue(agg.rating_count);
    }
  }
}

function addDiscoveriesToSheet(ratings, city, query){
  if(city == undefined){
    city = "";
  }
  if(query == undefined){
    query = "none";
  }
  var sheet = SpreadsheetApp.getActiveSheet();
  var data = sheet.getDataRange().getValues();
  for(var i in ratings){
    var r = ratings[i];
    var row = [];
    row.push(r.name);
    row.push(city);
    row.push(r.location);
    var agg = aggregateRating(r);
    row.push(agg.rating);
    row.push(agg.rating_count);
    row.push(r.google.rating);
    row.push(r.google.rating_count);
    row.push(r.foursquare.rating);
    row.push(r.foursquare.rating_count);
    row.push(r.yelp.rating);
    row.push(r.yelp.rating_count);
    row.push(query);
    sheet.appendRow(row);
  }
}

function discoverFood(city, state, query){
  if(query == undefined){
    query = "";
  }
  // Get the place_id of the City
  var google_id = googleIDByCityAndState(city, state);

  // Get the coordinates of the city from the place_id
  // API CALL
  var coors = googleCoorsByID(google_id)  ;

  var nearby = nearbySearch(coors, query, "restaurant").results;

  var google_ratings = googleRatingsAndAddressByNearbyResults(nearby);

  var all_ratings = allFromGoogleForMultiple(google_ratings);

  addDiscoveriesToSheet(all_ratings, city, query);
}

function testDiscover(){
  //discoverFood("Oakland", "CA", "chicken and waffles");
  //discoverFood("Oakland", "CA", "mexican");
  //discoverFood("Oakland", "CA", "indian");
  //discoverFood("Oakland", "CA", "sushi");
  //discoverFood("San Diego", "CA", "");
  //discoverFood("Vancouver", "BC", "tacos");
  //discoverFood("Medellin", "CO", "chicken and waffles");
  //discoverFood("Medellin", "CO", "mexican");
  //discoverFood("Medellin", "CO", "indian");
  //discoverFood("Medellin", "CO", "thai");
  //discoverFood("Medellin", "CO", "sushi");
  //discoverFood("Vancouver", "BC", "chicken and waffles");
  //discoverFood("Vancouver", "BC", "mexican");
  //discoverFood("Vancouver", "BC", "indian");
  //discoverFood("Vancouver", "BC", "thai");
  //discoverFood("Vancouver", "BC", "vegetarian");
  discoverFood("Vancouver", "BC", "shakshuka");
}


function allFromGoogleForMultiple(ratings){
  var temp = {};
  for(var k in ratings){
    temp[k] = allRatingsFromGoogleRating(ratings[k]);
  }
  return temp;
}
