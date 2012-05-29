dt.type.uncoded_primitive = function(options) {
  var datatype = dt.type.primitive(options);


  datatype.code = function(values) {
    var vals = [],
        i, v;
    for (i = 0, len = values.length; i < len; ++i) {
      v = values[i];
      v = datatype.parse(v);
      vals.push(v);
    }
    return vals;
  };

  return datatype;
};
