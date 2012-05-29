

dt.type.date = function(formats) {

  var datatype = dt.type.uncoded_primitive({name:'date', type:dt.type.ordinal, stats:{lengths:{},frequency:{}}}),
      formats = formats || dt.type.date.default_formats;

  datatype.parse = function(v) {
    var n, i, v = v + '';
    if(dt.is_missing(v)) return dt.MISSING;
    for (i = 0; i < formats.length; ++i) {
      n = formats[i].parse(v);
      if (n) {
        return n;
      }
    }
    return dt.ERROR;
  }

  datatype.formats = function(x) {
    if(!arguments.length) return formats;
    formats = x.map(function(f) {
      return d3.time.format(f);
    });
    return datatype;
  }

  datatype.formats(formats);

  return datatype;

};

dt.type.date.default_formats = ['%a', '%A', '%b', '%B', '%c',
    '%d', '%e', '%H', '%I', '%j', '%m', '%M', '%p', '%S', '%U', '%w',
    '%W', '%x', '%X', '%y', '%Y', '%z'];