dp.scatter = function(container, group, fields, opt) {
  opt = opt || {};
  opt.chart_type = 'scatter';
  opt.quality_type = 'scatter';
  opt.query = dp.query.bin;
  var scat = dp.vis(container, group, fields, opt);
  return scat;
};