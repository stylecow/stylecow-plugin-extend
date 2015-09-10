var stylecow = require('stylecow-core');

var tests = new stylecow.Test(__dirname + '/cases');
var tasks = (new stylecow.Tasks())
    .use(require('../index'))
    .use(require('stylecow-plugin-nested-rules'));

tests.run(function (test) {
    tasks.run(test.css);

    describe('cases/' + test.name, function() {
        it('should match output.css', function() {
            //test.writeString()
            test.assertString();
        });

        it('should match ast.json', function() {
            //test.writeAst()
            test.assertAst();
        });
    });
});
