dw.transform.description.clause.row_index = function(container, transform, parameter, opt) {
  var clause = dw.transform.description.clause(container, transform, parameter, opt),
      vis;

  clause.vis = function() {
    return vis;
  }

  function suffix(d) {
    switch (d) {
      case 1:
        return 'st'
      case 2:
        return 'nd'
      case 3:
        return 'rd'
      default:
        return 'th'
    }
  }

  clause.text = function() {
    var row = transform[parameter](),
        prefix =  'row';

    return prefix + (row + 1);
  }

  return clause;
};
