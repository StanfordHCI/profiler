dp.selection.range = function(container, source, fields) {
  var step, selection = dp.selection(container, source, fields);

  selection.step = function(x) {
    if(!arguments.length) return selection.query_parameters().step;
    selection.query_parameters().step = x;
    return selection;
  }

  selection.num_bins = function(x) {
    if(!arguments.length) return selection.query_parameters().num_bins;
    selection.query_parameters().num_bins = x;
    return selection;
  }

  selection.filter = function(rollup_indices) {
    rollup_indices = d3.merge(rollup_indices);
    fields = selection.fields();

    if (fields.length === 1) {
      var rollup = selection.rollup(),
          step = selection.step()[0],
          left_index = rollup_indices[0],
          right_index = rollup_indices[rollup_indices.length-1],
          temp_index, left_boundary, right_boundary, include_boundary, f;

      if (right_index === undefined) {
        right_index = left_index;
      }

      if (left_index > right_index) {
        temp_index = left_index;
        left_index = right_index;
        right_index = temp_index;
      }
      left_boundary = rollup[0][left_index];
      right_boundary = rollup[0][right_index]+step;
      include_boundary = (right_index === (rollup[0].length-1));
      f = selection.fields()[0];

      return function(t,r) {
          var v = t[f][r];
          if (v === null || v === undefined) return false;
          return v >= left_boundary && v <= right_boundary && (include_boundary || v != right_boundary);
      };
    }

    if (fields.length === 2) {
      var rollup = selection.rollup(),
          step = selection.step(),
          left_index = rollup_indices[0],
          right_index = rollup_indices[rollup_indices.length-1] || left_index,
          left_boundaries = fields.map(function(f, i){return rollup[i][left_index]}),
          right_boundaries = fields.map(function(f, i){return rollup[i][right_index]+step[i]}),
          include_boundaries = fields.map(function(f, i){return (rollup[i][right_index] === rollup[i][rollup[i].length-1])});
      console.log(left_boundaries)
      console.log(right_boundaries)
      return function(t,r) {
          var v;
          for(var i = 0; i < fields.length; ++i) {
            v = t[fields[i]][r];
            if (v === null || v === undefined) return false;
            if(!(v >= left_boundaries[i] && v <= right_boundaries[i] &&
                (include_boundaries[i] || v != right_boundaries[i]))) {
              return false;
            };
          }
          return true;
      };
    }
  };

  function fill_current_rollup(current_rollup, start_index, end_index) {
    var rollup = selection.rollup(),


        reversed = (end_index < start_index),
        start_end = get_min_max(start_index, end_index),
        start = start_end[0], end = start_end[1], x_range, y_range,
        num_bins = selection.num_bins(),
        xbins = num_bins[0], ybins = num_bins[1], x, y;
    current_rollup.length = 0;
    x_range = [get_val(rollup, 0, start), get_val(rollup, 0, end, true)];
    y_range = [get_val(rollup, 1, start), get_val(rollup, 1, end, true)];
    d3.range(rollup[0].length).forEach(function(i) {
      x = rollup[0][i];
      y = rollup[1][i];
      if (x_range[0] <= x && x_range[1] > x
          && y_range[0] <= y && y_range[1] > y) {
        current_rollup.push(i);
      }
    })
    if (reversed) {
      current_rollup.reverse();
    }
    console.log(current_rollup);
  }

  if (fields.length > 1) {
    selection.remove_from_current_rollup = function(current_rollup, index, selected_index) {
      fill_current_rollup(current_rollup, current_rollup[0], index);
    }

    selection.add_to_current_rollup = function(current_rollup, index) {
      fill_current_rollup(current_rollup, current_rollup[0], index);
    }
  }

  function get_start_end(range) {
    var min = range[0],
        max = range[range.length-1];
    return (min > max) ? [max, min] : [min, max];
  }

  function get_min_max(x, y) {
    return (x > y) ? [y, x] : [x, y]
  }

  function get_val(rollup, field, index, is_right_boundary) {
    return rollup[field][index] + (is_right_boundary ? (selection.step()[field]): 0);
  }

  function include_boundary(rollup, field, index) {
    return index === (rollup[field].length-1)
  }

  selection.formula = function() {
    var f = fields[0], start, end, start_end,
        rollup = selection.rollup(), rollup_indices = selection.rollup_indices(),
        group = selection.group(), comp;
    return rollup_indices.map(function(range) {
        start_end = get_start_end(range);
        start = get_val(rollup, 0, start_end[0]);
        end = get_val(rollup, 0, start_end[1], true);
        comp = include_boundary(rollup, 0, start_end[1]) ? ' <= ' : ' < ';
        return group.data[f].name() + ' >= ' + start + ' and ' + group.data[f].name() + comp + end;
    }).join(' or ')
  }

  return selection;
};
