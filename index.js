module.exports = function (stylecow) {

	//Resolve placeholders that need to be duplicated (with variables)
	stylecow.addTask({
		fn: function (root) {
			//Save all placeholderselectors
			var index = {};

			root
				.getAll({
					type: 'PlaceholderSelector'
				})
				.forEach(function (placeholder) {
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
							uses: [],
							vars: []
						};
					}

					if (type === 'defs') {
						var rule = placeholder.getParent('Rule');
						var hasVars = false;

						rule.getAll('ExtensionName').forEach(function (extension) {
							hasVars = true;

							if (index[placeholder.name].vars.indexOf(extension.name) === -1) {
								index[placeholder.name].vars.push(extension.name);
							}
						});

						if (hasVars) {
							index[placeholder.name][type].push(rule);
						}

					} else {
						index[placeholder.name][type].push(placeholder);
					}
				});

			console.log(index);

			/*
			//Resolve
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
			*/
		}
	});

	//Resolve all placeholders
	stylecow.addTask({
		filter: {
			type: 'Root'
		},
		fn: function (root) {
			//Save all placeholderselectors
			var index = {};

			root
				.getAll({
					type: 'PlaceholderSelector'
				})
				.forEach(function (placeholder) {
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
				});

			//Resolve
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

		var block = atrule.getParent('Block');

		if (atrule) {
			atrule.detach();
		}

		//remove if it's empty
		if (!block.length) {
			block.getParent().detach();
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
		var useRule = use.getParent('Rule');
		var useSelectors = useRule.getChild('Selectors');

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
