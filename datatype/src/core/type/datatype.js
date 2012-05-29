dt.type.datatype = function(options) {
  options = options || {}
  var datatype = {}, constraints = options.constraints || [], name = options.name, type = options.type, stats = options.stats || {};
  stats.count = stats.count || 0;

  datatype.parse = function(v) {
    return v;
  }

  datatype.test = function(v) {
    for(var c = 0; c < constraints.length; ++c) {
      if(!constraints[c].test(v)) return false;
    }
    return true;
  }

  datatype.stats = function(v) {
    if(!arguments.length) return stats;
    stats = v;
    return datatype;
  }

  datatype.constraints = function(v) {
    if(!arguments.length) return constraints;

    constraints = v;
    return datatype;
  }

  datatype.transform = function(target_type) {

  };

  datatype.update_stats = function(value) {
    var stat, val;
    if(stat = stats.lengths) {
      val = stat[value.length];
      stat[value.length] = (val ? (val + 1) : 1);
    }
    if(stat = stats.frequency) {
      val = stat[value];
      stat[value] = (val ? (val + 1) : 1);
    }
    stats.count++;
  };

  datatype.debug = function() {
    var x = {name:name, stats:stats};
    return JSON.stringify(x);
  }

  datatype.name = function(v) {
    if(!arguments.length) return name;
    name = v;
    return datatype;
  };

  datatype.type = function(v) {
    if(!arguments.length) return type;
    type = v;
    return datatype;
  };



  datatype.code = function(values) {
    var vals = [], map,
        i, parsed,
        missing = dt.MISSING, error = dt.ERROR;
    vals.lut = datatype.create_lookup_table(values);
    map = dict(vals.lut);
    for (i = 0; i < values.length; ++i) {
      parsed = datatype.parse(values[i]);
      if (parsed === missing || parsed === error) {
        vals.push(parsed)
      } else {
        vals.push(map[parsed]);
      }
    }
    return vals;
  };

  datatype.create_lookup_table = function(values) {
    var codes = [], code_dict = {},
        i, v,
        missing = dt.MISSING, error = dt.ERROR;
    for (i = 0, len = values.length; i < len; ++i) {
      v = values[i];
      v = datatype.parse(v);
      if (v !== missing && v !== error) {
        if (code_dict[v] === undefined) { code_dict[v] = 1; codes.push(v); }
      }
    }
    codes.sort();
    return codes;
  }

  /** @private */
  function dict(lut) {
    return lut.reduce(function (a,b,i) { a[b] = i; return a; }, {});
  };

  if(name) datatype.name(options.name);
  if(type) datatype.type(options.type);
  return datatype;
};