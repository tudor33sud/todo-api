var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db.js');
var bcrypt = require('bcrypt');
var middleware = require('./middleware.js')(db);

var app = express();
var PORT = process.env.PORT || 3000;
var todos = [];
var todoNextId = 1;

app.use(bodyParser.json());

app.get('/', function(req, res) {
	res.send('Todo API Root');
});

// GET /todos?completed=true&q=work
app.get('/todos', middleware.requireAuthentication, function(req, res) {
	var query = req.query;
	var where = {};

	if (query.hasOwnProperty('completed') && query.completed === 'true') {
		where.completed = true;
	} else if (query.hasOwnProperty('completed') && query.completed === 'false') {
		where.completed = false;
	}

	if (query.hasOwnProperty('q') && query.q.length > 0) {
		where.description = {
			$like: '%' + query.q + '%'
		};
	}

	db.todo.findAll({
		where: where
	}).then(function(todos) {
		res.json(todos);
	}, function(error) {
		res.status(500).send();
	});

});

// GET /todos/:id
app.get('/todos/:id', middleware.requireAuthentication, function(req, res) {
	var todoId = parseInt(req.params.id, 10);
	db.todo.findById(todoId).then(function(todo) {
		if (!!todo) {
			res.json(todo);
		} else {
			res.status(404).send();
		}
	}, function(error) {
		res.status(500).send();
	});
});

// POST /todos 
app.post('/todos', middleware.requireAuthentication, function(req, res) {
	var body = _.pick(req.body, 'description', 'completed');

	db.todo.create({
		description: body.description,
		completed: body.completed
	}).then(function(todo) {
		res.json(todo);
	}).catch(function(error) {
		res.status(400).json(error);
	});

})

// DELETE /todos/:id
app.delete('/todos/:id', middleware.requireAuthentication, function(req, res) {
	var todoId = parseInt(req.params.id, 10);

	//option 1
	// db.todo.findById(todoId).then(function(todo){
	// 	if(todo){
	// 		todo.destroy();
	// 		res.json(todo);
	// 	} else{
	// 		res.status(404).send();
	// 	}
	// },function(error){
	// 	res.status(500).send();
	// });

	//option2
	db.todo.destroy({
		where: {
			id: todoId
		}
	}).then(function(rowsDeleted) {
		if (rowsDeleted === 0) {
			res.status(404).json({
				error: 'No todo with id'
			});
		} else {
			res.status(204).send();
		}
	}, function(error) {
		res.status(500).send();
	})

})

// PUT /todos/:id
app.put('/todos/:id', middleware.requireAuthentication, function(req, res) {
	var todoId = parseInt(req.params.id, 10);
	var body = _.pick(req.body, 'description', 'completed');
	var attributes = {};

	if (body.hasOwnProperty('completed')) {
		attributes.completed = body.completed;
	}

	if (body.hasOwnProperty('description')) {
		attributes.description = body.description;
	}

	db.todo.findById(todoId).then(function(todo) {
		if (todo) {
			todo.update(attributes).then(function(todo) {
				res.json(todo.toJSON());
			}, function(error) {
				res.status(400).json(error);
			});
		} else {
			res.status(404).send();
		}
	}, function(error) {
		res.status(500).json(error);
	});
});

app.post('/users', function(req, res) {
	var body = _.pick(req.body, 'email', 'password');

	db.user.create(body).then(function(user) {
		res.json(user.toPublicJSON());
	}, function(error) {
		res.status(400).json(error);
	});
});

app.post('/users/login', function(req, res) {
	var body = _.pick(req.body, 'email', 'password');

	db.user.authenticate(body).then(function(user) {
		res.header('Auth', user.generateToken('authentication')).json(user.toPublicJSON());
	}, function() {
		res.status(401).send();
	});

});

db.sequelize.sync().then(function() {
	app.listen(PORT, function() {
		console.log('Express listening on port: ' + PORT + '!');
	});
});