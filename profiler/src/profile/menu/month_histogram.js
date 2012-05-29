dp.menu.month_histogram = function(container, fields, opt) {
  var month_histogram = dp.menu.menu(container, fields, [], opt);

  month_histogram.initUI();
  month_histogram.update();

  return month_histogram;
};
