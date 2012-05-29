dt.type.string = function() {
  var datatype = dt.type.primitive({name:'string', type:dt.type.nominal});

  datatype.parse = function(v) {
    if(dt.is_missing(v)) return dt.MISSING;
    return v;
  };

  return datatype;
};
