dp.selection.quality = function(container, source, fields) {
  var selection = dp.selection(container, source, fields);

  selection.filter = function(rollup_indices) {
    rollup_indices = d3.merge(rollup_indices)
    if (fields.length === 1) {
      var left_index = rollup_indices[0],
          f = selection.fields()[0],
          error = dt.ERROR, missing = dt.MISSING;

      if(left_index === 0) {
        return function(t,r) {
            var v = t[f][r];
            return v !== missing && v !== error;
        };
      } else if (left_index === 1) {
        return function(t,r) {
          var v = t[f][r];
          return v === error;
        };
      } else if (left_index === 2) {
        return function(t,r) {
          var v = t[f][r];
          return v === missing;
        };
      }
    }
  }

  selection.formula = function() {
    var rollup_indices = selection.rollup_indices(),
        field_name = selection.group().data[fields[0]].name();
    return d3.merge(rollup_indices).map(function(r) {
        switch (r) {
          case 0:
            return field_name + " is valid"
          case 1:
            return field_name + " is error"
          case 2:
            return field_name + " is missing"
        }
    }).join(' or ')
  }

  return selection;
};
