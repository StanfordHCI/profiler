dp.menu.text_cluster = function(container, fields, opt) {
  var items = [
  ], menu = dp.menu.menu(container, fields, items, opt), vis = opt.vis, chart_vis = opt.chart_vis;

  menu.initUI();
  menu.update();
  return menu;
};
