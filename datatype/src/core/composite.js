dt.type.composite = function(types) {

  var datatype = dt.type.datatype();

  stats = datatype.stats();

  datatype.update_stats = function(values) {
    if(values.length != types.length) console.error('# of values must match # of types.');
    for(var i = 0; i < values.length; ++i) {
      types[i].update_stats(values[i])
    }
    stats.count++;
  }

  datatype.debug = function() {
    var x = {types:types.map(function(t) {
      return t.debug();
    }),
    stats:stats};
    return x;
  }


  return datatype;
};
