dt.type.bool = function() {

  var datatype = dt.type.uncoded_primitive({name:'bool', type:dt.type.numeric, stats:{lengths:{},frequency:{}}});

  datatype.parse = function(v) {
    var n;
    if(dt.is_missing(v)) return dt.MISSING;
    if (v === 1 || v === 0) {
      return v;
    }
    v = (v+"").toUpperCase();
    if (/^Y(ES)*|T(RUE)*$/.test(v)) {
      return 1;
    } else if (/^N(O)*|F(ALSE)*$/.test(v)) {
      return 0;
    }
    return dt.ERROR;
  }

  return datatype;

};
