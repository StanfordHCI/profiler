dt.type.primitive = function(options) {
  var datatype = dt.type.datatype(options);
  datatype.test = function(v) {
    var x = datatype.parse(v);
    return (x != dt.MISSING && x != dt.ERROR);
  };
  return datatype;
};
