"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cs = require("coffee-script");
const dom = require("dts-dom");
const ContextFlags_1 = require("./ContextFlags");
const utils = require("./utils");
/** Matches all `"` characters in a line. */
const DOUBLE_QUOTE = /"/g;
/** Matches all `'` characters in a line. */
const SINGLE_QUOTE = /'/g;
class DeclarationGenerator {
  constructor(coffeeSource, filepath) {
    this.contextFlags = ContextFlags_1.ContextFlags.None;
    this.exportedDeclarations = [];
    this.coffeeSource = coffeeSource;
    this.filepath = filepath;
    this.requiredModules = [];
    this.knownClasses = new Set();
  }
  visit(node) {
    switch (node.constructor.name) {
      case "Block":
        return node.expressions.map((expr) => this.visit(expr));
      case "Class":
        return this.visitClass(node);
      case "Assign":
        return this.visitAssign(node);
      case "Value":
        return this.visitValue(node);
    }
    return undefined;
  }
  /**
   * Collapses a reference from its AST format to the standard Javascript dotted format,
   * e.g. `{ base: { value: "foo" }, properties: [{ name: { value: "bar" } }] }` -> `foo.bar`
   * @param node The coffeescript compiler node to collapse into its dotted form.
   * @returns The dotted form of the reference if `node` is a reference, otherwise "".
   */
  collapseReference(node) {
    if (!node.base) return "";
    if (!node.properties.every((p) => p.constructor.name != "Index")) {
      return "";
    } else {
      return [node.base.value]
        .concat(node.properties.map((p) => p.name.value))
        .join(".");
    }
  }
  /**
   * Returns the name of an exported property given a collapsed reference (produced by
   * `#collapseReference`), e.g. extracts `Foo` from `module.exports.Foo`.
   * @param collapsed the dotted reference used to identify an exported property, e.g.
   *                  `module.exports.Foo`
   * @return the portion of an export that represents the name exported to consumers if one is
   *         found, otherwise an empty string.
   */
  getExportedProperty(collapsed) {
    if (collapsed.startsWith("module.exports.")) {
      return collapsed.replace("module.exports.", "");
    } else if (collapsed.startsWith("exports.")) {
      return collapsed.replace("exports.", "");
    } else if (this.moduleName && collapsed.startsWith(this.moduleName)) {
      return collapsed.replace(this.moduleName + ".", "");
    } else return "";
  }
  /**
   * Determines whether or not a CoffeeScript AST node represents a CommonJS `require` statement.
   * @param node the CoffeeScript AST node in question.
   * @returns `true` if `node` is a CommonJS `require` statement, otherwise `false`.
   */
  isRequire(node) {
    if (node.constructor.name === "Call") {
      let asCall = node;
      return asCall.variable.base && asCall.variable.base.value === "require";
    }
    return false;
  }
  /**
   * Determines whether a variable, function, or class name is a TypeScript reserved word.  This allows
   * functions called e.g. `import` to be exported without refactoring.
   * @param variableName the variableName to check.
   * @returns `true` if `variableName` is a reserved word in TypeScript, otherwise false.
   */
  isReservedWord(variableName) {
    return dom.reservedWords.includes(variableName);
  }
  /**
   * Descends recursively into an assignment node to find the names of all assignees, e.g.
   * `foo = bar = bibim.bap = "hello"` -> `["foo", "bar", "bibim.bap"]`
   * @param node The coffeescript compiler node to extract assignees from.
   * @returns An array of collapsed references that are assigned the same value.
   */
  getAllAssignees(node) {
    let assignees = [];
    let currentNode = node;
    while (
      currentNode.value &&
      currentNode.value.constructor.name === "Assign"
    ) {
      assignees.push(this.collapseReference(currentNode.variable));
      currentNode = currentNode.value;
    }
    assignees.push(this.collapseReference(currentNode.variable));
  }
  visitAssign(node) {
    var _a, _b, _c;
    let variable = this.collapseReference(node.variable);
    let value = this.collapseReference(node.value);
    let isExportingProperty =
      variable.startsWith("module.exports") ||
      variable.startsWith("exports") ||
      variable.startsWith(this.moduleName);
    let imports = [];
    /*
     * Handle requires (to ensure dependency trees still work).
     * ```
     *     Bar = require("./bar")
     * ```
     */
    if (this.isRequire(node.value)) {
      // TODO: module.exports + imports aren't supported yet.  SO do that.
      let dottedImportedName = variable.split("."); // TODO: Figure out how to handle `Foo.Bar = require("bar")`!
      let importedName = dottedImportedName[dottedImportedName.length - 1];
      const exportedName = this.getExportedProperty(variable);
      if (importedName === "" && exportedName === "") {
        const properties = node.variable.base.properties[0];
        if (
          ((_a =
            properties === null || properties === void 0
              ? void 0
              : properties.operatorToken) === null || _a === void 0
            ? void 0
            : _a.value) === ":"
        ) {
          importedName =
            properties === null || properties === void 0
              ? void 0
              : properties.value.base.value;
        } else {
          importedName =
            (_c =
              (_b =
                properties === null || properties === void 0
                  ? void 0
                  : properties.variable) === null || _b === void 0
                ? void 0
                : _b.base.value) !== null && _c !== void 0
              ? _c
              : properties === null || properties === void 0
              ? void 0
              : properties.base.value;
        }
      } else if (importedName === exportedName) {
        importedName = "_" + importedName;
      }
      this.requiredModules.push(importedName);
      const importedModule = node.value.args[0].base.value
        .replace(DOUBLE_QUOTE, "")
        .replace(SINGLE_QUOTE, "");
      if (importedModule.endsWith('.js"')) {
        // declare any `require()s` of .js files as "any", as those .js files likely don't have associated
        // declarations.
        let localConst = dom.create.const(importedName, dom.type.any);
        this.exportedDeclarations.push(localConst);
        return [localConst];
      } else if (!importedName.includes("this.")) {
        // don't require anything assigned to `@foo` - they're happening within a class, which isn't supported
        // in a .d.ts file.
        let importEquals = dom.create.importEquals(
          importedName,
          importedModule
        );
        this.exportedDeclarations.push(importEquals);
        if (isExportingProperty) {
          imports.push(importEquals);
        } else {
          return [importEquals];
        }
      }
    }
    /*
     * Handle export overwrites
     * ```
     *     module.exports = Foo
     *     # or exports = Foo
     * ```
     */
    if (variable === "module.exports" || variable === "exports") {
      this.contextFlags |= ContextFlags_1.ContextFlags.ExportOverwrite;
      if (this.knownClasses.has(value)) {
        // if we can guarantee that we're exporting a class, do so
        let exportEquals = dom.create.exportEquals(value);
        return [exportEquals];
      } else if (node.value.constructor.name === "Call" && node.value.isNew) {
        // if we're exporting an instance of a class, do that and assume it's in-scope
        let namedType = dom.create.namedTypeReference(
          this.collapseReference(node.value.variable)
        );
        let dummyConst = dom.create.const("__exported", namedType);
        let exportEquals = dom.create.exportEquals(dummyConst.name);
        return [dummyConst, exportEquals];
      } else {
        // otherwise, export "any"
        let dummyConst = dom.create.const("__exported", dom.type.any);
        let exportEquals = dom.create.exportEquals(dummyConst.name);
        return [dummyConst, exportEquals];
      }
    }
    /*
     * Handle export aliasing
     * ```
     *     Foo = module.exports
     *     # or Foo = exports
     *     # then later...
     *     Foo.Bar = () -> "some static function"
     *     Foo.Baz = "Bazbazbaz"
     * ```
     */
    if (value === "module.exports" || value === "exports") {
      this.contextFlags |= ContextFlags_1.ContextFlags.ExportAlias;
      this.moduleName = variable;
      return;
    }
    /*
     * Handle CommonJS exports (with aliasing)
     * ```
     *     module.exports.Alice = "Alice"
     *     exports.Bob = "Bob"
     *     People = module.exports
     *     People.Charlie = "Charlie"
     * ```
     */
    if (isExportingProperty) {
      let exportedProperty = this.getExportedProperty(variable);
      if (this.contextFlags & ContextFlags_1.ContextFlags.ExportOverwrite) {
        // throw an error if we detect unsupported module.exports = Foo (...) module.exports.Bar = Bar
        let message =
          `Attempting to export property "${exportedProperty}" after assigning a value to module.exports.\n` +
          "This behavior isn't supported by splitshot.  Please fully build your exported object\n" +
          "before assigning it to module.exports, e.g.:\n\n" +
          "    Instance = new Foo()\n" +
          '    Instance.Bar = require("bar")\n' +
          '    Instance.Baz = { lorem: "ipsum", dolor: "sit amet" }\n' +
          "    module.exports = Instance\n";
        utils.throwSyntaxError(message, node, this.filepath);
      }
      let exportingReservedWord = this.isReservedWord(exportedProperty);
      let intendedName = exportedProperty;
      if (exportingReservedWord) {
        // declarations cannot use reserved words, but can be exported via an `as` clause in
        // an export.  Add a tag to the identifier we want to use to make it non-reserved.
        exportedProperty += "_rsv";
      }
      let producedDeclarations = [];
      if (node.value.constructor.name === "Call" && node.value.do) {
        // descend into "do" functions that are statically exported, and treat them like
        // regular functions.  This might not be *entirely* safe, but we'll see.
        let doResult = this.visit(node.value.variable);
        doResult; // TODO: do something with doResult
      } else if (node.value.constructor.name === "Code") {
        const func = dom.create.function(
          exportedProperty,
          [],
          dom.type.any,
          dom.DeclarationFlags.Export
        );
        let parameters = this.visitCode(node.value);
        func.parameters = parameters || [];
        producedDeclarations = [func];
      } else if (
        node.value.base &&
        node.value.base.constructor.name === "IdentifierLiteral" &&
        this.requiredModules.includes(exportedProperty)
      ) {
        // TODO:  is this still relevant?  the tests break without this
        // previously-imported modules don't get new names; just export them.
        let namedExport = dom.create.exportName(
          exportedProperty,
          exportedProperty
        );
        producedDeclarations = [namedExport];
      } else if (this.isRequire(node.value) || this.knownClasses.has(value)) {
        let namedExport;
        // direct exports of required modules need to get aliased
        if (this.requiredModules.includes("_" + exportedProperty)) {
          namedExport = dom.create.exportName(
            `_${exportedProperty}`,
            exportedProperty
          );
        } else if (exportedProperty !== value) {
          namedExport = dom.create.exportName(value, exportedProperty);
        } else {
          namedExport = dom.create.exportName(exportedProperty);
        }
        producedDeclarations = [namedExport];
      } else if (node.value.constructor.name === "Class") {
        // classes can be declared inline with non-exported names
        let [clazz] = this.visitClass(node.value);
        // mark classes as exported
        clazz.flags = clazz.flags | dom.DeclarationFlags.Export;
        // overwrite their names with the public one
        clazz.name = exportedProperty;
        producedDeclarations = [clazz];
      } else {
        // everything else gets declared and exported as "any".
        let exportedConst;
        let constructedClass =
          node.value &&
          node.value.isNew &&
          this.collapseReference(node.value.variable);
        if (constructedClass) {
          // instances of classes should have the type of the class
          exportedConst = dom.create.const(exportedProperty, {
            kind: "name",
            name: constructedClass,
          });
        } else {
          // everything else is just an "any"
          exportedConst = dom.create.const(exportedProperty, dom.type.any);
        }
        if (!exportingReservedWord && !exportedConst.name.startsWith("_")) {
          exportedConst.flags =
            exportedConst.flags | dom.DeclarationFlags.Export;
        }
        producedDeclarations = [exportedConst];
      }
      if (exportingReservedWord) {
        // TypeScript (like ES6) doesn't allow `export const ${any reserved word};`, so that
        // needs to be split into two statements, e.g.:
        //
        //     declare const function_rsv: string;
        //     export { function_rsv as function };
        producedDeclarations.push(
          dom.create.exportName(exportedProperty, intendedName)
        );
      }
      return [...imports, ...producedDeclarations];
    }
    /*
     * Handle static properties
     * ```
     *     class Foo
     *         @STATIC_STRING = "BAR"
     * ```
     */
    if (node.variable.base.constructor.name === "ThisLiteral") {
      if (this.clazz) {
        let propertyName = node.variable.properties
          .map((n) => n.name.value)
          .join(".");
        return [
          dom.create.property(
            propertyName,
            dom.type.any,
            dom.DeclarationFlags.Static
          ),
        ];
      }
      return;
    }
    /*
     * Handle constructors
     * ```
     *     class Foo
     *         constructor: (a, b) ->
     *             # do stuff with a and b
     * ```
     */
    if (this.collapseReference(node.variable) === "constructor") {
      let params = this.visitCode(node.value);
      let ctor = dom.create.constructor(params || []);
      if (!this.clazz) {
        let message =
          'Attempting to create function "constructor" outside the context of a class.  While ' +
          "is valid, it's not supported in splitshot just yet.";
        utils.throwSyntaxError(message, node, this.filepath);
      } else {
        // constructors don't get special treatment in dts-dom; they're just plain-old members
        let membersToAdd = [ctor];
        // make a set of known property names for faster lookups
        let classMembers = new Set(
          this.clazz.members
            .filter((m) => m.kind === "property" || m.kind === "method")
            .map((m) => m.name)
        );
        // detect member properties initialized within the constructor
        for (const e of node.value.body.expressions) {
          // find assignments to `@foo`
          if (
            e.constructor.name === "Assign" &&
            e.variable.base &&
            e.variable.base.constructor.name === "ThisLiteral"
          ) {
            // only declare the first access, or `foo` in `@foo`.  Descending into sub-accesses is a rabbit
            // hole I'd prefer to avoid for now.
            if (
              e.variable.properties &&
              e.variable.properties[0] &&
              e.variable.properties[0].name
            ) {
              let name = e.variable.properties[0].name.value;
              let member = dom.create.property(name, dom.type.any);
              // declare "private" members that start with "_" as protected, to ensure compatibility
              if (name.startsWith("_")) {
                member.flags = member.flags | dom.DeclarationFlags.Protected;
              }
              // don't add duplicate members
              if (!classMembers.has(member.name)) {
                classMembers.add(member.name);
                membersToAdd.unshift(member);
              }
            }
          }
        }
        return membersToAdd;
      }
    }
    /*
     * Handle instance functions and instance properties
     * ```
     *     class Foo
     *         print: (baz) ->
     *             console.log(baz)
     *
     *     f = new Foo()
     *     f.print("Hi!")
     * ```
     */
    if (node.variable.base.constructor.name === "PropertyName") {
      let name = this.collapseReference(node.variable);
      if (node.value.constructor.name === "Code") {
        let params = this.visitCode(node.value);
        let method = dom.create.method(
          name,
          params || [],
          /* returnType */ dom.type.any
        );
        // declare "private" functions that start with "_" as protected, to ensure compatibility
        if (name.startsWith("_")) {
          method.flags = method.flags | dom.DeclarationFlags.Protected;
        }
        if (!this.clazz) {
          utils.throwSyntaxError(
            "Detected method outside of a class",
            node,
            this.filepath
          );
        } else {
          return [method];
        }
      } else {
        let member = dom.create.property(name, dom.type.any);
        // declare "private" properties that start with "_" as protected, to ensure compatibility
        if (name.startsWith("_")) {
          member.flags = member.flags | dom.DeclarationFlags.Protected;
        }
        if (!this.clazz) {
          utils.throwSyntaxError(
            "Detected member property outside of a class",
            node,
            this.filepath
          );
        } else {
          return [member];
        }
      }
    }
    return;
  }
  visitCode(node) {
    return node.params.map((csParam) => {
      let paramName = csParam.name.value;
      if (csParam.name.this) {
        paramName = this.collapseReference(csParam.name).replace("this.", "");
        /*
         * CoffeeScript (like TypeScript) allows instance properties to be set in constructor signatures, e.g.:
         *
         * ```
         *     class Foo
         *         constructor: (@bar, @baz) ->
         *     f = new Foo("A", "B")
         *     f.bar is "A"    # true
         *     f.baz is "B"    # true
         * ```
         *
         * Detect those and add class members for them.
         */
        if (this.clazz) {
          let property = dom.create.property(paramName, dom.type.any);
          if (paramName.startsWith("_")) {
            property.flags = property.flags | dom.DeclarationFlags.Protected;
          }
          this.clazz.members.push(property);
        }
      }
      let param = dom.create.parameter(paramName, dom.type.any);
      if (csParam.splat) {
        param.flags = param.flags | dom.ParameterFlags.Rest;
      } else {
        param.flags = param.flags | dom.ParameterFlags.Optional;
      }
      return param;
    });
  }
  visitValue(node) {
    switch (node.base.constructor.name) {
      case "Obj":
        return node.base.properties.map((prop) => this.visit(prop));
    }
  }
  visitClass(node) {
    this.clazz = dom.create.class(this.collapseReference(node.variable));
    this.knownClasses.add(this.clazz.name);
    if (node.parent) {
      // create a dummy class to represent the superclass
      this.clazz.baseType = dom.create.class(
        this.collapseReference(node.parent)
      );
    }
    if (node.body) {
      let deepMembers = this.visit(node.body) || [];
      let members = utils.flatten(deepMembers).filter((m) => !!m);
      this.clazz.members = this.clazz.members.concat(members);
    }
    this.exportedDeclarations.push(this.clazz);
    return [this.clazz];
  }
  generate() {
    let root = cs.nodes(this.coffeeSource);
    let deepDecs = root.expressions.map(this.visit, this);
    let decs = utils.flatten(deepDecs).filter((m) => !!m);
    return utils.flatten(decs);
  }
}
exports.default = DeclarationGenerator;
