dp.menu.bar = function(container, fields, opt) {

  function sort_change(new_value, old_value) {
    var chart = bar.chart();
    chart.option('sort', new_value);
    chart.update();
  }

  var items = [
    {
      name:'Sort', type:'select', options:{
      onchange:sort_change,
      select_options:{'count':'count', alphabet:'alphabetically'}}
    }], bar = dp.menu.menu(container, fields, items, opt);

  bar.initUI();
  bar.update();

  return bar;
};
