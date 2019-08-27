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

// String String ---> {name:{rating:float, rating_count:int, price:int, id:str}}
// Get atmosphere info for a place from google by its name and nearby lat long
function googleRatingsByNameAndLocation(name, location){
  var url = placeSearchRequest + "input=" + name + "&inputtype=textquery&locationbias=point:" + location;

  // API CALL
  var response = UrlFetchApp.fetch(url);

  var json = JSON.parse(response.getContentText());
  var temp = {};
  Logger.log(json);
  var details = json.candidates[0];
  if(json.status != "ZERO_RESULTS"){
    if(details.formatted_address != undefined){
      temp.address = details.formatted_address;
    }
    if(details.rating != undefined){
      temp.rating = details.rating;
    }
    if(details.user_ratings_total != undefined){
      temp.rating_count = details.user_ratings_total;
    }
    if(details.place_id != undefined){
      temp.id = details.place_id;
    }
    if(details.price_level != undefined){
      temp.price = details.price_level;
    }
  }else{
    Logger.log("Google returned zero results!");
    return "NONE";
  }
  return temp;
}

function testGoogleRatingsByNameAndLocation(){
  var test = googleRatingsByNameAndLocation("The Star on Grand", "37.811527,-122.238814")
  Logger.log(test);
  return test;
}

// String ---> String
// Take a google place ID and return the formatted address of the place
function googleFormattedAddressByID(id){
  var url = placeAddressRequest + id;

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
  var url = nearbyRequest + "location="+coordinates+"&keyword="+keywords+"&type="+type;

  // API CALL
  var response = JSON.parse(UrlFetchApp.fetch(url).getContentText());

  return response;
}

function testNearby(){
  var test = nearbySearch("37.811410,-122.238268","pizza","restaurant");
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
//======================================================================================================================
// FOURSQUARE FUNCTIONS

// String String ---> String
// Gets the Foursquare ID of a place from name and lat,lng
function foursquareIDbyNameAndLocation(name, location){
  var url = foursquareVenueSearch + "query=" + name + "&ll=" + location + "&intent=checkin";

  // API CALL
  var response = UrlFetchApp.fetch(url);

  var fPlace = JSON.parse(response.getContentText());
  return fPlace.response.venues[0].id;
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
  return details;
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
  }
  if(details.response.venue.rating != undefined){
    temp.rating = details.response.venue.rating;
  }
  if(details.response.venue.ratingSignals != undefined){
    temp.rating_count = details.response.venue.ratingSignals;
  }
  if(details.response.venue.price != undefined){
    temp.price = details.response.venue.price.tier;
  }
  if(details.response.venue.id != undefined){
    temp.id = details.response.venue.id;
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
function getAddressComponents(formatted){
  comps = formatted.split(",");
  for(i = 0; i<comps.length;i++){
    comps[i] = comps[i].trim();
  }
  var temp = {};
  temp.street = comps[0];
  temp.city = comps[1];
  temp.state = comps[2].substring(0,2);
  temp.country = comps[3].substring(0,2);
  return temp;
}

// String String ---> JSON
// Get yelp business details from a name and address and return the yelpID
function yelpIDByNameAndAddress(name, address){
  var url = yelpMatchRequest + "?";
  var loc = getAddressComponents(address);
  url += "name=" + name;
  url += "&address1=" + loc.street;
  url += "&city=" + loc.city;
  url += "&state=" + loc.state;
  url += "&country=" + loc.country;
  var authHeader = "Bearer " + yelp_key;
  var options = {headers: {Authorization: authHeader}}

  // API CALL
  var response = UrlFetchApp.fetch(url, options);
  var info = JSON.parse(response.getContentText());
  return info.businesses[0].id;
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
  }
  if(info.price != undefined){
    temp.price = info.price.length;
  }
  if(info.rating != undefined){
    temp.rating = info.rating;
  }
  if(info.review_count != undefined){
    temp.rating_count = info.review_count;
  }
  if(info.id != undefined){
    temp.id = id;
  }
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
  var fs_id = foursquareIDbyNameAndLocation(name, location);
  var fs_details = foursquareDetailsByID(fs_id);
  var foursquare = foursquareRatingByDetails(fs_details);
  // Yelp
  var yelp_id = yelpIDByNameAndAddress(name, google.address, location);
  var yelp = yelpRatingByID(yelp_id);
  temp.address = google.address;
  delete google.address;
  temp.google = google;
  temp.yelp = yelp;
  temp.foursquare = foursquare;
  return temp;
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
    total_count += ratings[source].rating_count;
    total_score += ratings[source].rating_count * ((ratings[source].rating-1)/max_ratings[source]);
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
