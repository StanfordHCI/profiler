dp.selection.world_map = function(container, source, fields) {
  var step, selection = dp.selection(container, source, fields);

  selection.filter = function(rollup_indices) {
    var rollup = selection.rollup();
    if (rollup === undefined || rollup[0] === undefined || rollup_indices[0] === undefined || fields === undefined) {
      return;
    }
    var a = rollup[0][rollup_indices[0][0]], f = fields[0];

    if (rollup_indices.length === 1) {
      return function(t,r) {
          var v = t[f][r];
          return v === a;
      };
    } else {
      a = rollup_indices.map(function(r) {
        return rollup[0][r[0]];
      })
      return function(t,r) {
          var v = t[f][r];
          return a.indexOf(v) != -1;
      };
    }
  };

  return selection;
};
