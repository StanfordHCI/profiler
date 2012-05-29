dp.query.month_year = function(data, fields, opt) {
  opt = opt || {};

  var binner = [],
      num_bins = [], minmax, min, max;

  fields.map(function(field, i) {
    minmax = dt.minmax(data[field]);
    min = dt.day(minmax[0]);
    max = dt.day(minmax[1]);
    num_bins.push(dt.month_year_difference(max, min) + 1);
    binner.push(dv.month_year(field, min, max));
  })

  return {dims: binner, vals: [dv.count('*')], parameters:{num_bins:num_bins}, code:true};
};
