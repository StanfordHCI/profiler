dt.geo.world_country_name = function () {
  var geo = dt.type.datatype({type:dt.type.geo_world}),
      us = dt.dictionary(dt.geo.world_country_names.map(function(x){return x.toUpperCase();})).transform(dt.uppercase),
      code = dt.lookup(dt.geo.countries_to_iso2).transform(dt.uppercase);

  geo.test = function(v) {
    var x = geo.parse(v);
    return x != dt.MISSING && x != dt.ERROR;
  };

  geo.parse = function(v) {
    if(dt.is_missing(v)) return dt.MISSING;
    v = code.lookup(v);
    if(v) return v;
    return dt.ERROR;
  };

  return geo;
};
