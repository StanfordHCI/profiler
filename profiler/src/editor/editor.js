dp.editor = function(container, fields, opt) {
  opt = opt || {};
  var editor = {},
      group = this,
      bar = {},
      data = group.data, rollup, cleaned_rollup,

      editor_width = opt.width || 200,
      editor_height = (opt.height || 30),
      vis, query;

  if(typeOf(container) === 'string') {
    container = d3.select('#'+ container)
        .append('div')
        .attr('width', editor_width)
        .attr('height', editor_height);
  }

  editor.width = function() {
    if(!arguments.length) return editor_width;
  }

  editor.height = function() {
    if(!arguments.length) return editor_height;
  }

  editor.container = function () {
    if(!arguments.length) return container;
  }

  return editor;
};