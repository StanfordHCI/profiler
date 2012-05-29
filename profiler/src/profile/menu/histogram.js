dp.menu.histogram = function(container, fields, opt) {

  function bin_change(new_value, old_value) {
    var chart = histogram.chart();
    chart.option('bins', new_value);
    chart.update();
  }

  function scale_change(new_value, old_value) {
    var chart = histogram.chart();
    if (new_value === 'linear') {
      chart.option('transform', undefined)
    } else {
      chart.option('transform', dw.derive[new_value]);
    }
    chart.update();
  }

  var items = [
    {
      name:'Bins', type:'select', options:{
      onchange:bin_change,
      select_options:{'10':10, '20':20, '50':50}}
    },
    {name:'Aggregate', type:'select', options:{select_options:{'Count':'Count', 'Average':'Average', 'Sum':'Sum'}}},
    {
      name:'Scale', type:'select', options:{
      onchange:scale_change,
      select_options:{'linear':'linear', 'log':'log', 'zscore':'zscore', 'quantile':'quantile'}}
    }
  ], histogram = dp.menu.menu(container, fields, items, opt), vis = opt.vis, chart_vis = opt.chart_vis;

  histogram.initUI();
  histogram.update();

  return histogram;

};
