dp.selection.manager = function(group) {
  var manager = [], current_selection;

  manager.current_selection = function(x) {
    if (!arguments.length) return current_selection;
    current_selection = x;
    return manager;
  }

  manager.add = function(selection) {
    manager.push(selection);
    selection.selection_manager(manager);
  };

  manager.remove = function(selection) {
    var index = manager.indexOf(selection);
    if (index != -1) {
      manager.splice(index);
    }
  };

  manager.clear = function() {
    group.select({source: null}, 25);
    manager.map(function(sel) {
      if (sel != current_selection) {
        sel.clear();
      }
    })
    current_selection = undefined;
  }
  return manager;
};
