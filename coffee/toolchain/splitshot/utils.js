"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flatten = exports.throwSyntaxError = void 0;
/**
 * Adds the source location to a provided message.  Useful for generating `SyntaxError`s.
 *
 * @param message The message to display to users.  Will be decorated with the line number, column number, and
 *                optionally the path of the file being parsed.
 * @param coffeeScriptNode The `node` from the CoffeeScript compiler's AST where the error was found.
 * @param filePath Path to the CoffeeScript file being parsed, or `undefined` if we're parsing a string of CoffeeScript.
 *
 * @returns the provided message, decorated with the node's location.
 */
function prependSourceLocation(message, coffeeScriptNode, filePath) {
  let errorLocation = "";
  const lineAndColumn = `${coffeeScriptNode.locationData.first_line}:${coffeeScriptNode.locationData.first_column}`;
  if (this.filepath) {
    errorLocation += `(${this.filepath}:${lineAndColumn})\n`;
  } else {
    errorLocation += `(line ${lineAndColumn})\n`;
  }
  return errorLocation + message;
}
/**
 * Throws a syntax error with the provided message for the provided node.
 * @param baseMessage The message to display to users.  Will be decorated with the line number, column number, and
 *                    optionally the path of the file being parsed.
 * @param coffeeScriptNode The `node` from the CoffeeScript compiler's AST where the error was found.
 * @param filePath Path to the CoffeeScript file being parsed, or `undefined` if we're parsing a string of CoffeeScript.
 */
function throwSyntaxError(baseMessage, coffeeScriptNode, filePath) {
  throw new SyntaxError(
    prependSourceLocation(baseMessage, coffeeScriptNode, filePath)
  );
}
exports.throwSyntaxError = throwSyntaxError;
/**
 * Flattens an array containing arbitrarily-nested arrays down to a single array.  Any `null` or `undefined` members in
 * those arrays *are preserved*.
 * @param array The arbitrarily-nested array to flatten.
 * @returns A flattened version of `array`, including any `null` or `undefined` members.
 */
function flatten(array) {
  return array.reduce(
    (flat, next) => flat.concat(Array.isArray(next) ? flatten(next) : next),
    []
  );
}
exports.flatten = flatten;
