load('@io_bazel_rules_js//js:def.bzl', 'js_binary')

js_binary(
  name = 'csc',
  src  = 'csc.js',
  deps = ['@coffee.script//:lib'],
  visibility = ['//visibility:public'],
)

js_binary(
  name = 'cjsxc',
  src  = 'cjsxc.js',
  deps = [
    '@coffee.react.transform//:lib',
    '@coffee.script//:lib',
    '@mkdirp//:lib',
  ],
  visibility = ['//visibility:public'],
)
