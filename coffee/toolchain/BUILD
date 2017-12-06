load("@io_bazel_rules_js//js:def.bzl", "js_binary")

js_binary(
    name = "csc",
    src = "csc.js",
    visibility = ["//visibility:public"],
    deps = ["@coffee.script//:lib"],
)

js_binary(
    name = "cjsxc",
    src = "cjsxc.js",
    visibility = ["//visibility:public"],
    deps = [
        "@coffee.react.transform//:lib",
        "@coffee.script//:lib",
        "@mkdirp//:lib",
    ],
)
