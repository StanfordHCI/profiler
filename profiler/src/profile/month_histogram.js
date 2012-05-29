dp.month_histogram = function(container, group, fields, opt) {
  opt = opt || {};
  opt.chart_type = 'month_histogram';
  opt.quality_type = 'bar';
  opt.query = dp.query.bin;
  var selection,
      hist = dp.vis(container, group, fields, opt);
  return hist;
};
