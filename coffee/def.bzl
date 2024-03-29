load("@com_vistarmedia_rules_js//js:def.bzl", "npm_install")
load(
    "@com_vistarmedia_rules_js//js:def.bzl",
    "js_binary",
    "js_library",
    "js_test",
)
load(
    "//coffee/private:rules.bzl",
    "cjsx_src",
    "cjsx_srcs",
)

def coffee_repositories():
    npm_install(
        name = "coffee-script",
        version = "1.12.2",
        sha256 = "c77cc751c5a9f13d75eb337fbb0adec99e7bfdd383f12e2789ddaabb64d14880",
    )
    npm_install(
        name = "coffee-react-transform",
        version = "4.0.0",
        sha256 = "6519abf3c62ae16e7745d6f197ec062533277559f042ca1dc615bfe08ef4fe1d",
    )

def cjsx_library(name, **kwargs):
    src_name = name + ".js_src"
    cjsx_srcs(name = src_name, srcs = kwargs.pop("srcs"))

    js_library(
        name = name,
        srcs = [src_name],
        compile_type = [".js", ".d.ts"],
        **kwargs
    )

coffee_library = cjsx_library

def cjsx_binary(name, **kwargs):
    src_name = name + ".js_src"
    cjsx_src(name = src_name, src = kwargs.pop("src"))

    js_binary(
        name = name,
        src = src_name,
        **kwargs
    )

coffee_binary = cjsx_binary

def cjsx_test(name, **kwargs):
    src_name = name + ".js_src"
    requires = kwargs.pop("requires", [])
    cjsx_srcs(name = src_name, srcs = kwargs.pop("srcs"), generate_dts = False)

    js_test(
        name = name,
        srcs = [src_name],
        requires = requires,
        **kwargs
    )

coffee_test = cjsx_test
