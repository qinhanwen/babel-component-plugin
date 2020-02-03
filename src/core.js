const { addSideEffect, addDefault } = require('@babel/helper-module-imports');
//@babel/helper-module-imports插件说明： https://babeljs.io/docs/en/babel-helper-module-imports

module.exports = function core (defaultLibraryName) {
  return ({ types }) => {
    let specified;
    let selectedMethods;

    function parseName (_str) {
      const str = _str[0].toLowerCase() + _str.substr(1);
      return str.replace(/([A-Z])/g, ($1) => `-${$1.toLowerCase()}`);
    }

    function importMethod (methodName, file, opts) {
      if (!selectedMethods[methodName]) {
        const LIB_DIR = 'lib';
        const CSS_EXT = '.css';
        const JS_EXT = '.js';
        let path = "".concat(defaultLibraryName, "/").concat(LIB_DIR, "/").concat(parseName(methodName));
        selectedMethods[methodName] = addDefault(file.path, path + JS_EXT, {// 创建引入的节点
          nameHint: methodName
        });
        addSideEffect(file.path, path + CSS_EXT);
      }
      return selectedMethods[methodName];
    }

    return {
      visitor: {
        Program () {
          specified = Object.create(null);
          selectedMethods = Object.create(null);
        },

        ImportDeclaration (path, { opts }) {
          const { node } = path;
          const { value } = node.source;

          const libraryName = opts.libraryName || defaultLibraryName;
          // 如果引入的名称里面是 mt-ui 就存在specified 和 moduleArr 里
          if (value === libraryName) {
            node.specifiers.forEach(spec => {
              if (types.isImportSpecifier(spec)) {
                specified[spec.local.name] = spec.imported.name;
              }
            });
            path.remove();
          }
        },

        CallExpression (path, state) {
          debugger
          const { node } = path;
          const file = (path && path.hub && path.hub.file) || (state && state.file);
          node.arguments = node.arguments.map(arg => {
            const { name: argName } = arg;
            if (specified[argName]) {
              return importMethod(specified[argName], file, state.opts);
            }
            return arg;
          });
        },
      },
    };
  };
};
