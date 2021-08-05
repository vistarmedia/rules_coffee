var fs = require("fs");
var mkdirp = require("mkdirp");
var path = require("path");
var splitshot = require("@hulu/splitshot");

var compileCJSX = require("coffee-react-transform");
var compileCoffee = require("coffee-script").compile;

var outDir = process.argv[2];
mkdirp(outDir, function (err) {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  for (var i = 3; i < process.argv.length; i++) {
    var files = process.argv[i].split("=");
    var srcFile = files[0];
    var jsFile = files[1];
    var dtsFile = files[2];

    var coffeeSrc = compileCJSX(fs.readFileSync(srcFile, "utf8"));
    var opts = { inlineMap: true, sourceRoot: srcFile };
    var jsSrc = compileCoffee(coffeeSrc, opts);
    fs.writeFileSync(jsFile, jsSrc, "");

    if (dtsFile) {
      // TODO:  this breaks on destructured imports... which we use everywhere
      var dtsSrc = splitshot.generateDeclarations(coffeeSrc);
      /* const dtsSrc = `
        export type __export = any;
        declare const __export__: __export;
        export default __export__;
      `; */
      fs.writeFileSync(dtsFile, dtsSrc, "");
    }
  }
});
