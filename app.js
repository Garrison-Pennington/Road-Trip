
const http = require('http');
const fs = require('fs');
const connect = require('connect');
const serveStatic = require('serve-static');


connect().use(serveStatic("C:\\Users\\House\\Desktop\\Possum\\Road-Trip")).listen(8080, function(){
    console.log('Server running on 8080...');
});
