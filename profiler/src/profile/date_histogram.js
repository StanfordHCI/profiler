dp.date_histogram = function(container, group, fields, opt) {
  opt = opt || {};
  opt.chart_type = 'date_histogram';
  opt.quality_type = 'bar';


  var type = dp.factory.date().default_type(group.data[fields[0]]);
  opt.query = dp.factory.date().query(type);
  opt.tick_format = dp.factory.date().ticks(type);
  var line = dp.vis(container, group, fields, opt);
  return line;
};
