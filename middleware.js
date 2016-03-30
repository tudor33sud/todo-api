module.exports = function(db) {


	return {
		requireAuthentication: function(req, res, next) {
			var token = req.get('Auth');

			db.user.findByToken(token).then(function(user) {
				if (user) {
					res.user = user;
					next();
				} else {
					return res.status(401).send();
				}
			}, function(error) {
				res.status(401).send();
			});
		}
	};
}