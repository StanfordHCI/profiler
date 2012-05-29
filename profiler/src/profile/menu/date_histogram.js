dp.menu.date_histogram = function(container, fields, opt) {

  function bin_change(new_value, old_value) {
    var chart = line.chart();
    chart.option('query', dp.factory.date().query(new_value));
    chart.option('tick_format', dp.factory.date().ticks(new_value));
    chart.update();
  }

  var items = [
    {
      name:'Bins', type:'select', options:{
      onchange:bin_change,
      select_options:{'year':'year', 'month':'month', 'day':'day'}}
    }
  ], line = dp.menu.menu(container, fields, items, opt), vis = opt.vis, chart_vis = opt.chart_vis;

  line.initUI();
  line.update();

  return line;

};
