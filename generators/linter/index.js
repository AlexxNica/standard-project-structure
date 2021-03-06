const yeoman = require('yeoman-generator');
const yosay = require('yosay');
const _merge = require('lodash/merge');
const _union = require('lodash/union');
const _includes = require('lodash/includes');

module.exports = yeoman.Base.extend({
  prompting: {
    languages() {
      const self = this;

      this.log(yosay(
        'Installing Linters for your code'
      ));
      return this.prompt([{
        type: 'checkbox',
        name: 'selectedLanguages',
        message: 'Which Languages do you use?',
        choices: ['JavaScript', 'HTML', 'CSS', 'TypeScript'],
        default: ['JavaScript', 'HTML', 'CSS'],
        when: () => !self.config.get('selectedLanguages'),
      }, {
        type: 'checkbox',
        name: 'selectedEditors',
        message: 'Which Editors do you want to configure?',
        choices: ['Atom', 'VS Code'],
        default: ['Atom'],
        when: () => !self.config.get('selectedEditors'),
      }])
      .then(answers => {
        self.selectedLanguages = self.config.get('selectedLanguages') || answers.selectedLanguages;
        self.selectedEditors = self.config.get('selectedEditors') || answers.selectedEditors;
      });
    },
  },
  /**
   * Asks users which languages they are using (only if answers haven't been
   * stored in the config probably from asking the question from an earlier
   * generator). Also asks which editors are bing used so relevant linting
   * extensions / package plugins can be installed for them.
   *
   * Adds all dependencies of linters and linter rules into the devDependencies
   * of package.json. Additionally adds linter plugins for editors into another
   * file.
   *
   * Finally runs an npm install as well as installs plugins for editors.
   */
  writing() {
    // Read a package.json if it exists or create it
    const packageJSON = this.fs.readJSON(this.destinationPath('package.json'), {});
    let aliasesJS = this.fs.exists(this.destinationPath('./grunt/aliases.js')) ?
      require(this.destinationPath('./grunt/aliases.js')) : {};
    let atomPackages = _includes(this.selectedEditors, 'Atom') ?
      this.fs.read(this.destinationPath('atom-packages.txt'), { defaults: '' }).split('\n') : null;
    if (aliasesJS.lint !== []) {
      aliasesJS.lint = [];
    }
    // JAVASCRIPT
    if (_includes(this.selectedLanguages, 'JavaScript')) {
      this.log('Configuring ESLint for Linting JavaScript');
      aliasesJS.lint = aliasesJS.lint || [],
      aliasesJS.lint.push('eslint'),
      _merge(packageJSON, {
        devDependencies: {
          'eslint-config-airbnb': '^10.0.1',
          'eslint-plugin-import': '^1.14.0',
          'eslint-plugin-react': '^6.2.0',
          'eslint-plugin-jsx-a11y': '^2.2.1',
          'eslint-plugin-html': '^1.5.3',
          'grunt-eslint': '^19.0.0',
        },
      });
      this.fs.copyTpl(
        this.templatePath('.eslintrc'),
        this.destinationPath('./.eslintrc'), {}
      );
      this.fs.copyTpl(
        this.templatePath('grunt/eslint.js'),
        this.destinationPath('./grunt/eslint.js'), {}
      );
      if (_includes(this.selectedEditors, 'Atom')) {
        atomPackages = _union(atomPackages, ['linter-eslint']);
      }
    }

    // CSS
    if (_includes(this.selectedLanguages, 'CSS')) {
      this.log('Configuring StyleLint for Linting CSS');
      aliasesJS.lint = aliasesJS.lint || [],
      aliasesJS.lint.push('stylelint'),
      _merge(packageJSON, {
        devDependencies: {
          'grunt-stylelint': '^0.6.0',
          'stylelint-config-standard': '^13.0.0',
        },
      });
      this.fs.copyTpl(
        this.templatePath('.stylelintrc'),
        this.destinationPath('./.stylelintrc'), {}
      );
      this.fs.copyTpl(
        this.templatePath('grunt/stylelint.js'),
        this.destinationPath('./grunt/stylelint.js'), {}
      );
      if (_includes(this.selectedEditors, 'Atom')) {
        atomPackages = _union(atomPackages, ['linter-stylelint']);
      }
    }

    // HTML
    if (_includes(this.selectedLanguages, 'HTML')) {
      this.log('Configuring HTMLHint for Linting HTML');
      aliasesJS.lint = aliasesJS.lint || [],
      aliasesJS.lint.push('htmlhint'),
      _merge(packageJSON, {
        devDependencies: {
          htmlhint: '^0.9.13',
        },
      });
      this.fs.copyTpl(
        this.templatePath('.htmlhintrc'),
        this.destinationPath('./.htmlhintrc'), {}
      );
      this.fs.copyTpl(
        this.templatePath('grunt/htmlhint.js'),
        this.destinationPath('./grunt/htmlhint.js'), {}
      );
      if (_includes(this.selectedEditors, 'Atom')) {
        atomPackages = _union(atomPackages, ['linter-htmlhint']);
      }

      // TODO: Add Rules config file
    }

    // TypeScript
    if (_includes(this.selectedLanguages, 'TypeScript')) {
      this.log('Configuring TSLint for TypeScript');
      aliasesJS.lint = aliasesJS.lint || [],
      aliasesJS.lint.push('tslint'),
      _merge(packageJSON, {
        devDependencies: {
          typescript: '^1.8.10',
          tslint: '^3.15.1',
          'tslint-microsoft-contrib': '^2.0.12',
        },
      });
      this.fs.copyTpl(
        this.templatePath('tslint.json'),
        this.destinationPath('./tslint.json'), {}
      );
      this.fs.copyTpl(
        this.templatePath('grunt/tslint.js'),
        this.destinationPath('./grunt/tslint.js'), {}
      );
      if (_includes(this.selectedEditors, 'Atom')) {
        atomPackages = _union(atomPackages, ['linter-tslint']);
      }
    }

    this.log('Writing to package.json');
    this.fs.writeJSON(this.destinationPath('package.json'), packageJSON);
    this.fs.write(this.destinationPath('grunt/aliases.js'), 'module.exports=' + JSON.stringify(aliasesJS, null, 2));

    // editorconfig
    this.log('Writing .editorconfig');
    this.fs.copyTpl(
      this.templatePath('.editorconfig'),
      this.destinationPath('./.editorconfig'), {}
    );

    // linterignore
    this.log('Writing .linterignore');
    this.fs.copyTpl(
      this.templatePath('.linterignore'),
      this.destinationPath('./.linterignore'), {}
    );
    if (_includes(this.selectedEditors, 'Atom')) {
      atomPackages = _union(atomPackages, ['editorconfig']);

      this.log('Writing to atom-packages.txt');
      this.fs.write(this.destinationPath('atom-packages.txt'), atomPackages.join('\n'));
    }
  },

  install() {
    if (_includes(this.selectedEditors, 'Atom')) {
      this.log('Installing Atom Linter Plugins via apm.');
      this.spawnCommandSync('apm', ['install', '--packages-file', 'atom-packages.txt']);
    }

    this.installDependencies();
  },
});
