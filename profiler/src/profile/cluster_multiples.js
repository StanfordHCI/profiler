dp.cluster_multiples = function(container, group, fields, opt) {
  spaces_height = 72,
  spaces_width = 212,
  spaces_height_margin = 12,
  spaces_width_margin = 12;

  var vis = {}, dims = opt.dims, table = group.data,
      partition = dv.partition(table, dims), multiples, views;

  views = partition.views();
  jQuery('#' + container).addClass('small_multiples_container')

  vis.parent = function() {
    return jQuery('#'+ container);
  }

  vis.height = function() {

  }

  vis.update = function() {
    if (!multiples) {

      views.sort(function(a, b) {
        a = group.data[dims[0]].lut[a.dims()[0]]
        b = group.data[dims[0]].lut[b.dims()[0]]
        if (a == '_2001') return -1;
        if (b == '_2001') return 1;
        if (a == '_2004') return -1;
        if (b == '_2004') return 1;
        if (a == '_2008') return -1;
        if (b == '_2008') return 1;
        if (a == '_2009') return -1;
        if (b == '_2009') return 1;
        if (a == '_2003') return -1;
        if (b == '_2003') return 1;
        return a < b;
      })

      multiples = views.map(function(view, i) {
        var vm = view.materialize();
        var cached_clusters = dp.qgram_self_cluster(vm, fields[0], 2, 3);
        cached_clusters = cached_clusters.filter(function(c){return c.id.replace('The', '').length > 6})
        if (cached_clusters.length) {
          console.log(cached_clusters)
          console.log(cached_clusters.length)
          var  graphName = container + '_multiple' + i,
               graph_container = dv.jq('div').attr('id', graphName).addClass('chart_container').addClass("small_multiple"),
               plot;
          jQuery('#' + container).append(graph_container);
          plot = group.plot('grouped_bar', graphName, fields, {multiples_offset: 10, title_extra: group.data[dims[0]].lut[view.dims()[0]], data: vm, width: spaces_width - spaces_width_margin, outer_scroll_width: 10, height: ((i===2) ? 1.2 : (i===4) ? .2 : .9)*spaces_height - spaces_height_margin});
          plot.is_small_multiple = true;
          return {index:i, plot:plot}
        }
        return undefined;
      })

      multiples = multiples.filter(function(m){
        return m != undefined
      })
    }

    multiples.map(function(m) {
      m.plot.update();
    })
    jQuery('.small_multiples_container').jScrollPane().find('.jspHorizontalBar').css('display', 'none')
    jQuery('.small_multiples_container').jScrollPane().find('.jspVerticalBar').css('background-color', '#DDD')
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