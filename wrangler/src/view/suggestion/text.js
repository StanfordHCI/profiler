dw.view.suggestion.text = function(container, opt) {
  var view = dw.view.suggestion(container, opt)

  view.update = function() {
    var suggestion = view.suggestion(),
        vis = view.vis();

    if (!suggestion) {
      return;
    }

    dw.transform.description(vis.append('div'), suggestion, {}).update()

  }

  return view;
};
