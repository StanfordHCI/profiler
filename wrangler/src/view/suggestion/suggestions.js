dw.view.suggestions = function(container, opt) {
  opt = opt || {};
  var view = {}, vis,
      suggestions,
      suggestion_view = opt.type || dw.view.suggestion.text,
      selected_suggestion_index;

  view.initUI = function() {
    jQuery(container).empty();
    vis = d3.select(container[0])
            .append('div');
   };

  view.suggestions = function(x) {
    if (!arguments.length) return suggestions;
    suggestions = x;
    return view;
  }

  view.highlight_suggestion = function(x) {
    selected_suggestion_index = x;
    vis.selectAll('div.suggestion')
        .classed("selected_suggestion", function(d, i) {
            return i === selected_suggestion_index;
        })
  }

  view.update = function() {
    var idx, suggestion_containers;
    jQuery(vis[0]).empty();
    idx = d3.range(suggestions.length);

    function suggestion_clicked(d, i) {
      opt.onclick(i);
    }

    suggestion_containers = vis.selectAll('div.suggestion')
               .data(idx)
               .enter().append('div')
               .attr('class', 'suggestion')
               .classed("selected_suggestion", function(d, i) {
                 return i === selected_suggestion_index;
               })
               .on('click', suggestion_clicked)

    suggestion_containers.each(function(i) {
      var suggestion = suggestion_view(jQuery(this))
      suggestion.suggestion(suggestions[i])
      suggestion.initUI();
      suggestion.update();
    })
  }

  return view;
};
