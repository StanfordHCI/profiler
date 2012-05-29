dt.geo.world_country_iso2 = function() {
  return dt.type.datatype({
    constraints:[dt.dictionary(dt.geo.world_country_iso2s).transform(dt.uppercase)]
    });
};
