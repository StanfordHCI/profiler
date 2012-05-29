dp.query.group = function(data, fields, opt) {
  return {dims: [fields[0]], vals: [dv.count('*')], code:false};
};
