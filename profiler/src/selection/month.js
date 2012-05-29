dp.selection.month = function(container, source, fields) {
  var step, selection = dp.selection(container, source, fields);

  selection.filter = function(rollup_indices) {
    rollup_indices = d3.merge(rollup_indices)

    if (fields.length === 1) {
      var rollup = selection.rollup(),
          left_index = rollup_indices[0],
          right_index = rollup_indices[1] || left_index,
          left_boundary = rollup[0][left_index],
          right_boundary = rollup[0][right_index]+1,
          include_boundary = (right_index === (rollup[0].length-1)),
          f = selection.fields()[0];

      return function(t,r) {
          var v = t[f][r];
          if(!v) return false;
          v = v.getMonth();
          return v >= left_boundary && (v <= right_boundary && (include_boundary || v != right_boundary));
      };
    }

    if(fields.length > 1) {
      console.error('Month selection not yet supported for more than one field.')
    }


  };

  return selection;
};
