"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextFlags = void 0;
var ContextFlags;
(function (ContextFlags) {
  ContextFlags[(ContextFlags["None"] = 0)] = "None";
  /** Set when parsing within a class */
  ContextFlags[(ContextFlags["InClass"] = 1)] = "InClass";
  /**
   * Set when module.exports is assigned to another variable, e.g.
   * `Foo = module.exports`
   */
  ContextFlags[(ContextFlags["ExportAlias"] = 2)] = "ExportAlias";
  /**
   * Set when some variable overwrites module.exports, e.g.
   * `module.exports = Bar`
   */
  ContextFlags[(ContextFlags["ExportOverwrite"] = 4)] = "ExportOverwrite";
})((ContextFlags = exports.ContextFlags || (exports.ContextFlags = {})));
