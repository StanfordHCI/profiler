dp.query.year = function(data, fields, opt) {
  opt = opt || {};

  var binner = [],
      num_bins = [];

  fields.map(function(field, i) {
    minmax = dt.minmax(data[field]);
    min = dt.year(minmax[0]);
    max = dt.year(minmax[1]);
    num_bins.push(dt.year_difference(max, min) + 1);
    binner.push(dv.year(field, min.getFullYear(), max.getFullYear()));
  })

  return {dims: binner, vals: [dv.count('*')], parameters:{num_bins:num_bins}, code:true};
};
