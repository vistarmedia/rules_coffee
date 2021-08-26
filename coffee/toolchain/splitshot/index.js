"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDeclarations = void 0;
const DeclarationGenerator_1 = require("./DeclarationGenerator");
const dom = require("dts-dom");
// use unix-style newlines by default
// TODO: Make this configurable!
dom.config.outputEol = "\n";
/**
 * Generates TypeScript declarations for the provided CoffeeScript source.
 * @param coffeeScript The source file (written in CoffeeScript) to generate declarations for.
 * @param filename The path to the file with `coffeeScript` as its contents.
 * @returns Declarations for the provided `coffeeScript`.
 */
function generateDeclarations(coffeeScript, filepath) {
  let declarations = new DeclarationGenerator_1.default(
    coffeeScript,
    filepath
  ).generate();
  return declarations.map((dec) => dom.emit(dec)).join("");
}
exports.generateDeclarations = generateDeclarations;
