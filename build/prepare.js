const fs = require('fs-extra');
const pkg = require('../package');
const { omit } = require('lodash');

fs.writeJsonSync('dist/package.json', omit(pkg, ['scripts', 'private', 'devDependencies']), {
  spaces: 2
});
