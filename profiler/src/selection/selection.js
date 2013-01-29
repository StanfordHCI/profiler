dp.selection = function(group, source, fields) {
  var selection = {},
      marks, targets, fields = fields, source = source, rollup, rollup_indices = [], query_parameters, selection_manager,

      index;

  selection.marks = function(x) {
    if(!arguments.length) return marks;
    marks = x;
    selection.update();
    return selection;
  }

  selection.group = function() {
    return group;
  }

  selection.selection_manager = function(x) {
    if(!arguments.length) return selection_manager;
    selection_manager = x;
    return selection;
  }

  selection.index = function(x) {
    if(!arguments.length) return index;
    index = x;
    selection.update();
    return selection;
  }

  selection.query_parameters = function(x) {
    if(!arguments.length) return query_parameters;
    query_parameters = x;
    return selection;
  }

  selection.rollup = function(x, index) {
    if(!arguments.length) return rollup;
    rollup = x;
    if (index) {
      rollup = rollup.map(function(c) {
        return index.map(function(i) {
          return c[i];
        })
      })
    }
    selection.update();
    return selection;
  }

  selection.rollup_indices = function(x) {
    if(!arguments.length) return rollup_indices;
    rollup_indices = x;
    selection.update();
    return selection;
  }

  selection.fields = function(x) {
    if(!arguments.length) return fields;
    fields = x;
    selection.update();
    return selection;
  }

  selection.targets = function(x) {
    if(!arguments.length) return targets;
    targets = x;
    selection.update();
    return selection;
  }


  selection.update = function() {
    if(!marks || !targets) {
      return;
    }

    targets.on('mouseover', selection.mouseover)
        .on('mousedown', selection.mousedown)
        .on('click', selection.click)
        .on('mouseout', selection.mouseout);
  };

  selection.mouseover = function(d, i) {
    var formula = selection.formula();
    if (formula && formula.length) {
      d3.select('#formulaView').html(formula);
    }
    selection.select_element(d, i, {dragging:true})
  }

  selection.mousedown = function(d, i) {
    source.option('containing_vis').select({});
    if (!d3.event.metaKey) {
      rollup_indices = [];
    }
    d3.event.stopPropagation();
    dp.selection.is_mouse_down = 1;
    selection_manager.current_selection(selection);
    selection_manager.clear();
    selection.select_element(d, i, {mouse_down:true})
  }

  selection.current_rollup_index = function() {
    return rollup_indices[rollup_indices.length-1];
  }

  selection.select_element = function(d, i, opt) {


    opt = opt || {};
    i = index ? index[i] : i;
    var current_rollup = selection.current_rollup_index(), selected_index;
    if (opt.mouse_down || selection.is_mouse_down()) {
      if (current_rollup) {
        selected_index = current_rollup.indexOf(i);
      }
      if (selected_index > -1) {
        selection.remove_from_current_rollup(current_rollup, i, selected_index);
      } else if (opt.dragging) {
        if (current_rollup) {
          selection.add_to_current_rollup(current_rollup, i);
        }
      } else {
        rollup_indices.push([i]);
      }
      selection.update_brushing();
      selection.select();
    }
  }

  selection.remove_from_current_rollup = function(current_rollup, index, selected_index) {
    current_rollup.splice(selected_index+1, current_rollup.length-(selected_index+1));
  }

  selection.add_to_current_rollup = function(current_rollup, index) {
    current_rollup.push(index);
  }

  selection.update_brushing = function() {
    d3.selectAll(marks[0]).classed('brush_over', false)
    d3.merge(rollup_indices).map(function(i) {
      d3.select(marks[0][i]).classed('brush_over', true);
    })
  }

  selection.select = function () {
    group.select({source: source, filter: selection.filter(rollup_indices)}, 25);
    group.formula_editor().formula(selection.formula());
  }

  selection.click = function(d, i) {

  }

  selection.is_mouse_down = function() {
    return dp.selection.is_mouse_down;
  }

  selection.mouseout = function(d, i) {







  }

  selection.clear = function() {
    rollup_indices = [];
    selection.update_brushing();
  }

  selection.filter = function(rollup_indices) {
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
  }

  selection.formula = function() {
    var f = fields[0];
    return d3.merge(rollup_indices).map(function(r) {
        return group.data[f].name() + ' = "' + group.data[f].lut[rollup[0][r]] + '"';
    }).join(' or ')
  }

  selection.update();
  return selection;
};