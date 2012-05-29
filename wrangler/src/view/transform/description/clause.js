dw.transform.description.clause = function(container, transform, parameter, opt) {
  var clause = {},
      vis;

  vis = container.append('div');

  clause.vis = function() {
    return vis;
  }

  clause.update = function() {
    vis.text(" " + clause.text() + " ");
  }

  return clause;
};
