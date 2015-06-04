module.exports = function (stylecow) {

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
					var type = 'uses';

					var parent = placeholder.getParent({
						type: 'AtRule',
						name: 'extend'
					});

					if (!parent) {
						parent = placeholder.getParent('Selector');
						type = 'defs'
					}

					if (!index[placeholder.name]) {
						index[placeholder.name] = {
							defs: [],
							uses: [],
							exts: [],
							has: []
						};
					}

					var add = true;

					if (type === 'uses') {
						placeholder
							.getParent('Rule')
							.getChild('Selectors')
							.getAll('PlaceholderSelector')
							.forEach(function (extend) {
								var exts = index[extend.name].exts;
								add = false;

								if (exts.indexOf(placeholder.name) === -1) {
									exts.push(placeholder.name);
								}
							});

					}

					if (add) {
						index[placeholder.name][type].push(parent);
					} else {
						removeUsed(parent);
					}
				});

			var name, each;

			//Resolve extensions
			for (name in index) {
				index[name].exts.forEach(function (ext) {
					resolveSubExtends(index, name, ext);
				});
			}

			//Resolve
			for (name in index) {
				each = index[name];
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

	//resolve @extend with placeholders
	function resolve (def, use) {
		use
			.getParent('Rule')
			.getChild('Selectors')
			.forEach(function (useSelector) {
				var placeholder = def
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
	};


	//resolve placeholders extending other placeholders
	function resolveSubExtends (index, name, extName) {
		if (index[name].has.indexOf(extName) !== -1) {
			return;
		}

		var element = index[name];

		var add = [];

		index[extName].defs.forEach(function (parentDef) {
			element.defs.forEach(function (def) {
				var _parentDefSelector = parentDef.cloneBefore();
				var _parentDef = _parentDefSelector.get({
						type: 'PlaceholderSelector',
						name: extName
					});

				def.forEach(function (child) {
					_parentDef.before(child.clone());
				});


				add.push(_parentDefSelector);

				_parentDef.detach();
			});
		});

		add.forEach(function (item) {
			index[name].defs.push(item);
		});

		propagate(index, name, extName);
	};

	//propagate placeholders with other @extend
	function propagate (index, name, extName) {
		index[name].has.push(extName);

		index[extName].has.forEach(function (subExtName) {
			propagate(index, name, subExtName);
		});
	}

	//remove @extend at-rules once they are resolved
	function removeUsed (used) {
		var block = used.getParent('Block');

		used.detach();

		//remove if it's empty
		if (!block.length) {
			block.getParent().detach();
		}
	}

	//remove placeholders once they are resolved
	function removeDefined (defined) {
		var selectors = defined.getParent();

		defined.detach();

		if (!selectors.length) {
			selectors.getParent().detach();
		}
	}
};
