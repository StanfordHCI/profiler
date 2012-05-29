dw.transform.description = function(container, transform, opt) {
  opt = opt || {};
  var view = {},
      vis;

  vis = container.append('div')
      .attr('class', 'transform_description');

  view.vis = function() {
    return vis;
  }

  view.update = function() {
    var displayed_parameters,
        clauses, clause_type, name = transform.name;

    displayed_parameters = dw.metadata.displayed_parameters(transform);
    vis.append('div').text(name[0].toUpperCase()+name.slice(1, name.length)).attr('class', 'transform_clause')
    clauses = displayed_parameters.map(function(p, i) {
      clause_container = vis.append('div').attr('class', 'transform_clause')
      return dw.transform.description.clause[p.type](clause_container, transform, p.name, {}).update()
    })
  }

  return view;
};
