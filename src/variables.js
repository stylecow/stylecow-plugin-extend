module.exports = function (stylecow) {
	var index = {};
	var suffix = (new Date).getTime();
	var suffix_count = 0;

	stylecow.addTask({
		fn: function () {
			index = {};
		}
	});

	//Resolve placeholders that need to be duplicated (due variables)
	//They must be handled before the variables are resolved
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

			//If it's a definition with variables, save it to use later
			if (type === 'defs') {
				var rule = placeholder.getParent('Rule');

				if (rule.has('ExtensionName')) {
					if (!(placeholder.name in index)) {
						index[placeholder.name] = [];
					}

					index[placeholder.name].push(rule.clone(true));
				}

				return;
			}

			//Use the definitions (@extend)
			if (placeholder.name in index) {
				var useRule = placeholder.getParent('Rule');

				index[placeholder.name].forEach(function (defRule) {
					var variables = defRule
							.getAll('ExtensionName')
							.map(function (extension) {
								var variable = placeholder.getData('@var-' + extension.name);

								if (variable) {
									return variable.clone();
								}
							})
							.filter(function (variable) {
								return variable ? true : false;
							});

					//No variables are used, do nothing
					if (!variables.length) {
						return;
					}

					var defRuleCopy = defRule.clone();

					//Insert used variables in the cloned ruleset
					variables.forEach(function (declaration) {
						if (declaration) {
							defRuleCopy.setData('@var-' + declaration.name.substr(2), declaration);
						}
					});

					useRule.before(defRuleCopy);

					//Rename the placeholder to make it unique
					var suff = '-' + suffix + '_' + (suffix_count++);

					defRuleCopy
						.getChild('Selectors')
						.getAll({
							type: 'PlaceholderSelector',
							name: placeholder.name
						})
						.forEach(function (child) {
							child.name += suff;
						});

					placeholder.name += suff;
				});
			}
		}
	});	
};