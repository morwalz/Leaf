var model = require("../models").User;
var base = require("./baseRepository");

exports.all = function() {
	return base.all(model, {
		sort: { name: 1 }
	});
};
