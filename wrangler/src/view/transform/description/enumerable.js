dw.transform.description.clause.enumerable = function(container, transform, parameter, opt) {
  var clause = dw.transform.description.clause(container, transform, parameter, opt),
      vis;

  clause.vis = function() {
    return vis;
  }

  clause.text = function() {
    return transform[parameter]().substr(0, 12)
  }

  return clause;
};
