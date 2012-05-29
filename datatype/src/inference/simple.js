dt.inference.simple = function(registry) {
  var inference = dt.inference.inference(registry);

  inference.infer_column_type = function(column, opt) {
    opt = opt || {};
    var c, t, registry = inference.registry(), type_counts, val,
        registry_length = registry.length, column_length = column.length, registry
        sample_size = Math.min(column_length, opt.sample_size || 100), non_missing_count = 0;

    type_counts = dv.array(registry.length);
    for (c = 0; c < sample_size; ++c) {
      val = column[c];
      if (dt.is_missing(val)) {
        continue;
      }

      non_missing_count++;

      for (t = 0; t < registry_length; ++t) {
        type = registry[t];
        if (type.test(val)) {
          type_counts[t]++;
        }
      }
    };




    for (t = 0; t < type_counts.length; ++t) {
      if(type_counts[t] && type_counts[t] >= .8*non_missing_count) {
        return registry[t];
      }
    };
    return dt.type.string();
  }
  return inference;
};


dt.inference.mdl = function(type, num_types) {
  /* plogm + AvgValLenlog|ξ| + f * p * logMaxLen
   * + log|values of length len(wi,j) that satisfy ds| / |values of length len(wi.j )| */
}