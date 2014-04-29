var Promise = require("bluebird");

var mongoose = require("mongoose");
var fs = Promise.promisifyAll(require("fs"));
var mustache = require("mustache");
var models = require("../data/models");
var mapper = require("../data/mapping/mapper");
var repositories = require("../data/repositories");
var caches = require("../data/caches");
var bundler = require("../bundling/bundler");

module.exports = function(app) {
	app.get("/", function (request, response) {
		return _getAllUserData(request).spread(function (priorities, statuses, users, transitions, projects, milestones, issueTypes, user) {
			return _mapAllUserData(request, priorities, statuses, users, transitions, projects, milestones, issueTypes, user);
		}).spread(function (html, priorities, statuses, users, transitions, projects, milestones, issueTypes, user, project, renderedScripts, renderedCss) {
			return _sendUserData(response, html, priorities, statuses, users, transitions, projects, milestones, issueTypes, user, project, renderedScripts, renderedCss);
		}).catch(function (e) {
			response.send(e.stack.formatStack(), 500);
		});
	});

	function _getAllUserData(request) {
		return Promise.all([
			caches.Priority.all(),
			caches.Status.all(),
			repositories.User.get(),
			caches.Transition.all(),
			repositories.Project.get(),
			repositories.Milestone.get(null, { sort: { name: 1 }}),
			caches.IssueType.all(),
			_getSignedInUser(request)
		]);
	}

	function _getSignedInUser(request) {
		var session = request.cookies.session;
		return session ? repositories.User.one({ session: session }) : null;
	}

	function _mapAllUserData(request, priorities, statuses, users, transitions, projects, milestones, issueTypes, user) {
		return Promise.all([
			fs.readFileAsync("public/views/root.html"),
			mapper.mapAll("priority", "priority-view-model", priorities),
			mapper.mapAll("status", "status-view-model", statuses),
			mapper.mapAll("user", "user-view-model", users),
			mapper.mapAll("transition", "transition-view-model", transitions),
			mapper.mapAll("project", "project-view-model", projects),
			mapper.mapAll("milestone", "milestone-view-model", milestones),
			mapper.mapAll("issue-type", "issue-type-view-model", issueTypes),
			!user || (user.expiration != null && user.expiration < Date.now()) ? null : mapper.map("user", "user-view-model", user),
			!user ? null : mapper.map("project", "project-view-model", _getProjectFromHost(request, projects)),
			require("../bundling/scriptBundler").render(require("../bundling/assets").scripts(), app)
		]);
	}

	function _sendUserData(response, html, priorities, statuses, users, transitions, projects, milestones, issueTypes, user, project, renderedScripts) {
		return response.send(mustache.render(html.toString(), {
			priorities: JSON.stringify(priorities),
			statuses: JSON.stringify(statuses),
			users: JSON.stringify(users),
			transitions: JSON.stringify(transitions),
			projects: JSON.stringify(projects),
			milestones: JSON.stringify(milestones),
			issueTypes: JSON.stringify(issueTypes),
			signedInUser: JSON.stringify(user),
			projectId: JSON.stringify(project ? project.id : null),
			projectName: JSON.stringify(project ? project.name : null),
			renderedScripts: renderedScripts
		}), 200);
	}

	function _getProjectFromHost(request, projects) {
		var projectName = (request.host == "localhost" ? "Leaf" : request.host.split(".")[0]).toLowerCase();
		for (var i = 0; i < projects.length; i++)
			if (projects[i].name.toLowerCase() == projectName)
				return projects[i];
		return {};
	}
};