dp.query.bin = function(data, fields, opt) {
  opt = opt || {};
  opt.min = opt.min || [], opt.max = opt.max || [], opt.step = opt.step || [];

  var bins = opt.bins || 10, binner = [], min = [], max = [],
      step = [], num_bins = [], bin;

  fields.map(function(field, i) {
    bin = dv_bins(data[field], bins, opt.min[i], opt.max[i], opt.step[i]);
    min.push(bin[0]), max.push(bin[1]), step.push(bin[2]);
    num_bins.push(Math.ceil((max[i] - min[i]) / step[i]));
    binner.push(dv.bin(field, step[i], min[i], max[i]));
  })

  return {dims: binner, vals: [dv.count('*')], parameters:{num_bins:num_bins, step:step, min:min, max:max}, code:true};
};
