dw.view.suggestion = function(container, opt) {
  var view = {}, vis,
      suggestion;

  view.initUI = function() {
    jQuery(container).empty();
    vis = d3.select(container[0])
            .append('div');
   };

  view.vis = function() {
    return vis;
  }

  view.suggestion = function(x) {
    if (!arguments.length) return suggestion;
    suggestion = x;
    return view;
  }

  view.update = function() {
      vis.append('div')
         .text('Suggestion!')
  }

  return view;
};
