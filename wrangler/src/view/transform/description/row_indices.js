dw.transform.description.clause.row_indices = function(container, transform, parameter, opt) {
  var clause = dw.transform.description.clause(container, transform, parameter, opt),
      vis;

  clause.vis = function() {
    return vis;
  }

  function int_suffix(d) {
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
    var rows = transform[parameter](),
        suffix;

    suffix = rows.length === 1 ? ' row' : ' rows';
    return rows.map(function(d) {
      return d === -1 ? 'header' : ((d+1) + int_suffix(d+1))
    }).join(', ') + suffix;
  }

  return clause;
};
