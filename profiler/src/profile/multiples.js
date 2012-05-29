dp.multiples = function(container, group, fields, opt) {
  spaces_height = 72,
  spaces_width = 212,
  spaces_height_margin = 12,
  spaces_width_margin = 12;

  var vis = {}, dims = opt.dims, table = group.data,
      partition = dv.partition(table, dims), multiples, views;

  views = partition.views();
  jQuery('#' + container).addClass('small_multiples_container')

  vis.update = function() {
    if (!multiples) {
      multiples = views.map(function(view, i) {
        var  graphName = container + '_multiple' + i,
             graph_container = dv.jq('div').attr('id', graphName).addClass('chart_container').addClass("small_multiple"),
             plot;
        jQuery('#' + container).append(graph_container);
        plot = group.plot('histogram', graphName, fields, {data: view, bins: opt.numBins, width: spaces_width - spaces_width_margin, outer_scroll_width: 10, height: spaces_height - spaces_height_margin, min: d3.min(table[fields[0]]), max:d3.max(table[fields[0]])});
        plot.is_small_multiple = true;
        return {index:i, plot:plot}
      })
    }
    multiples.map(function(m) {
      m.plot.update();
    })
    jQuery('.small_multiples_container').jScrollPane().find('.jspHorizontalBar').css('display', 'none')
    jQuery('.small_multiples_container').find('.jspVerticalBar').css('background-color', '#DDD')
  }

  vis.parent = function() {
    return jQuery('#'+ container);
  }

  vis.select = function(x) {
    if (x.data) {
      var select_partition = dv.partition(x.data, dims), select_views;
      select_views = select_partition.views();
      multiples.map(function(m, i) {
        m.plot.select({data:select_views[i], cache:{}});
      })
    } else {
      multiples.map(function(m, i) {
        m.plot.select({data:undefined, cache:{}});
      })
    }
  }

  vis.type = function() {
    return 'multiples'
  }

  vis.fields = function() {
    return fields;
  }

  return vis;

};
