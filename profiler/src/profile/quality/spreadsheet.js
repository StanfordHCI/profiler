dp.quality.spreadsheet = function(container, fields, opt) {
  var group = this,
      bar = dp.chart.chart(container, group, fields, opt),
      data = group.data, rollup, cleaned_rollup,
      min_bar_width = 2;

  bar.width(opt.width || 200);
  bar.height(opt.height || 30);
  bar.initBins = function() {

  };

  bar.draw = function() {

  };

  bar.select = function() {

  }

  bar.type = function() { return 'spreadsheet'; };
  bar.initUI();
  return bar;
};
