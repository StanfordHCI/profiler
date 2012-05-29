dw.transform.description.clause.filter = function(container, transform, parameter, opt) {
  var clause = dw.transform.description.clause(container, transform, parameter, opt),
      vis;

  clause.vis = function() {
    return vis;
  }

  clause.text = function() {
    var filter = transform[parameter]();
    return filter;
  }

  return clause;
};
