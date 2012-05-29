dp.grouped_bar = function(container, group, fields, opt) {
  opt = opt || {};
  opt.chart_type = 'grouped_bar';
  opt.quality_type = 'bar';
  var bar = dp.vis(container, group, fields, opt);
  return bar;
};
