dt.geo.us_state_name = function () {
  var geo = dt.type.datatype({type:dt.type.geo}),
      us = dt.dictionary(dt.geo.us_state_names.map(function(x){return x.toLowerCase();})).transform(dt.lowercase),
      code = dt.lookup(dt.geo.states_to_fips).transform(dt.lowercase);

  geo.test = function(v) {
    var x = geo.parse(v);
    return x != dt.MISSING && x != dt.ERROR;
  };

  geo.code = function(values) {
    var vals = [], map,
        i, geo_lookup, lut = [];
    geo_lookup = code.lut();
    vals.lut = geo_lookup.inverted;
    for (i = 0; i < values.length; ++i) {
      vals.push(geo.parse(values[i]));
    }
    return vals;
  };

  geo.parse = function(v) {
    if(dt.is_missing(v)) {
      return dt.MISSING;
    }
    v = code.lookup(v);
    if(v) {
      return +v;
    }
    return dt.ERROR;
  };

  return geo;
};
