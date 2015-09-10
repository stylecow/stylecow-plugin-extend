"use strict";

module.exports = function (tasks) {

	tasks.addTask({
		filter: 'Root',
		fn: function (root) {
			//Save all placeholderselectors
			var index = {};

			root.walk('PlaceholderSelector', function (placeholder) {
				var selector = placeholder.getAncestor('Selector'),
					atRule   = placeholder.getAncestor({type: 'AtRule', name: 'extend'});

				//is in a selector
				if (!atRule) {
					return addIndex(index, placeholder.name, 'defs', selector);
				}

				//is in a @extend
				var add = true;

				placeholder
					.getAncestor('Rule')
					.getChild('Selectors')
					.forEach(function (s) {
						var p = s.get('PlaceholderSelector');

						if (p) {
							s.data.extend = s.data.extend || [];
							s.data.extend.push(placeholder.name);
							add = false;
						}
					});

				if (add) {
					addIndex(index, placeholder.name, 'uses', selector);
				} else {
					atRule.detach();
				}
			});

			//Resolve extensions
			for (let name in index) {
				index[name].defs.forEach(function (selector) {
					if (!selector.data.extend) {
						return;
					}

					selector.data.extend.forEach(function (placeholderName) {
						resolveSubExtends(index, name, selector, placeholderName);
					});
				});
			}

			//Resolve
			for (let name in index) {
				let each = index[name],
					defs = each.defs.concat(each.defs2),
					uses = each.uses,
					d    = 0,
					u    = 0,
					dt   = defs.length,
					ut   = uses.length;

				//Resolve
				if (ut && dt) {
					for (d = 0; d < dt; d++) {
						for (u = 0; u < ut; u++) {
							resolve(defs[d], uses[u]);
						}
					}
				}

				for (d = 0; d < dt; d++) {
					removeDefined(defs[d]);
				}

				for (u = 0; u < ut; u++) {
					removeUsed(uses[u]);
				}
			}
		}
	});

	//adds an element to the index
	function addIndex(index, name, key, element) {
		if (!index[name]) {
			index[name] = {
				defs: [],
				defs2: [],
				uses: []
			};
		}

		index[name][key].push(element);
	}

	//resolve @extend with placeholders
	function resolve (def, use) {
		use
			.getAncestor('Rule')
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
	function resolveSubExtends (index, name, h3Selector, h2Name) {
		//collo os selectores de h2
		var h2 = index[h2Name];

		if (!h2) {
			return;
		}

		//e cada selector h2
		h2.defs.forEach(function (h2Selector) {
			//clono o selector
			var clone = h2Selector.cloneAfter();

			//collo o placeholder
			var h2Placeholder = clone.get('PlaceholderSelector');

			//remplazo os placeholders
			h3Selector.forEach(function (child) {
				h2Placeholder.before(child.clone());
			});
		
			h2Placeholder.detach();
			addIndex(index, name, 'defs2', clone);

			//facelo recursivamente
			if (h2Selector.data.extend) {
				h2Selector.data.extend.forEach(function (h1Name) {
					resolveSubExtends(index, name, clone, h1Name);
				});
			}
		});
	};

	//remove @extend at-rules once they are resolved
	function removeUsed (used) {
		var block = used.getAncestor('Block');

		used.getAncestor('AtRule').detach();

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
