dt.inference = {};

/** Abstract parent inference class */
dt.inference.inference = function(registry) {
  var inference = {};
  registry = registry || dt.registry.default_registry();

  inference.registry = function(x) {
    if(!arguments.length) return registry;
    registry = x;
    return inference;
  };

  inference.infer_types = function(table, opt) {
    var type, types;
    return table.map(function(col) {
      type = inference.infer_column_type(col.raw(), opt);
      return type;
    })
  };

  return inference;
};
