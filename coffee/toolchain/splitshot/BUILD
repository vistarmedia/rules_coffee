load("@com_vistarmedia_rules_js//js:def.bzl", "js_library")

js_library(
    name = "splitshot",
    srcs = [
        "ContextFlags.js",
        "DeclarationGenerator.js",
        "index.js",
        "utils.js",
    ],
    visibility = ["//visibility:public"],
    deps = [
        "@coffee.script//:lib",
        "@dts.dom//:lib",
        "@yargs//:lib",
    ],
)
