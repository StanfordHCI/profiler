dt.registry = function(types) {
  types = types || [];
  var registry = [];


  registry.register = function(type) {
    registry.push(type);
    registry[type.name()] = type;
    return registry;
  };

  var t;
  for(t = 0; t < types.length; ++t) {
    registry.register(types[t]);
  }

  return registry;

};

dt.registry.default_registry = function() {
  return dt.registry([dt.geo.us_state_name(), dt.geo.world_country_name(), dt.type.date.date(), dt.type.date.time(), dt.type.number(), dt.type.integer(), dt.type.string()]);
};
