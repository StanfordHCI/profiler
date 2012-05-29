dp.world_map = function(container, group, fields, opt) {
  opt = opt || {};
  opt.chart_type = 'world_map';
  opt.quality_type = 'bar';
  var bar = dp.vis(container, group, fields, opt);
  return bar;
};
