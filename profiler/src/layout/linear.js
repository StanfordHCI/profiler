dp.layout.linear = function(opt) {
  opt = opt || {};
  var layout = [],
      table_layout = opt.table_layout || dp.layout.table.uniform();

  layout.add_vis = function(vis) {
    layout.push(vis)
  }

  layout.refresh = function() {
    var width;
    layout.forEach(function(vis, i){
      width = table_layout.column_width(layout, vis, i, {});
      vis.width(width);
      vis.update();
      vis.container().style('display', 'inline-block')
    })
  }

  return layout;
};
