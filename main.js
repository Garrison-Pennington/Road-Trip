const fetch = require('node-fetch');
const fs = require('fs');

var searchRadius = 11000;
var waypointSpacing = searchRadius*1.25;
var maxWaypointSpacing = waypointSpacing*1.25;
var country_codes = {
  'United States': "US",
  'USA': "US",
  'Canada': "CA",
  'Colombia': "CO"
};
var state_codes = {
  'Antioquia': "ANT"
};
var yelp_supported_countries = ["US","CA"];
const results_per_page = 8;

// *** APIs ***
// Google Authentication
const google_project_key = "AIzaSyBnWnCJha6_cQE_PTzVBUpqsH5gzkbvUuE";
// Foursquare Authentication and version
const foursquareCredentials = "client_id=VGOXMO5JN5KMAEA30G1ZXZPZULAIPQ2MG3WS3NRHS2E52YYE&client_secret=HF4AHPPFI1BCFNEXNSZ1D1Q2ZDF1FCDCQGTFDBELRTTXCB0A&v=20190505&";
// Yelp Authentication
const yelp_key = "rBj-CkCKNRMa4bL-mogTgo90v05i1D2OnyWwMQDKA4tJd_hbXt3qgWpDPBtknQAVLBNOnaUCz58uiO6DXTow0aeZDeomeok1OXLA59dbebJknF86TyQoKw_ae4JhXXYx";
//==========================================================================================================================================
// DIRECTIONS API
// URI's
// Directions Request
const directionsRequest = "https://maps.googleapis.com/maps/api/directions/json?key="+google_project_key+"&";// + Parameters
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
const snapRequest = "https://roads.googleapis.com/v1/snapToRoads?key=" + google_project_key +"&path="; // + Points  lat,lng|lat,lng
//==========================================================================================================================================
// PLACES API
// Nearby Search
const nearbyRequest = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?key="+google_project_key+"&radius=" +searchRadius +"&";// + Parameters
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

// Nearby Search Returns
/* JSON
  {
    html_attributions : [],       JSON.html_attributions
    next_page_token: string       JSON.next_page_token
    status: string,               JSON.status
    results: [],                  JSON.results
      results[i]: {               JSON.results[i]
        geometry: {               JSON.results[i].geometry
          location: {             JSON.results[i].geometry.location
            lat: double,          JSON.results[i].geometry.location.lat
            lng: double           JSON.results[i].geometry.location.lng
          } CLOSE location
        }, CLOSE geometry
        icon : string(url for .png),  JSON.results[i].icon
        id: string,                   JSON.results[i].id
        name: string,                 JSON.results[i].name
        opening_hours: {              JSON.results[i].opening_hours
          open_now: boolean           JSON.results[i].opening_hours.open_now
        }, CLOSE opening_hours
        photos : []                   JSON.results[i].photos
          photos[i]: {                JSON.results[i].photos[i]
            height: int,              JSON.results[i].photos[i].height
            html_attributions: [],    JSON.results[i].photos[i].html_attributions
            photo_reference: string,  JSON.results[i].photos[i].photo_reference
            width: int                JSON.results[i].photos[i].width
          } CLOSE photos[i]
        place_id: string,         JSON.results[i].place_id
        reference: string,        JSON.results[i].reference
        types: []                 JSON.results[i].types
          types[i]: string        JSON.results[i].types[i]
        vicinity: string          JSON.results[i].vicinity
      } CLOSE results[i]
  } CLOSE JSON
*/

// Details request for address
const placeDetailsRequest = "https://maps.googleapis.com/maps/api/place/details/json?key=" + google_project_key + "&placeid=";
/* Required Parameters:
 - key: Applications API key, already included in variable
 - placeid: Google's unique identifier for a place, parameter already declared, just add the id to the end of the string for a useable URL

 Optional:
  - fields: which details to be returned, set to formatted address for the scope of the application
*/

// Place Search request
const placeSearchRequest = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json?key=" + google_project_key + "&fields=formatted_address,place_id,rating,price_level,user_ratings_total,name&";
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
const foursquareDetailsRequest = "https://api.foursquare.com/v2/venues/XXIDXX?" + foursquareCredentials;

// Foursquare Venue Search Search Request
const foursquareVenueSearch = "https://api.foursquare.com/v2/venues/search?" + foursquareCredentials;

//==========================================================================================================================================
// YELP API
// Match Request
const yelpMatchRequest = "https://api.yelp.com/v3/businesses/matches";

// Details request
const yelpDetailsRequest = "https://api.yelp.com/v3/businesses/";
//======================================================================================================================
// FUNCTIONS
//======================================================================================================================
// GOOGLE FUNCTIONS

// String String ---> String
// Get the Google place_id of a given City
function googleIDByCityAndState(city, state){
  var url = proxyurl + placeSearchRequest + "input=" + city + "," + state + "&inputtype=textquery";

  // API CALL
  const response = fetch(url).then(response => {
    return response.json()
  }).then(data => {
    return data.candidates[0].place_id;
  }).catch(err => {
    console.log("ERROR: " + err);
  });
  return response;
}

async function testGoogleIDByCityAndState(){
  var test1 = await googleIDByCityAndState("Oakland", "CA");
  var test2 = await googleIDByCityAndState("San Diego", "CA");
  var test3 = await googleIDByCityAndState("New York", "NY");

  //console.log(test1);
  //console.log(test2);
  //console.log(test3);

  return test1;
}

// String ---> String
// Get the lat,lng coordinates of a location by it's place_id
function googleCoorsByID(id){
  var url = proxyurl + placeDetailsRequest + id;
  // API CALL
  var response = fetch(url).then(response => {
    return response.json();
  }).then(data => {
    var coors = data.result.geometry.location;
    return coors.lat + "," + coors.lng;
  }).catch(err => {
    console.log("googleCoorsByID ERROR: " + err);
  });
  return response;
}

async function testGoogleCoorsByID(){
  var test_ID = await testGoogleIDByCityAndState();
  var test = await googleCoorsByID(test_ID);
  console.log(test);
  return test;
}

// string ---> String
// Take a google place ID and return the formatted address of the place
function googleFormattedAddressByID(id){
  var url = proxyurl + placeDetailsRequest + id + "&fields=formatted_address";

  // API CALL
  var response = fetch(url).then(response => {
    return response.json();
  }).then(data => {
    return data.result.formatted_address;
  });
  return response;
}

async function testGoogleFormattedAddressByID(){
  var info = await testGoogleRatingsByNameAndLocation();
  //console.log(info);
  var test = await googleFormattedAddressByID(info.id);
  //console.log(test);
  return test;
}

// String String ---> {name:{rating:float, rating_count:int, price:int, id:str}} OR ""
// Get atmosphere info for a place from google by its name and nearby lat long
function googleRatingsByNameAndLocation(name, location){
  var url = proxyurl + placeSearchRequest + "input=" + name + "&inputtype=textquery&locationbias=point:" + location;
  // API CALL
  const rating = fetch(url).then(response => {
    return response.json();
  }).then(data => {
    var details = data.candidates[0];
    //console.log(details);
    var temp = {};
    if(data.status != "ZERO_RESULTS"){
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
      console.log("Google returned zero results!");
      return "";
    }
    return temp;
  }).catch(err => {
    console.log("ERROR: " + err);
  });
  return rating;
}

async function testGoogleRatingsByNameAndLocation(){
  var test = await googleRatingsByNameAndLocation("The Star on Grand", "37.811527,-122.238814");
  //console.log(test);
  return test;
}

// Location String String ---> NearbySearchResult
// Searches near given coordinates for places of a given type related to the keywords and returns all results
function googleNearbySearch(coordinates,keywords,type){
  var url = nearbyRequest + "location="+coordinates+"&keyword="+keywords+"&type="+type+"&radius="+searchRadius;
  // API CALL
  var response = fetch(url).then(response => response.json());
  return response;
}

async function testGoogleNearby(){
  var test = await googleNearbySearch("37.811410,-122.238268","pizza","restaurant");
  //console.log(test.results);
  return test.results;
}

// Array ---> JSON
// Return Google Ratings info and addresses from a list of Nearby Search Results
async function googleRatingsByNearbyResults(results){
  var temp = {};
  for(var i = 0; i < results.length; i++){
    var r = results[i];
    temp[r.name] = {};
    if(r.address != undefined){
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

async function testGoogleRatingsByNearbyResults(){
  var results = await testGoogleNearby();
  var test = await googleRatingsByNearbyResults(results);
  //console.log(test);
  return test;
}
//======================================================================================================================
// FOURSQUARE FUNCTIONS

// String String ---> JSON
// Get the Foursquare ratings of a venue from its name and location
async function foursquareRatingByNameAndLocation(name, location){
  var fs_rating = {};
  // Get Foursquare ID of venue
  var fs_id = await foursquareIDbyNameAndLocation(name, location);
  // Was the ID found?
  if(fs_id != ""){
    // Foursquare API details request using Foursquare ID
    var fs_details = await foursquareDetailsByID(fs_id);
    // Were there details for the ID?
    if(fs_details != ""){
      // Parse Details Request result for just ratings info
      fs_rating = foursquareRatingByDetails(fs_details);
    }else{
      console.log("FS Details not found");
    }
  }else{
    console.log("FS_ID not found");
  }
  // Return ratings info, will be empty if ID or details were not found
  return fs_rating;
}

// String String ---> String
// Gets the Foursquare ID of a place from name and lat,lng
function foursquareIDbyNameAndLocation(name, location){
  var url = proxyurl + foursquareVenueSearch + "query=" + name + "&ll=" + location + "&intent=checkin";
  // API CALL
  var response = fetch(url).then(response => {
    return response.json();
  }).then(data => {
    if(data.response.venues[0] != undefined){
      return data.response.venues[0].id;
    }else{
      return "";
    }
  }).catch(err => {
    console.log("foursquareIDbyNameAndLocation ERROR: " + err);
  });
  return response;
}

async function testFoursquareIDbyNameAndLocation(){
  var result = await foursquareIDbyNameAndLocation("The Star on Grand", "37.811527,-122.238814");
  //console.log(result);
  return result;
}

// String ---> JSON
// Gets the foursquare api details of a place from its FSID
function foursquareDetailsByID(id){
  var url = foursquareDetailsRequest.replace('XXIDXX',id);

  // API CALL
  var response = fetch(url).then(response => {
    return response.json();
  }).then(data =>{
    if(data != undefined){
      return data;
    }else{
      return "";
    }
  });
  return response;
}

async function testFoursquareDetailsByID(){
  var id = await testFoursquareIDbyNameAndLocation();
  var test = await foursquareDetailsByID(id);
  //console.log(test);
  return test;
}

function foursquareNearbySearch(query, location){
  var url = `${foursquareVenueSearch}query=${query}&ll=${location}&radius=${searchRadius}&intent=browse`;

  var response = fetch(url).then(response => {
    return response.json();
  }).catch(err => {
    console.log("foursquareNearbySearch ERROR: " + err);
  });

  return response;
}

async function testFoursquareNearbySearch(){
  var test = await foursquareNearbySearch("pizza", "37.811410,-122.238268");
  // console.log(test);
  // write to a new file named 2pac.txt
  // fs.writeFile('foursquareNearbySearch.txt', JSON.stringify(test), (err) => {
    // throws an error, you could also catch it here
    // if (err) throw err;

    // success case, the file was saved
    // console.log('response saved!');
  // });
  return test;
}

exports.test = async function(){await testFoursquareRatingsByNearbyResults();}

async function foursquareRatingsByNearbyResults(results){
  var venues = results.response.venues;
  var temp = {};
  for(var index in venues){
    var fs_id = venues[index].id;
    var name = venues[index].name;
    var ll = venues[index].location.lat + venues[index].location.lng;
    var fs_details = await foursquareDetailsByID(fs_id);
    var fs_ratings = foursquareRatingByDetails(fs_details);
    temp[name] = {
      id: fs_id,
      address: fs_ratings.address,
      location: ll,
      rating: fs_ratings.rating,
      rating_count: fs_ratings.rating_count,
      price: fs_ratings.price,
    };
  }
  return temp;
}

async function testFoursquareRatingsByNearbyResults(){
  var inp = await testFoursquareNearbySearch();
  var test = await foursquareRatingsByNearbyResults(inp);
  console.log(test);
  return test;
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

async function testFoursquareRatingByDetails(){
  var details = await testFoursquareDetailsByID();
  var result = foursquareRatingByDetails(details);
  //console.log(result);
  return result;
}
//======================================================================================================================
// YELP FUNCTIONS

// String String ---> JSON
// Get the Yelp Rating info of a business from it's name and address
async function yelpRatingsByNameAndAddress(name, address){
  var yelp_rating = {};
  // Get the Yelp ID of the business
  var yelp_id = await yelpIDByNameAndAddress(name, address);
  // Is the country Unsupported?
  if(yelp_id == "Unsupported Country"){
    console.log("Yelp does not support this Country");
  // Did Yelp not find a business?
  }else if(yelp_id == ""){
    console.log("Yelp couldn't find a business here");
  }else{
    // Get and parse the Yelp ratings info using the business ID
    var yelp_rating = await yelpRatingByID(yelp_id);
  }
  // Return the ratings info, empty if yelp couldn't find a business or the country is Unsupported
  return yelp_rating;
}

async function testYelpRatingsByNameAndAddress(){
  var test = await yelpRatingsByNameAndAddress("The Star", "3425 Grand Ave,Oaklanc,CA,US");
  console.log(test);
  return test;
}

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

// String ---> Boolean
// Return true if string contains only numbers, hyphens, and whitespace
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
  var url = proxyurl + yelpMatchRequest + "?";
  if(address == undefined){
    return "Unsupported country";
  }
  var loc = getAddressComponents(address);
  if(yelp_supported_countries.indexOf(loc.country) != -1){
    url += "name=" + name;
    url += "&address1=" + loc.street;
    url += "&city=" + loc.city;
    url += "&state=" + loc.state;
    url += "&country=" + loc.country;
    var authHeader = "Bearer " + yelp_key;
    var options = {headers: {Authorization: authHeader}}

    // API CALL
    var response = fetch(url, options).then(response => {
      return response.json();
    }).then(data => {
      if(data.businesses[0] != undefined){
        return data.businesses[0].id;
      }else{
        return "";
      }
    }).catch(err => {
      console.log("yelpIDByNameAndAddress ERROR: " + err);
    });
    return response;
  }else{
    return "Unsupported country";
  }
}

async function testYelpIDByNameAndAddress(){
  var test = await yelpIDByNameAndAddress("The Star", "3425 Grand Ave,Oakland,CA,US");
  //console.log(test);
  return test;
}

// String ---> {name:str, price:int(1-4), rating:float(1-5), review_count:int}
// Return price and rating info from yelp by a yelp id
function yelpRatingByID(id){
  // API URL
  var url = proxyurl + yelpDetailsRequest + id;
  var authHeader = "Bearer " + yelp_key;
  var options = {headers: {Authorization: authHeader}}

  // API CALL
  var response = fetch(url, options).then(response => {
    return response.json();
  }).then(data => {
    var temp = {};

    if(data.name != undefined){
      temp.name = data.name;
    }else{
      temp.name = "";
    }

    if(data.price != undefined){
      temp.price = data.price.length;
    }else{
      temp.price = "";
    }

    if(data.rating != undefined){
      temp.rating = data.rating;
    }else{
      temp.rating = "";
    }
    if(data.review_count != undefined){
      temp.rating_count = data.review_count;
    }else{
      temp.rating_count = "";
    }
    temp.id = id;
    return temp;
  }).catch(err => {
    console.log("yelpRatingByID ERROR: " + err);
  });
  return response;
}

async function testYelpRatingByID(){
  var id = await testYelpIDByNameAndAddress();
  var test = await yelpRatingByID(id);
  console.log(test);
  return test;
}
//======================================================================================================================

// String String String ---> JSON
// Return all ratings info for a place given it's name, city, and state
async function allRatingsByNameAndCityAndState(name, city, state){
  var google_id = await googleIDByCityAndState(city,state);
  var location = await googleCoorsByID(google_id);
  var results = await allRatingsByNameAndLocation(name, location);
  return results;
}

async function testAllRatingsByNameAndCityAndState(){
  var results = await allRatingsByNameAndCityAndState("The Star", "Oakland", "CA");
  //console.log(results);
  return results;
}

// String String ---> JSON
// Return ratings from Google, Foursquare, and Yelp given a name and location
async function allRatingsByNameAndLocation(name, location){
  var temp = {};
  temp.name = name;
  temp.location = location;
  // Google
  var google = await googleRatingsByNameAndLocation(name, location);
  // Foursquare
  var foursquare = await foursquareRatingByNameAndLocation(name, location);
  // Yelp
  var yelp = await yelpRatingsByNameAndAddress(name, google.address);

  temp.yelp = yelp;
  temp.google = google;
  temp.foursquare = foursquare;
  return temp;
}

async function testAllRatingsByNameAndLocation(){
  var test = await allRatingsByNameAndLocation("The Star on Grand", "37.811527,-122.238814");
  //console.log(test);
  return test;
}

// JSON ---> JSON
// Get ratings from all sources for ONE VENUE using its Google Rating
async function allRatingsFromGoogleRating(data){
  // Create empty object to hold ratings info
  var temp = {};
  // Set name to data.name with problem characters removed
  temp.name = data.name.replace("|","");
  temp.location = data.location;
  var google = data;
  delete google.location;
  // Foursquare
  var foursquare = {};
  // Get foursquare ID
  var fs_id = await foursquareIDbyNameAndLocation(temp.name, temp.location);
  // Does ID exist?
  if(fs_id != ""){
    // Get venue details by FSID
    var fs_details = await foursquareDetailsByID(fs_id);
    // Was the venue found?
    if(fs_details != ""){
      // Parse the details into rating info
      var foursquare = foursquareRatingByDetails(fs_details);
    }
  }
  // Yelp
  var yelp = {};
  var address = "";
  //Does foursquare have an address
  if(foursquare != "" && foursquare.address != ""){
    // Set the address to foursquare's address
    address = foursquare.address;
  }
  // Only search yelp if there's an address
  if(address != ""){
    // Find the yelp id by name and address
    var yelp_id = await yelpIDByNameAndAddress(temp.name, address);
    // Is the place in a supported country?
    if(yelp_id != "Unsupported country"){
      // Get its rating info from its ID
      var yelp = await yelpRatingByID(yelp_id);
    }
  }
  // Set master obj properties to respective ratings sources
  temp.yelp = yelp;
  temp.google = google;
  temp.foursquare = foursquare;
  // Return master obj
  return temp;
}

async function testAllRatingsFromGoogleRating(){
  var results = await testGoogleRatingsByNearbyResults();
  var t_name = "";
  for(k in results){
    t_name = k;
    break;
  }
  var test = await allRatingsFromGoogleRating(results[t_name]);
  console.log(test);
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

async function testAggregateRating(){
  var ratings = await testAllRatingsByNameAndLocation();
  var score = aggregateRating(ratings);
  console.log(ratings.name + ": " + score.rating +"/100 out of " + score.rating_count +" reviews");
  return score;
}

// JSON ---> JSON
// Take an object containing all source ratings info and add aggregate ratings to it
function aggregateRatingForAll(ratings){
  for(var name in ratings){
    ratings[name].aggregate = aggregateRating(ratings[name]);
  }
  return ratings;
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

async function discoverFood(city, state, query){
  if(query == undefined){
    query = "";
  }
  // Get the place_id of the City
  var google_id = await googleIDByCityAndState(city, state);

  // Get the coordinates of the city from the place_id
  // API CALL
  var coors = await googleCoorsByID(google_id)  ;
  // Area Searches
  var google_results = await googleNearbySearch(coors, query, "restaurant").results;
  var foursquare_results = await foursquareNearbySearch(query, coors);
  var yelp_results;
  // Parse Results
  var google_ratings = await googleRatingsByNearbyResults(google_results);
  var foursquare_ratings = await foursquareRatingsByNearbyResults(foursquare_results);
  // var all_ratings = await allFromGoogleForMultiple(google_ratings);

  // Merge parsed results and check for matches across sources
  var unmerged = [google_ratings, foursquare_ratings];
  var all_ratings = mergeRatings(unmerged);
  //addDiscoveriesToSheet(all_ratings, city, query);
}

function mergeRatings(ratings){
  var merged = {};
  var addresses = {};
  var phone_numbers = {};
  
  for(var source_index in ratings){
    var source = ratings[source_index];
    for(var rest_name in source){
      if(merged[rest_name]){
        // Combine duplicate entries
      }
    }
  }
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
  //discoverFood("Vancouver", "BC", "shakshuka");
}

async function allFromGoogleForMultiple(ratings){
  var temp = {};
  for(var k in ratings){
    temp[k] = await allRatingsFromGoogleRating(ratings[k]);
  }
  return temp;
}
