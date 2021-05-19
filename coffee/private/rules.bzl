coffee_src_type = [".coffee"]
cjsx_src_type = [".cjsx", ".coffee"]

def _cjsx_compile_dir(ctx, dir, srcs, generate_dts):
    """
    Compiles a single directory of JSX/CoffeeScript files into JavaScript files.
    """
    out_dir = ctx.configuration.bin_dir.path + "/" + dir
    arguments = [out_dir]
    outputs = []

    for src in srcs:
        if src.extension == "cjsx":
            js_name = src.basename.replace(".cjsx", ".js")
        elif src.extension == "coffee":
            js_name = src.basename.replace(".coffee", ".js")
        else:
            fail('%s has unknown ext "%s"' % (src.short_path, src.extension))

        js_output = ctx.actions.declare_file(js_name)
        outputs.append(js_output)

        dts_path = ""

        if generate_dts:
            dts_name = js_name.replace(".js", ".d.ts")
            dts_output = ctx.actions.declare_file(dts_name)
            outputs.append(dts_output)
            dts_path = dts_output.path

        arguments.append("%s=%s=%s" % (src.path, js_output.path, dts_path))

    ctx.actions.run(
        mnemonic = "CompileCJSX",
        executable = ctx.executable._cjsxc,
        arguments = arguments,
        inputs = srcs,
        tools = [ctx.executable._node],
        outputs = outputs,
    )

    return outputs

def cjsx_compile(ctx, srcs, generate_dts):
    srcs_by_dir = {}
    for src in srcs:
        dir = src.dirname
        if dir not in srcs_by_dir:
            srcs_by_dir[dir] = [src]
        else:
            srcs_by_dir[dir].append(src)

    outputs = []
    for dir in srcs_by_dir:
        outputs += _cjsx_compile_dir(ctx, dir, srcs_by_dir[dir], generate_dts)

    return [DefaultInfo(files = depset(outputs))]

def cjsx_srcs_impl(ctx):
    return cjsx_compile(ctx, ctx.files.srcs, ctx.attr.generate_dts)

def cjsx_src_impl(ctx):
    return cjsx_compile(ctx, ctx.files.src, generate_dts = False)

# -----------------------------------------------------------------------------

cjsx_attrs = {
    "generate_dts": attr.bool(default = True),
    "_node": attr.label(
        default = Label("@com_vistarmedia_rules_js//js/toolchain:node"),
        cfg = "host",
        executable = True,
        allow_files = True,
    ),
    "_cjsxc": attr.label(
        default = Label("//coffee/toolchain:cjsxc"),
        executable = True,
        cfg = "host",
    ),
}

cjsx_srcs = rule(
    cjsx_srcs_impl,
    attrs = dict(
        cjsx_attrs,
        srcs = attr.label_list(allow_files = cjsx_src_type),
    ),
)

cjsx_src = rule(
    cjsx_src_impl,
    attrs = dict(
        cjsx_attrs,
        src = attr.label(allow_files = cjsx_src_type),
    ),
)
