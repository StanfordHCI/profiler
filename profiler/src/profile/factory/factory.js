dp.factory = function(layout) {
  var factory = {},
      spaces_height = layout.cellHeight(),
      spaces_width = layout.cellWidth(),
      spaces_height_margin = 2 * layout.verticalMargin(),
      spaces_width_margin = 2 * layout.horizontalMargin();


  factory.default_vis = function(profiler, x, y, graphName, opt) {
    opt = opt || {};
    var plot, type, data = profiler.data;
    if (y.length === 0) {
      if (x.length === 1) {
        type = data[x[0]].type.type();
        switch (type) {
          case 'number':
          case 'int':
          case 'numeric':


              plot = profiler.plot('histogram', graphName, x, {bins: opt.numBins, width: spaces_width - spaces_width_margin, height: spaces_height - spaces_height_margin});
              break;
          case 'datetime':
              plot = profiler.plot('datetime', graphName, x, {bins: opt.numBins, width: spaces_width - spaces_width_margin, height: spaces_height - spaces_height_margin});
              break;
          case 'geolocation':
              plot = profiler.plot('histogram', graphName, x, {bins: opt.numBins, width: spaces_width - spaces_width_margin, height: spaces_height - spaces_height_margin});
              break;
          case 'geo':
              plot = profiler.plot('bar', graphName, x, {width: spaces_width - spaces_width_margin, height: spaces_height * 3 - spaces_height_margin});
              opt.num_bars = plot.num_bars;
              break
          case 'geo_world':
              plot = profiler.plot('world_map', graphName, x, {bins: opt.numBins, width: spaces_width * 2 - spaces_width_margin, height: spaces_height * 3 - spaces_height_margin, geotype: 'geocountry'});
              break;
          case 'ordinal':
                plot = profiler.plot('line', graphName, x, {width: spaces_width - spaces_width_margin, height: spaces_height * 1 - spaces_height_margin});

              break;
          case 'string':
          case 'nominal':
              if (opt.vis_type === 'text_cluster') {
                plot = profiler.plot('text_cluster', graphName, x, {width: spaces_width - spaces_width_margin, height: spaces_height * 3 - spaces_height_margin});
              } else if (opt.vis_type === 'grouped_bar') {
                plot = profiler.plot('grouped_bar', graphName, x, {width: spaces_width - spaces_width_margin, height: spaces_height * 3 - spaces_height_margin});
              } else {
                plot = profiler.plot('bar', graphName, x, {width: spaces_width - spaces_width_margin, height: spaces_height * 3 - spaces_height_margin});
              }
              opt.num_bars = plot.num_bars;
              break;
        }
      }
    }
    if (y.length === 1 && x.length === 1) {
      $('#' + graphName).children().first().remove()

      if (data[y[0]].type.type() === 'numeric' && data[x[0]].type.type() === 'numeric') {
        type = 'scatter';
        plot = profiler.plot('scatter', graphName, [y[0][0], x[0]], {width: spaces_width - spaces_width_margin, height: spaces_height * 3 - spaces_height_margin});
      } else {
        plot = profiler.plot('multiples', graphName, y, {bins: opt.numBins, width: spaces_width - spaces_width_margin, height: spaces_height - spaces_height_margin, dims: x});
        type = 'multiples'
      }
    }
    if (opt.query) plot.chart().query(opt.query)
    return {plot:plot, type:type, num_bars:opt.num_bars}
  }

  return factory;
};
