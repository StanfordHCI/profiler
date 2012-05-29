dt.type.number = function() {
  var datatype = dt.type.uncoded_primitive({name:'number', type:dt.type.numeric});

  datatype.parse = function(v) {
    if(dt.is_missing(v)) return dt.MISSING;
    if(isNaN(v)) return dt.ERROR;
    return Number(v);
  }

  return datatype;
};

