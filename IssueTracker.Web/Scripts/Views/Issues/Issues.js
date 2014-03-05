
(function (root) {

	var _container;
	var _filter;
	var _sorter;
	var _flipper;

	var _startCount = 50;
	var _issueCountToLoad = 15;
	var _start = 0;
	var _nextIssuesRunning = false;
	var _allLoaded = false;
	
	root.loading = ko.observable(true);

	root.list = ko.observableArray();
	root.search = ko.observable("");
	root.sidebar = ko.observable();

	root.init = function (container) {
		_filter = IssueTracker.Issues.Filter;
		_sorter = IssueTracker.Issues.Sorter;
		
		_container = container;
		_hookupEvents(container);

		_setupLoadingMoreIssues();

		_flipper = new IssueTracker.Controls.Flipper("div.sidebar .flipper");
		_filter.init(container, _flipper, root.sidebar, _resetIssueList);
		_sorter.init(container, _flipper, root.sidebar, _resetIssueList);
	};

	root.load = function () {
		_resetIssueList();
	};

	root.reset = function () {
		_resetIssueList();
	};

	function _hookupEvents(container) {
		container.on("focus", "div.search input", function () { $(this).parent().addClass("focus"); });
		container.on("blur", "div.search input", function () { $(this).parent().removeClass("focus"); });
		container.on("click", "div.search i", function () { root.search(""); });
		root.search.subscribe(_resetIssueList);
	}
	
	function _setupLoadingMoreIssues() {
		$(window).scroll(function () {
			if ($(window).scrollTop() + $(window).height() > $(document).height() - 200)
				_getNextIssues(_issueCountToLoad);
		});
	}
	
	function _getNextIssues(count) {
		if (_nextIssuesRunning === true || _allLoaded === true)
			return;

		root.loading(true);
		_nextIssuesRunning = true;
		$.get(IssueTracker.virtualDirectory() + "Issues/Next", _buildParameters(count)).done(function (issues) {
			root.list([]);
			root.list.pushAll(issues);
			_setPriorityBarHeights();
			if (issues.length < count)
				_allLoaded = true;
		}).fail(function () {
			IssueTracker.Feedback.error("An error has occurred while retrieving the next set of issues. Please try again later.");
		}).always(function() {
			_nextIssuesRunning = false;
			root.loading(false);
		});
		_start += count;
	}

	function _setPriorityBarHeights() {
		_container.find("div.priority.unset").each(function() {
			var bar = $(this).removeClass("unset");
			var tile = bar.closest("a.tile");
			bar.height(tile.removeClass("hidden").height());
		});
	}
	
	function _buildParameters(count) {
		return $.toDictionary({
			start: _start + 1,
			end: _start + count,
			project: IssueTracker.selectedProject(),
			direction: _sorter.direction(),
			comparer: _sorter.property(),
			filter: root.search(),
			milestones: _joinFilterIds(_filter.selectedMilestones(), IssueTracker.milestones()),
			priorities: _joinFilterIds(_filter.selectedPriorities(), IssueTracker.priorities()),
			statuses: _joinFilterIds(_filter.selectedStatuses(), IssueTracker.statuses()),
			developers: _joinFilterIds(_filter.selectedDevelopers(), IssueTracker.users()),
			testers: _joinFilterIds(_filter.selectedTesters(), IssueTracker.users())
		});
	}
	
	function _joinFilterIds(filterCollection, masterCollection) {
		var ids = [];
		var collection = filterCollection.length == 0 ? masterCollection : filterCollection; 
		$.each(collection, function(i, filterItem) {
			ids.push(filterItem.id);
		});
		return ids.join(",");
	}

	function _resetIssueList() {
		_start = 0;
		_allLoaded = false;
		_getNextIssues(_startCount);
	}

	IssueTracker.Page.build({
		root: root,
		view: "Issues",
		title: "Issues",
		route: "#/:project-name/issues",
		style: "issues-container"
	});

})(root("IssueTracker.Issues"));