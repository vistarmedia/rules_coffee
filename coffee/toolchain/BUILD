load("@com_vistarmedia_rules_js//js:def.bzl", "js_binary")

js_binary(
    name = "cjsxc",
    src = "cjsxc.js",
    visibility = ["//visibility:public"],
    deps = [
        "@coffee.react.transform//:lib",
        "@coffee.script//:lib",
        "@hulu.splitshot//:lib",
        "@mkdirp//:lib",
    ],
)
