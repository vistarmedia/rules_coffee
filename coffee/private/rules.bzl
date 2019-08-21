coffee_src_type = ['.coffee']
cjsx_src_type   = ['.cjsx', '.coffee']


def _coffee_compile_dir(ctx, dir, srcs):
  """
  Compiles a single directory of CoffeeScript files into JavaScript files. The
  compiler tries to infer a reasonable source root when dealing with input files
  from multiple directories, which would be incorrect here in all but the most
  pathological of cases.
  """
  out_dir   = ctx.configuration.bin_dir.path + '/' + dir
  outputs   = []
  arguments = [
    '--no-header',
    '--compile',
    '--inline-map',
    '--output', out_dir,
  ]

  for src in srcs:
    js_name = src.basename.replace('.coffee', '.js')
    output  = ctx.actions.declare_file(js_name)

    arguments.append(src.short_path)
    outputs.append(output)

  ctx.actions.run(
    mnemonic   = 'CompileCoffeeScript',
    executable = ctx.executable._csc,
    arguments  = arguments,
    inputs     = srcs,
    tools      = [ctx.executable._node],
    outputs    = outputs,
  )

  return outputs


def _cjsx_compile_dir(ctx, dir, srcs):
  """
  Compiles a single directory of JSX/CoffeeScript files into JavaScript files.
  """
  out_dir   = ctx.configuration.bin_dir.path + '/' + dir
  arguments = [out_dir]
  outputs   = []

  for src in srcs:
    if src.extension == 'cjsx':
      js_name = src.basename.replace('.cjsx', '.js')
    elif src.extension == 'coffee':
      js_name = src.basename.replace('.coffee', '.js')
    else:
      fail('%s has unknown ext "%s"' % (src.short_path, src.extension))

    output = ctx.actions.declare_file(js_name)
    outputs.append(output)
    arguments.append('%s=%s' % (src.path, output.path))

  ctx.actions.run(
    mnemonic   = 'CompileCJSX',
    executable = ctx.executable._cjsxc,
    arguments  = arguments,
    inputs     = srcs,
    tools      = [ctx.executable._node],
    outputs    = outputs,
  )

  return outputs


def coffee_compile(ctx, srcs):
  """
  Compiles a set of CoffeeScript sources in arbitrary directories to JavaScript.
  Groups source files by directory beforehand and invokes a compilation step for
  each source directory to keep the output sane.
  This, in practice, will still only be one compiler invocation for any module.
  """
  srcs_by_dir = {}
  for src in srcs:
    dir = src.dirname
    if dir not in srcs_by_dir:
      srcs_by_dir[dir] = [src]
    else:
      srcs_by_dir[dir].append(src)

  outputs = []
  for dir in srcs_by_dir:
    outputs += _coffee_compile_dir(ctx, dir, srcs_by_dir[dir])

  return [
    DefaultInfo(
      files = depset(outputs),
      runfiles = ctx.runfiles(collect_default=True),
    )
  ]


def cjsx_compile(ctx, srcs):
  srcs_by_dir = {}
  for src in srcs:
    dir = src.dirname
    if dir not in srcs_by_dir:
      srcs_by_dir[dir] = [src]
    else:
      srcs_by_dir[dir].append(src)

  outputs = []
  for dir in srcs_by_dir:
    outputs += _cjsx_compile_dir(ctx, dir, srcs_by_dir[dir])

  return [DefaultInfo(files = depset(outputs))]


def coffee_srcs_impl(ctx):
  return coffee_compile(ctx, ctx.files.srcs)

def coffee_src_impl(ctx):
  return coffee_compile(ctx, ctx.files.src)

def cjsx_srcs_impl(ctx):
  return cjsx_compile(ctx, ctx.files.srcs)

def cjsx_src_impl(ctx):
  return cjsx_compile(ctx, ctx.files.src)

# -----------------------------------------------------------------------------

attrs = {
  '_node':  attr.label(
    default     = Label('@com_vistarmedia_rules_js//js/toolchain:node'),
    cfg         = 'host',
    executable  = True,
    allow_files = True),
}

coffee_attrs = dict(attrs,
  _csc = attr.label(
    default    = Label('//coffee/toolchain:csc'),
    executable = True,
    cfg        = 'host'),
)

cjsx_attrs = dict(attrs,
  _cjsxc = attr.label(
    default    = Label('//coffee/toolchain:cjsxc'),
    executable = True,
    cfg        = 'host'),
)

coffee_srcs = rule(
  coffee_srcs_impl,
  attrs = dict(coffee_attrs,
    srcs = attr.label_list(allow_files=coffee_src_type),
  ),
)

coffee_src = rule(
  coffee_src_impl,
  attrs = dict(coffee_attrs,
    src = attr.label(allow_files=coffee_src_type),
  ),
)

cjsx_srcs = rule(
  cjsx_srcs_impl,
  attrs = dict(cjsx_attrs,
    srcs = attr.label_list(allow_files=cjsx_src_type),
  ),
)

cjsx_src = rule(
  cjsx_src_impl,
  attrs = dict(cjsx_attrs,
    src = attr.label(allow_files=cjsx_src_type),
  ),
)
