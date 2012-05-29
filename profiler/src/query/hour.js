dp.query.hour = function(data, fields, opt) {
  opt = opt || {};

  var binner = [],
      num_bins = [], minmax, min, max;

  fields.map(function(field, i) {
    minmax = dt.minmax(data[field]);
    min = dt.hour(minmax[0]);
    max = dt.hour(minmax[1]);
    num_bins.push(~~dt.hour_difference(max, min) + 1);
    binner.push(dv.hour(field, min, max));
  })

  return {dims: binner, vals: [dv.count('*')], parameters:{num_bins:num_bins}, code:true};
};
