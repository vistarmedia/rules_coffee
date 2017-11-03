# Rules Coffee
Compiles [CoffeeScript](http://coffeescript.org) files and exposes them as
JavaScript targets.

## coffee\_src
The lowest level rule transpiles CoffeeScript into JavaScript. It comes in two
flavors, `coffee_srcs`, which transpiles an arbitrary number of CoffeeScript
sources in arbitrary directories, and `coffee_src`, which transpiles exactly one
CoffeeScript into one JavaScript output.

    ```python
    load('@com_vistarmedia_rules_coffee//coffee:def.bzl',
      'coffee_src',
      'coffee_srcs')

    # Generates:
    #   bazel-bin/{pkg}/file-a.js
    coffee_src(
      name = 'src',
      src  = 'file-a.coffee',
    )

    # Generates:
    #   bazel-bin/{pkg}/file-a.js
    #   bazel-bin/{pkg}/file-b.js
    coffee_srcs(
      name = 'srcs',
      srcs = [
        'file-a.coffee',
        'file-b.coffee',
      ],
    )
    ```
## coffee\_library
Translates a collection of CoffeeScript sources files into a `js_library`.

    ```python
    load('@com_vistarmedia_rules_coffee//coffee:def.bzl', 'coffee_library')

    # Generates:
    #  //{pkg}:lib js_library target
    coffee_library(
      name = 'lib',
      srcs = [
        'file-a.coffee',
        'file-b.coffee',
      ],
      deps = [
        ':local',
        '//dep/in:rep',
        '@external//:lib',
      ],
    )
    ```

## coffee\_binary
Translates a CoffeeScript source file into a `js_binary`.

    ```python
    load('@com_vistarmedia_rules_coffee//coffee:def.bzl', 'coffee_binary')

    # Generates:
    #  //{pkg}:bin js_binary target
    coffee_binary(
      name = 'bin',
      src  = 'main.coffee',
      deps = [
        ':local',
        '//dep/in:rep',
        '@external//:lib',
      ],
    )
    ```

## coffee\_test
Translates a collection of CoffeeScript sources files into a `js_test`.

    ```python
    load('@com_vistarmedia_rules_coffee//coffee:def.bzl', 'coffee_test')

    # Generates:
    #  //{pkg}:test js_test target
    coffee_test(
      name = 'test',
      size = 'small',
      srcs  = [
        'lib-a_test.coffee',
        'lib-b_test.coffee',
      ]
      deps = [
        ':lib',
      ],
    )
    ```

## Implementation weirdness
The CoffeeScript compiler handles source files in different directories kind of
strangely. Namely, it tries to find the longest path prefix shared by all input
files and uses that as the root source directory. The output directory structure
is based on that.

Though it's rare that a `coffee_*` rule would encounter rules in multiple
directories, there's no way to inform the compiler of a strict root. Instead,
these rules group all sources by their directory, and performs a compilation for
each.
