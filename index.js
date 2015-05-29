module.exports = function (stylecow) {
	var index = {};

	stylecow.addTask({
		fn: function () {
			index = {};
		}
	});

	//Resolve placeholders that need to be duplicated (with variables)
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

			//If it's a definition, save it to use later
			if (type === 'defs') {
				var rule = placeholder.getParent('Rule');

				if (rule.data.extend_executed === true) {
					return;
				}

				rule.data.extend_executed = true;

				if (rule.has('ExtensionName')) {
					if (!(placeholder.name in index)) {
						index[placeholder.name] = [];
					}

					index[placeholder.name].push(rule.clone(true));
				}

				return;
			}

			//Use the definitions
			if (placeholder.name in index) {
				var useRule = placeholder.getParent('Rule');

				index[placeholder.name].forEach(function (defRule) {
					var hasDeclaredVariables = false;
					var declaredVariables = defRule
							.getAll('ExtensionName')
							.map(function (extension) {
								var variable = placeholder.getData('@var-' + extension.name);

								if (variable) {
									variable = variable.clone();
									hasDeclaredVariables = true;
									return variable.clone();
								}
							});

					if (!hasDeclaredVariables) {
						return;
					}

					var defRuleCopy = defRule.clone();

					//Save variables
					declaredVariables.forEach(function (declaration) {
						if (declaration) {
							defRuleCopy.setData('@var-' + declaration.name.substr(2), declaration);
						}
					});

					useRule.before(defRuleCopy);

					defRuleCopy
						.getChild('Selectors')
						.getAll({
							type: 'PlaceholderSelector',
							name: placeholder.name
						})
						.forEach(function (place) {
							resolve(place, placeholder);
							removeDefined(place);
						});

					removeUsed(placeholder);
				});
			}
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
