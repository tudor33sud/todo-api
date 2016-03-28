var express = require('express');
var app = express();
var PORT = process.env.port || 3000;

app.get('/',function(req, res){
	res.send('Todo API Root');
});

app.listen(PORT, function(){
	console.log('Express listening on port: '+ PORT + '!');
});