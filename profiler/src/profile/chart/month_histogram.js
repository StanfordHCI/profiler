dp.chart.month_histogram = function(container, fields, opt)
{
  opt = opt || {};
  var group = opt.group || this, months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  opt.query = dp.query.month;
  opt.selection = dp.selection.month
  opt.tick_format = function(d, i) {
    return months[d];
  }
  opt.tick_text_anchor = "center";

  var hist = dp.chart.histogram.apply(group, [container, fields, opt]);

  hist.type = function() { return 'month_histogram'; };
  return hist;
};
