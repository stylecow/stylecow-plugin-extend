module.exports = function (stylecow) {

	var index;

	//Init the index of placeholders
	stylecow.addTask({
		fn: function (root) {
			index = {};
		}
	});

	//Search for placeholders and save them in the index
	stylecow.addTask({
		filter: {
			type: 'PlaceholderSelector'
		},
		fn: function (placeholder) {
			var type = 'defs';

			if (placeholder.getParent({
				type: 'AtRule',
				name: 'extend'
			})) {
				type = 'uses';
			}

			if (!index[placeholder.name]) {
				index[placeholder.name] = {
					defs: [],
					uses: []
				};
			}

			index[placeholder.name][type].push(placeholder);
		}
	});

	//Resolve all placeholders
	stylecow.addTask({
		filter: {
			type: 'Root'
		},
		fn: function (root) {
			var name, each;

			for (name in index) {
				var each = index[name];
				var d = 0;
				var u = 0;
				var dt = each.defs.length;
				var ut = each.uses.length;

				//Resolve
				if (ut && dt) {
					for (d = 0; d < dt; d++) {
						for (u = 0; u < ut; u++) {
							resolve(each.defs[d], each.uses[u]);
						}
					}
				}

				for (d = 0; d < dt; d++) {
					removeDefined(each.defs[d]);
				}

				for (u = 0; u < ut; u++) {
					removeUsed(each.uses[u]);
				}
			}
		}
	});

	function removeUsed (used) {
		var atrule = used.getParent({
			type: 'AtRule',
			name: 'extend'
		});

		if (atrule) {
			atrule.detach();
		}
	}

	function removeDefined (defined) {
		var selector = defined.getParent('Selector');

		if (selector) {
			var selectors = selector.getParent();

			selector.detach();

			if (!selectors.length) {
				selectors.getParent().detach();
			}
		}
	}

	function resolve (def, use) {
		var defSelector = def.getParent('Selector');
		var useSelectors = use.getParent('Rule').getChild('Selectors');

		useSelectors.forEach(function (useSelector) {
			var placeholder = defSelector
				.cloneBefore()
				.get({
					type: 'PlaceholderSelector',
					name: def.name
				});

			useSelector.forEach(function (child) {
				placeholder.before(child.clone());
			});

			placeholder.detach();
		});
	}
};
