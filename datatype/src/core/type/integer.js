dt.type.integer = function() {

  var datatype = dt.type.uncoded_primitive({name:'int', type:dt.type.numeric, stats:{lengths:{},frequency:{}}});

  datatype.parse = function(v) {
    var n;
    if(dt.is_missing(v)) return dt.MISSING;
    n = parseInt(v);
    if(n !== Number(v)) return dt.ERROR;
    return n;
  }

  return datatype;

};
