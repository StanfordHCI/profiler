dp.spreadsheet = function(container, group, fields, opt) {
  opt = opt || {};
  opt.chart_type = 'spreadsheet';
  opt.quality_type = 'spreadsheet';
  opt.container_dom_type = 'div';
  opt.child_dom_type = 'div';
  opt.height = 300;
  opt.query = undefined;

  var header_vis = opt.header_vis;
  if (false && header_vis) {
    var layout = dp.layout.linear();
    jQuery("#"+container).empty()
    d3.select('#'+ container)
        .append('div').attr('width', 22).style('min-width', 22).style('max-width',22)
        .style('display', 'inline-block')
    group.data.forEach(function(c, i) {
      var header_container = d3.select('#'+ container)
          .append('div').attr('id', 'test_id'+c.name()).style('display', 'inline-block')
      var vis = dp.factory().default_vis(group, [group.data[i].name()], [], header_container.attr('id'))
          .plot.height(60);
      layout.add_vis(vis)
      vis.update()
    })
    layout.refresh();
  }

  var spreadsheet = dp.vis(container, group, fields, opt);
  return spreadsheet;
};