var assert = require('assert');
var stylecow = require('stylecow');

stylecow
	.loadNpmModule(__dirname + '/../index')
	.minSupport({
		"explorer": 0,
		"firefox": 0,
		"chrome": 0,
		"safari": 0,
		"opera": 0,
		"android": 0,
		"ios": 0
	})
	.testCases(__dirname + '/cases', function (test) {
		stylecow.run(test.css);

		describe('cases/' + test.name, function() {
			it('should match output.css', function() {
				//test.write('output.css', test.css.toString());
				assert.equal(test.css.toString(), test.read('output.css'));
			});

			it('should match ast.json', function() {
				//test.writeJson('ast.json', test.css.toAst());
				assert.deepEqual(test.css.toAst(), test.readJson('ast.json'));
			});
		});
	});
