dp.query.month = function(data, fields, opt) {
  opt = opt || {};

  var binner = [],
      num_bins = [];

  fields.map(function(field, i) {
    num_bins.push(12);
    binner.push(dv.month(field));
  })

  return {dims: binner, vals: [dv.count('*')], parameters:{num_bins:num_bins}, code:true};
};
