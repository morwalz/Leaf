
(function (root) {

	var _container;
	var _oldName;
	var _detailsFlipper;
	var _updateNeeded;

	root.saving = ko.observable(false);
	root.comments = ko.observableArray();

	root.chooser = {
		template: ko.observable(),
		data: ko.observable()
	};

	root.init = function (container) {
		_container = container;
		_setUpFlipPanels(container);
		_hookupEvents(container);

		root.Comments.init(container);
		root.Files.init(container.find("input[type='file']"));
	};

	root.load = function (container) {
		_detailsFlipper = new IssueTracker.Controls.Flipper("#choices-container");
		_oldName = IssueTracker.selectedIssue.description();
		root.Comments.load(IssueTracker.selectedIssue.history());
		root.Files.load(IssueTracker.selectedIssue.id(), IssueTracker.selectedIssue.files());

		_updateNeeded = false;
		IssueTracker.selectedIssue.statusId.subscribe(_updateRequired);
		IssueTracker.selectedIssue.description.subscribe(_updateRequired);
		IssueTracker.selectedIssue.details.subscribe(_updateRequired);
		IssueTracker.selectedIssue.milestoneId.subscribe(_updateRequired);
		IssueTracker.selectedIssue.priorityId.subscribe(_updateRequired);
		IssueTracker.selectedIssue.typeId.subscribe(_updateRequired);
		IssueTracker.selectedIssue.developerId.subscribe(_updateRequired);
		IssueTracker.selectedIssue.testerId.subscribe(_updateRequired);

		IssueTracker.selectedIssue.details.subscribe(function() { container.find("textarea").autogrow(); });
		container.find("textarea").autogrow();

		if (!IssueTracker.isAuthorized("edit-issue"))
			container.addClass("disabled");
	};

	root.selectDescription = function() {
		_container.find("#description").select();
	};

	root.selectDetails = function() {
		_container.find("#details").select();
	};

	function _hookupEvents(container) {
		container.on("click", "#save-changes", _updateIssue);
		container.on("click", "div.transitions button", _executeTransition);
		container.on("click", "div.milestone-chooser>div", _setMilestone);
		container.on("click", "div.priority-chooser>div", _setPriority);
		container.on("click", "div.status-chooser>div", _setStatus);
		container.on("click", "div.type-chooser>div", _setType);
		container.on("click", "div.developer-chooser>div", _setDeveloper);
		container.on("click", "div.tester-chooser>div", _setTester);
	}

	function _setMilestone() {
		_detailsFlipper.toggle();
		_container.find("div.milestone-chooser>div.selected").removeClass("selected");
		$(this).addClass("selected");

		var milestone = $.parseJSON($(this).attr("data-milestone"));
		IssueTracker.selectedIssue.milestoneId(milestone.id);
		IssueTracker.selectedIssue.milestone(milestone.name);
	}

	function _setPriority() {
		_detailsFlipper.toggle();
		_container.find("div.priority-chooser>div.selected").removeClass("selected");
		$(this).addClass("selected");

		var priority = $.parseJSON($(this).attr("data-priority"));
		IssueTracker.selectedIssue.priorityId(priority.id);
		IssueTracker.selectedIssue.priority(priority.name);
	}
	
	function _setType() {
		_detailsFlipper.toggle();
		_container.find("div.type-chooser>div.selected").removeClass("selected");
		$(this).addClass("selected");

		var type = $.parseJSON($(this).attr("data-type"));
		IssueTracker.selectedIssue.typeId(type.id);
		IssueTracker.selectedIssue.type(type.name);
	}

	function _setStatus() {
		_container.find("div.status-chooser>div.selected").removeClass("selected");
		$(this).addClass("selected");

		var status = $.parseJSON($(this).attr("data-status"));
		IssueTracker.selectedIssue.statusId(status.id);
		IssueTracker.selectedIssue.status(status.name);
		_detailsFlipper.toggle();
	}
	
	function _setDeveloper() {
		_detailsFlipper.toggle();
		_container.find("div.developer-chooser>div.selected").removeClass("selected");
		$(this).addClass("selected");

		var developer = $.parseJSON($(this).attr("data-developer"));
		IssueTracker.selectedIssue.developerId(developer.id);
		IssueTracker.selectedIssue.developer(developer.name);
	}
	
	function _setTester() {
		_detailsFlipper.toggle();
		_container.find("div.tester-chooser>div.selected").removeClass("selected");
		$(this).addClass("selected");

		var tester = $.parseJSON($(this).attr("data-tester"));
		IssueTracker.selectedIssue.testerId(tester.id);
		IssueTracker.selectedIssue.tester(tester.name);
	}

	function _executeTransition() {
		IssueTracker.Transitioner.execute($(this).attr("data-status-id"));
	}

	function _setUpFlipPanels(container) {
		container.on("click", "#milestone", function () {
			if (!IssueTracker.isAuthorized("edit-issue"))
				return;

			root.chooser.data({ milestones: IssueTracker.milestones() });
			root.chooser.template("milestone-chooser");
			_detailsFlipper.toggle();
		});

		container.on("click", "#priority", function () {
			if (!IssueTracker.isAuthorized("edit-issue"))
				return;

			root.chooser.data({ priorities: IssueTracker.priorities() });
			root.chooser.template("priority-chooser");
			_detailsFlipper.toggle();
		});

		container.on("click", "#status", function() {
			if (!IssueTracker.isAuthorized("edit-issue"))
				return;

			root.chooser.data({ statuses: IssueTracker.statuses() });
			root.chooser.template("status-chooser");
			_detailsFlipper.toggle();
		});

		container.on("click", "#issue-type", function () {
			if (!IssueTracker.isAuthorized("edit-issue"))
				return;

			root.chooser.data({ issueTypes: IssueTracker.issueTypes() });
			root.chooser.template("type-chooser");
			_detailsFlipper.toggle();
		});
		
		container.on("click", "#developer", function () {
			if (!IssueTracker.isAuthorized("edit-issue"))
				return;

			root.chooser.data({ developers: IssueTracker.users() });
			root.chooser.template("developer-chooser");
			_detailsFlipper.toggle();
		});
		
		container.on("click", "#tester", function () {
			if (!IssueTracker.isAuthorized("edit-issue"))
				return;

			root.chooser.data({ testers: IssueTracker.users() });
			root.chooser.template("tester-chooser");
			_detailsFlipper.toggle();
		});
	}

	function _updateIssue() {
		root.saving(true);
		_save().done(function () {
			IssueTracker.selectedIssue.closed(_issueIsClosed(IssueTracker.selectedIssue.statusId()) ? new Date().toShortDateString() : null);
			window.location.hash = window.location.hash.replace(_oldName.formatForUrl(), IssueTracker.selectedIssue.description().formatForUrl());
			IssueTracker.Feedback.success("Your issue has been updated.");
			IssueTracker.Notifications.refresh();
			_container.find("div.new-comment textarea").removeAttr("style");
		}).fail(function () {
			IssueTracker.Feedback.error("An error has occurred while saving your issue. Please try again later.");
		}).always(function () {
			root.saving(false);
		});
	}

	function _issueIsClosed(statusId) {
		var closed = false;
		$.each(IssueTracker.statuses(), function(i, status) {
			if (status.isClosedStatus && status.id == statusId)
				closed = true;
		});
		return closed;
	}

	function _save() {
		if (_updateNeeded)
			return $.post(IssueTracker.virtualDirectory + "issues/update", _buildIssueParameters())
		else
			return new ResolvedDeferred();
	}

	function _buildIssueParameters() {
		var issue = IssueTracker.selectedIssue;
		return {
			id: issue.id(),
			number: issue.number(),
			description: issue.description(),
			details: issue.details(),
			milestoneId: issue.milestoneId(),
			priorityId: issue.priorityId(),
			statusId: issue.statusId(),
			typeId: issue.typeId(),
			developerId: issue.developerId(),
			testerId: issue.testerId(),
			opened: issue.opened()
		};
	}

	function _updateRequired() {
		_updateNeeded = true;
	}

	$(function() {
		IssueTracker.Page.build({
			root: root,
			view: function () { return "issues/details?number=:number"; },
			title: function() { return "Leaf - " + IssueTracker.selectedIssue.number() + ": " + IssueTracker.selectedIssue.description(); },
			route: "#/issues/:number",
			style: "issue-details-container"
		});
	});

})(root("IssueTracker.IssueDetails"));
