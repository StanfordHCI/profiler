dp.text_cluster = function(container, group, fields, opt) {
  opt = opt || {};
  opt.chart_type = 'text_cluster';
  opt.quality_type = 'spreadsheet';
  opt.container_dom_type = 'div';
  opt.child_dom_type = 'div';
  opt.height = 300;
  var vis = dp.vis(container, group, fields, opt);
  return vis;
};
