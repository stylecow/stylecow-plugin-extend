module.exports = function (stylecow) {

	//Search for @extend
	stylecow.addTask({
		filter: {
			type: 'AtRule',
			name: 'extend'
		},
		fn: function (extend) {
			var rule = extend.getParent('Rule');
			var selector = extend.get('Selector');

			if (rule && selector) {
				resolvePlaceholders(rule, selector);
				extend.detach();
			}
		}
	});

	//Remove empty placeholders
	stylecow.addTask({
		filter: {
			type: 'Root'
		},
		fn: function (root) {
			root
				.getAll('Rule')
				.forEach(function (rule) {
					var selectors = rule.getChild('Selectors');

					selectors
						.getChildren()
						.forEach(function (selector) {
							if (selector.has('PlaceholderSelector')) {
								selector.detach();
							}
						});

					if (!selectors.length) {
						rule.detach();
					}
				});
		}
	});

	function resolvePlaceholders (rule, selector) {
		var placeholder = selector.get('PlaceholderSelector');

		if (!placeholder) {
			return false;
		}

		//Search for references
		var selectorsRef = selector
			.getParent('Root')
			.getAll(function () {
				if (this.type !== 'Selector' || this.parent.parent.type !== 'Rule') {
					return false;
				}

				return this.hasChild({
					type: 'PlaceholderSelector',
					name: placeholder.name
				});
			});

		//Add the new selector to the reference
		rule.getChild('Selectors')
			.getChildren('Selector')
			.forEach(function (selector) {
				selectorsRef.forEach(function (selectorRef) {
					var place = selectorRef
						.cloneBefore()
						.get({
							type: 'PlaceholderSelector',
							name: placeholder.name
						});

					selector.forEach(function (child) {
						place.before(child.clone());
					})

					place.detach();
				});
			});
	}
};
