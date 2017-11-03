load('@io_bazel_rules_js//js:def.bzl', 'npm_install')
load('@io_bazel_rules_js//js:def.bzl',
  'js_binary',
  'js_library',
  'js_test')

load('//coffee/private:rules.bzl',
  'cjsx_src',
  'cjsx_srcs',
  'coffee_src',
  'coffee_srcs')


def coffee_repositories():
  npm_install(
    name = 'coffee-script',
    version = '1.12.2',
    sha256 = 'c77cc751c5a9f13d75eb337fbb0adec99e7bfdd383f12e2789ddaabb64d14880',
  )
  npm_install(
    name = 'coffee-react-transform',
    version = '4.0.0',
    sha256 = '6519abf3c62ae16e7745d6f197ec062533277559f042ca1dc615bfe08ef4fe1d',
  )


def coffee_library(name, **kwargs):
  src_name = name + '.js_src'
  coffee_srcs(name=src_name, srcs=kwargs.pop('srcs'))

  js_library(
    name = name,
    srcs = [src_name],
    **kwargs)


def cjsx_library(name, **kwargs):
  src_name = name + '.js_src'
  cjsx_srcs(name=src_name, srcs=kwargs.pop('srcs'))

  js_library(
    name = name,
    srcs = [src_name],
    **kwargs)


def cjsx_binary(name, **kwargs):
  src_name = name + '.js_src'
  cjsx_src(name=src_name, src=kwargs.pop('src'))

  js_binary(
    name = name,
    src  = src_name,
    **kwargs)


def coffee_binary(name, **kwargs):
  src_name = name + '.js_src'
  coffee_src(name=src_name, src=kwargs.pop('src'))

  js_binary(
    name = name,
    src  = src_name,
    **kwargs)


def coffee_test(name, **kwargs):
  src_name = name + '.js_src'
  coffee_srcs(name=src_name, srcs=kwargs.pop('srcs'))

  js_test(
    name  = name,
    srcs  = [src_name],
    **kwargs)


def cjsx_test(name, **kwargs):
  src_name = name + '.js_src'
  cjsx_srcs(name=src_name, srcs=kwargs.pop('srcs'))

  js_test(
    name  = name,
    srcs  = [src_name],
    **kwargs)
