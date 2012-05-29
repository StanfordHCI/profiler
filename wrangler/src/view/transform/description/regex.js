dw.transform.description.clause.regex = function(container, transform, parameter, opt) {
  var clause = dw.transform.description.clause(container, transform, parameter, opt),
      vis;

  clause.vis = function() {
    return vis;
  }

  clause.text = function() {
    var regex = transform[parameter]();

    return regex ? regex.toString() : regex;
  }

  return clause;
};
