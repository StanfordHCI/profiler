(function(){
dp = {};

dv.EPSILON = 1e-9;

dv.logFloor = function(x, b) {
  return (x > 0)
      ? Math.pow(b, Math.floor(Math.log(x) / Math.log(b)))
      : -Math.pow(b, -Math.floor(-Math.log(-x) / Math.log(b)));
};

function dv_bins(data, bins, min, max, step) {
  var bmin = min !== undefined,
      bmax = max !== undefined;
  min = bmin ? min : dv.minv(data);
  max = bmax ? max : dv.maxv(data);
  var span = max - min;

  /* Special case: empty, invalid or infinite span. */
  if (!span || !isFinite(span)) return [min, min, 1];

  var s = Math.pow(10, Math.round(Math.log(span) / Math.log(10)) - 1),
      d = [Math.floor(min / s) * s, Math.ceil(max / s) * s];
  if (bmin) d[0] = min;
  if (bmax) d[1] = max;

  if (step === undefined) {
    step = dv.logFloor((d[1] - d[0]) / bins, 10);
    var err = bins / ((d[1] - d[0]) / step);
    if (err <= .15) step *= 10;
    else if (err <= .35) step *= 5;
    else if (err <= .75) step *= 2;
  }

  console.log(step)


  d.push(step);

  return d;
}

function dv_profile_cache(evt, query) {
  if (!dp.profile.cache) return evt.data.query(query);

  var cmp = function(a,b) {
    return keys[a] < keys[b] ? -1 : (keys[a] > keys[b] ? 1 : 0);
  }
  var dims = query.dims, idx = [], i, dat;
      keys = dims.map(function(d,i) { idx.push(i); return d.key; });
  idx.sort(cmp);
  var key = idx.map(function(j) { return keys[j]; }).join('__');

  if (!(dat = evt.cache[key])) {

    dims = idx.map(function(j) { return dims[j]; });
    dat = evt.data.query({dims: dims, vals: query.vals, code:query.code});
    evt.cache[key] = dat;
  }

  idx.push(idx.length);
  return idx.map(function(j) { return dat[j]; });
}

dp.profile = function(data, container, opt) {
  opt = opt || {};
  var g = [],
      add = function(vis) { g.push(vis); return vis; },
      timeoutID, numGraphs = 0,
      dashboard_container = dv.jq('div').attr('id', 'dashboard_container'),
      editor_container = dv.jq('div').attr('id', 'formula_editor'), formula_editor,
      on_data_update = opt.on_data_update, layout, selection_manager = dp.selection.manager(g),
      history = dw.wrangle();


  container = jQuery(container);

  container.append(dashboard_container);


  formula_editor = dp.editor.formula(editor_container, {onupdate:on_formula_submit});

  g.selection_manager = function() {
    return selection_manager;
  }

  g.plot = function(type, container, fields, opt) {
    return add(dp[type](container, g, fields, opt));
  };

  g.formula_editor = function() {
    return formula_editor;
  }

  g.default_plot = function(x, y, opt) {
    var x = x || [], y = y || [], opt = opt || {};


    var graphName = opt.graphName || (numGraphs++, 'graph' + numGraphs), graph_container = dv.jq('div').attr('id', graphName).addClass('chart_container'),
        plot, type, vis;
    dashboard_container.append(graph_container);







    vis = dp.factory(layout).default_vis(g, x, y, graphName, opt);

    graph_container.droppable({
        drop: function(event, ui) {
            var index = jQuery(ui.helper).data('index');
            if (index != undefined) {
                if(data[index].type.type() == "numeric"
                   && data[x[0]].type.type() == "numeric") {
                  g.layout().remove(vis)
                  vis = g.default_plot([index], [x], {numBins: 20, graphName: graphName});
                  g.layout().add(vis)

                  vis.plot.update();
                }
                if(data[index].type.type() == "nominal"
                   && data[x[0]].type.type() == "numeric") {
                  vis = g.default_plot([index], [x], {numBins: 20, graphName: graphName});
                  g.layout().add(vis)

                  vis.plot.update();
                }
            }
        },
        greedy: true
    });

    return vis;
  }

  g.fields = function() {
    return g.reduce(function(accum, vis) {
      vis.fields().map(function(f) {
        if (accum.indexOf(f) === -1) accum.push(f)
      })
      return accum},
    []);
  }

  g.select = function(sel, delay) {
    clearTimeout(timeoutID);
    delay = delay || 1;
    timeoutID = setTimeout(function() { dispatch(sel); }, delay);
  }

  function dispatch(s) {
    var t0 = Date.now();
    var e = {data: null, cache: {}}, rn = s.range;

    e.data = s.filter ? data.where(s.filter) : undefined;
    e.source = s.source;
    for (var i = 0; i < g.length; ++i) {


      if (!g[i].is_small_multiple) {
        if (g[i] !== s.source) g[i].select(e);
        else g[i].select({data: null});
      }
    }
    var t1 = Date.now();
    dp.profile.cycletime = (t1 - t0);
  }

  function on_formula_submit(params) {
    var transform = params.derived_transform;
    history.add(transform);
    dw.wrangle().add(transform).apply([data]);
    if (params.update_dashboard) {
      g.map(function(v) {
        v.update_rollup();
        v.update()
      })
    }
    on_data_update({data:data});
  }

  g.add_vis = function(d, drop_top, drop_left, opt) {
    opt = opt || {};
    opt.num_bins = 10;
    var vis = g.default_plot([d], [], opt);
    if(drop_top || drop_left) {
      g.layout().add(vis, drop_top, drop_left);
    }
    else {
      g.layout().add(vis);
    }
    vis.plot.update();
  }

  g.clear = function() {


    var chart;
    for (var i = 0; i < g.length; ++g) {
      if (g[i].type() === 'spreadsheet') {
        chart = g[i];
        break;
      }
    }
    g.length = 0;
    numGraphs = 0;
    if (chart) g.push(chart);
    dashboard_container.empty();
    layout = dp.layout.naive(dashboard_container, {add:g.add_vis});
  }

  g.layout = function() {
    return layout;
  }

  g.set_data = function(x) {
    data = x;
    g.data = x;
  }

  g.data = data;


  var layout = dp.layout.naive(dashboard_container, {add:g.add_vis});


  dp.selection.is_mouse_down = 0;

  jQuery('#dashboard_container').mousedown(function(event) {
    selection_manager.current_selection(undefined);
    selection_manager.clear();
  })

  jQuery('body').mousedown(function(event) {
      dp.selection.is_mouse_down = 1;
  }).mouseup(function() {
      dp.selection.is_mouse_down = 0;
  }).keypress(function(event) {
    if (event.keyCode === -113) {
      selection_manager.current_selection(undefined);
      selection_manager.clear();
    }
  })

  var graphName = 'scatterTest'
  return g;
};

dp.profile.cache = true;

(function($){

$.fn.disableSelection = function() {
    return this.each(function() {
        $(this).attr('unselectable', 'on')
               .css({
                   '-moz-user-select':'none',
                   '-webkit-user-select':'none',
                   'user-select':'none'
               })
               .each(function() {
                   this.onselectstart = function() { return false; };
               });
    });
};

})(jQuery);dp.vis = function(parent, group, fields, opt) {
  opt = opt || {};
  var config = dp.config.vis;
  var group = group || this,
      vis = {},
      container,
      data = group.data, rollup, cleaned_rollup,
      field = fields[0],
      graph_id = container,
      chart_width = opt.width || 200,
      chart_height = opt.height || 594,
      scroll_width = config.yaxis_gutter_width || 20,
      outer_scroll_width = opt.outer_scroll_width || 0,
      menu_vis_width = scroll_width,
      multiples_offset = opt.multiples_offset || 0,
      quality_vis_height = opt.quality_vis_height || config.quality_bar_height || 10,
      quality_vis_width = opt.quality_vis_width || chart_width,
      summary_vis_height = opt.summary_vis_height || 0,
      summary_vis_width = opt.summary_vis_width || chart_width,
      chart_type = opt.chart_type, quality_type = opt.quality_type,
      vis_container, chart_vis, quality_vis, scroll_vis, summary_vis,
      container_dom_type = opt.child_dom_type || 'svg:svg',
      child_dom_type = opt.child_dom_type || 'svg:g';

  if(typeOf(parent) === 'string') {

    vis.parent = function() {
      return jQuery('#' + parent);
    }

    container = d3.select('#'+ parent)
        .append(container_dom_type)
        .attr('width', chart_width)
        .attr('height', chart_height);


  }

  vis.container = function() {
    return container;
  }

  vis.initUI = function() {
    if (chart_type != 'spreadsheet') {
      jQuery(container[0]).empty().disableSelection();
    }
    container.attr('class', 'chart_area');
    vis_container = container.append(child_dom_type)
        .attr('width', chart_width)
        .attr('height', chart_height)
        .attr('class', 'bordered');

    var summary_vis_container = container.append(child_dom_type),
        scroll_vis_container = container.append(child_dom_type),
        menu_vis_container = container.append(child_dom_type),
        chart_vis_container = container.append(child_dom_type)
            .attr('transform', 'translate(0, ' + (quality_vis_height+summary_vis_height + 1) + ')');
    var quality_vis_container = container.append(child_dom_type);

    var title = container.append("svg:text")
        .attr("class", "title")
        .attr("dy", config.title_y)
        .attr("dx", config.title_x)
        .attr("pointer-events", "none")
        .text(fields.map(function(f){
          var title = opt.title_extra ? ' | ' + opt.title_extra.substr(1) : '';
          return group.data[f].name() + title;
        }).join(' vs '));






    chart_vis = dp.chart[chart_type].apply(group,
        [chart_vis_container, fields,
        dv.merge(opt,
        {width:chart_width-scroll_width-outer_scroll_width, height:chart_height-quality_vis_height-summary_vis_height,
        query:opt.query, tick_format:opt.tick_format, ext_container:container, graph_id:graph_id, min:opt.min, max:opt.max,
        containing_vis:vis})]);
    quality_vis = dp.quality[quality_type].apply(group, [quality_vis_container, fields, {width:quality_vis_width - menu_vis_width - outer_scroll_width, height:quality_vis_height, query:opt.query, containing_vis:vis}]);
    menu_vis = dp.menu[chart_type].apply(group, [menu_vis_container, fields, {width:menu_vis_width, height:quality_vis_height, quality_width:quality_vis_width - menu_vis_width - multiples_offset, chart_width:chart_width, graph_id:graph_id, query:opt.query, chart_vis:chart_vis, vis:vis}]);
    if(chart_type == 'bar' || chart_type == 'grouped_bar') {
      scroll_vis = dp.scroll['bar'].apply(group, [scroll_vis_container, fields, {width:scroll_width, height:chart_height-quality_vis_height-summary_vis_height, query:opt.query, chart_vis:chart_vis, vis:vis}]);
    } else if ( chart_type === 'scatter') {
      scroll_vis = dp.scroll['scatter'].apply(group, [scroll_vis_container, fields, {width:scroll_width, height:chart_height-quality_vis_height-summary_vis_height, query:opt.query, chart_vis:chart_vis, vis:vis}]);
    }
  };

   vis.initBins = function() {
      q = {dims: [field], vals: [dv.count('*')]};
   };
   vis.update_scroll = function() {
     scroll_vis.update();
   }
   vis.update = function() {
     chart_vis.update();
     quality_vis.update();
     if(scroll_vis) {
       scroll_vis.update();
     }
     menu_vis.update();
   };

  vis.select = function(e) {
  	if(e.source != quality_vis && e.source != chart_vis) {
      if (quality_vis) {
        quality_vis.select(e);
      }
      chart_vis.select(e);
  	}
  };

  vis.fields = function() {
  	if (arguments.length == 0) return fields;
  	fields = arguments;
  	field = fields[0];
  	return vis;
  };

  vis.update_rollup = function() {
    chart_vis.update_rollup();
    return vis;
  }

  vis.data = function(x) {
    chart_vis.data(x)
    return vis;
  }

  vis.rollup = function() {
    return chart_vis.rollup();
  }

  vis.chart = function() {
    return chart_vis;
  }

  vis.container = function() {
    return container;
  }

  vis.options = function() {
  	if (arguments.length == 0) return fields;
  	opt = arguments[0];
  	bins = opt.bins || bins;
  	w = opt.width || w;
  	h = opt.height || h;
  	vis.update();
  	return vis;
  };

  vis.height = function(new_height) {
    if(scroll_vis) {
      scroll_vis.height(new_height);
    }
    chart_vis.height(new_height - quality_vis_height - summary_vis_height);
    container.attr('height', new_height)
    vis_container.attr('height', new_height)
    return vis;
  };

  vis.width = function(new_width) {
    chart_vis.width(new_width - scroll_width);
    quality_vis.width(new_width - menu_vis_width);
    container.attr('width', new_width)
    vis_container.attr('width', new_width);
    return vis;
  };

  vis.type = function() { return chart_type || 'vis'; };
  vis.initUI();

  return vis;
};
dp.bar = function(container, group, fields, opt) {
  opt = opt || {};
  opt.chart_type = 'bar';
  opt.quality_type = 'bar';
  var bar = dp.vis(container, group, fields, opt);
  return bar;
};
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

};dp.grouped_bar = function(container, group, fields, opt) {
  opt = opt || {};
  opt.chart_type = 'grouped_bar';
  opt.quality_type = 'bar';
  var bar = dp.vis(container, group, fields, opt);
  return bar;
};
dp.histogram = function(container, group, fields, opt) {
  opt = opt || {};
  opt.chart_type = 'histogram';
  opt.quality_type = 'bar';
  opt.query = dp.query.bin;
  var selection,
      hist = dp.vis(container, group, fields, opt);
  return hist;
};
dp.date_histogram = function(container, group, fields, opt) {
  opt = opt || {};
  opt.chart_type = 'date_histogram';
  opt.quality_type = 'bar';


  var type = dp.factory.date().default_type(group.data[fields[0]]);
  opt.query = dp.factory.date().query(type);
  opt.tick_format = dp.factory.date().ticks(type);
  var line = dp.vis(container, group, fields, opt);
  return line;
};
dp.spreadsheet = function(container, group, fields, opt) {
  opt = opt || {};
  opt.chart_type = 'spreadsheet';
  opt.quality_type = 'spreadsheet';
  opt.container_dom_type = 'div';
  opt.child_dom_type = 'div';
  opt.height = 300;
  opt.query = undefined;

  var header_vis = opt.header_vis;
  if (false && header_vis) {
    var layout = dp.layout.linear();
    jQuery("#"+container).empty()
    d3.select('#'+ container)
        .append('div').attr('width', 22).style('min-width', 22).style('max-width',22)
        .style('display', 'inline-block')
    group.data.forEach(function(c, i) {
      var header_container = d3.select('#'+ container)
          .append('div').attr('id', 'test_id'+c.name()).style('display', 'inline-block')
      var vis = dp.factory().default_vis(group, [group.data[i].name()], [], header_container.attr('id'))
          .plot.height(60);
      layout.add_vis(vis)
      vis.update()
    })
    layout.refresh();
  }

  var spreadsheet = dp.vis(container, group, fields, opt);
  return spreadsheet;
};dp.scatter = function(container, group, fields, opt) {
  opt = opt || {};
  opt.chart_type = 'scatter';
  opt.quality_type = 'scatter';
  opt.query = dp.query.bin;
  var scat = dp.vis(container, group, fields, opt);
  return scat;
};dp.month_histogram = function(container, group, fields, opt) {
  opt = opt || {};
  opt.chart_type = 'month_histogram';
  opt.quality_type = 'bar';
  opt.query = dp.query.bin;
  var selection,
      hist = dp.vis(container, group, fields, opt);
  return hist;
};
dp.line = function(container, group, fields, opt) {
  opt = opt || {};
  opt.chart_type = 'line';
  opt.quality_type = 'bar';


  var type = dp.factory.date().default_type(group.data[fields[0]]);
  opt.query = dp.factory.date().query(type);
  opt.tick_format = dp.factory.date().ticks(type);
  var line = dp.vis(container, group, fields, opt);
  return line;
};
dp.schema = function(id, profiler, opt) {
  opt = opt || {};
  var schema = {}, vis, data = profiler.data;

  schema.initUI = function() {
    d3.select('#'+ id + ' div').remove();
    vis = d3.select('#'+ id)
            .append('div').attr('id', 'schema');
   };

  schema.data = function(x) {
    data = x;
    return schema;
  }

  schema.update = function() {
    var idx, sorted, label, data_menu, menu_div, rename_item, num_data_labels, menu_items, j, menu_out, toggle_menu, col_id, data_div;

    function mouseover(d, i) {

    }

    function mouseout(d, i) {

    }

    function dblclick(d, i) {
      profiler.add_vis(d);
      if (opt.on_add) {
        opt.on_add();
      }
    }

    jQuery(vis[0]).empty();
    idx = d3.range(data.length);
    sorted = idx.filter(function(d) {return data[d].type === 'nominal'}).concat(idx.filter(function(d) {return data[d].type === 'numeric'}));
    label = vis.selectAll('div.data_label')
                   .data(idx)
                   .enter().append('div')
                   .attr('class', 'data_label')
                   .classed('system_col', function(d) {return data[d].system})
                   .attr('id', function(d) {return 'data_label' + d})
                   .on('mouseover', mouseover)
                   .on('mouseout', mouseout)
                   .on('dblclick', dblclick);

    label.append('div')
         .attr('class', function(d) {return 'type_icon ' + data[d].type.type()});

    label.append('div')
         .attr('class', 'data_name')
         .text(function(d) {return data[d].name()});

    label.append('div')
         .attr('class', 'data_menu');

    data_menu = vis.selectAll('div.data_menu');
    data_menu.append('div')
         .attr('class', 'data_menu_text')
         .text('options');
    data_menu.append('div')
         .attr('class', 'data_menu_icon right');




    menu_div = vis.selectAll('div.data_label')
         .append('div')
         .attr('class', 'chart_menu')
         .attr('id', function(i) {
           return 'chart_data_menu' +  i;
         })
         .style('width', 100)
         .style('height', 80)
         .style('left', 160)
         .style('top', function(i) {
           return i * 24 + 25;
         })
         .style('position', 'absolute')
         .style('display', 'none');

    rename_item = {};
    rename_item.name = "Rename";
    rename_item.type = "input";
    rename_item.options = {};

    num_data_labels = $('.data_label').size();

    toggle_menu = function(col_id) {
      data_div = this;
      if(typeOf(col_id) == "number") {
        data_div = $('#data_label' + col_id + ' .data_menu')[0];
      }
      jQuery('.data_menu_icon', data_div).toggleClass('right');
      jQuery('.data_menu_icon', data_div).toggleClass('down');
      jQuery('.chart_menu', data_div.parentElement).toggle();
      menu_out = !menu_out;
    }

    for(j = 0; j < num_data_labels; j++) {
      rename_item.options.onenter = function(newval, editor_id) {
        col_id = parseInt(editor_id.substring(6));
        toggle_menu(col_id);
        schema.change_name(col_id, newval);
      };
      rename_item.options.default_value = data[j].name();
      rename_item.options.editor_id = 'rename' + j;
      menu_items = [rename_item];
      menu_items.map(function(item) {
        dp.menu.menu_widget(jQuery('#chart_data_menu' + j), item.name, item.type, item.options)
      });
    }



    menu_out = false;
    jQuery('div.data_label').mouseenter(function() {
      if(!menu_out) {

      }
    });

    jQuery('div.data_label').mouseleave(function() {
      if(!menu_out) {

      }
    });

    jQuery('div.data_menu').click(toggle_menu);



  }

  schema.change_name = function(column, new_name) {

    alert(column + ": " + new_name);
  };

  schema.initUI();
  schema.update();

  return schema;
};
dp.world_map = function(container, group, fields, opt) {
  opt = opt || {};
  opt.chart_type = 'world_map';
  opt.quality_type = 'bar';
  var bar = dp.vis(container, group, fields, opt);
  return bar;
};
/*
 * Options
 * suggestion_container: container to draw suggestions
*/
dp.view = function(opt) {
  var view= {},
      suggestion_container = opt.suggestion_container,
      db = opt.db, suggestions,
      onsuggest = opt.onsuggest;

  view.initUI = function() {

    draw_related_options();

    suggestion_container.empty();


  }



  function draw_suggested_view(profiler_state, suggestion, opt) {
    opt = opt || {};
    var suggestion_type = opt.suggestion_type || dw.view.related_view_type;
    db.clear();
    if (!suggestion) {
      return;
    }
    var col = suggestion.col,
        related_cols;
    if (suggestion_type === 'anomalies') {
      related_cols = suggestion.reason().slice(0, 10);
    } else if (suggestion_type === 'data values') {
      related_cols = suggestion.related().slice(0, 10);
    } else {
      related_cols = [];
    }
    var table = profiler_state.table(), type = function(sug) {
      return type_hash[table[sug.col].type.type()] || 4;
    };
    var type_hash = {"numeric":1, "ordinal":2, "nominal":3}






    var seen_cols = [];
    seen_cols[suggestion.col] = 1;
    related_cols = related_cols.filter(function(s) {
      if (!s || !s.col) return false;
      var col_name = s.col;
      if (col_name[3]==='(') col_name = col_name.substring(4, col_name.length-1);
      if (seen_cols[col_name]) {
        return false;
      }
      seen_cols[col_name] = 1;
      return true;
    })

    db.add_vis(suggestion.col, undefined, undefined, {vis_type:suggestion.vis_type, query:suggestion.binner()})

    related_cols.slice(0, 6).map(function(c) {
      db.add_vis(c.col, undefined, undefined, {query:c.binner});
    })

    if (suggestion.bin) {
      var bin = suggestion.bin();
      var f = function(table, r) {
        return bin[r] !== 0;
      }

    }
  }

  view.update = function(profiler_state) {
    function suggestion_clicked(d) {
      profiler_state.selected_suggestion_index(d);
	    preview_suggestion();
	    event.preventDefault()
    }
    function suggestion_type_switch(d) {
      var suggestion_index = profiler_state.selected_suggestion_index(),
          suggestion = undefined;
      if (suggestion_index != undefined) {
        suggestion = profiler_state.suggestions()[suggestion_index];
      }
      draw_suggested_view(profiler_state, suggestion, {suggestion_type:d.toLowerCase()})
    }

    jQuery('#suggested_view_selector').unbind('onselect')
        .bind('onselect', function(event, d) {suggestion_type_switch(d)});

    var related_container = suggestion_container.append(dv.jq('div'))
    suggestions = dw.view.grouped_suggestions(suggestion_container, {type:dp.view.suggestion.text, onswitchtype: suggestion_type_switch, onclick:suggestion_clicked});
    suggestions.suggestions(profiler_state.suggestions())
    suggestions.initUI();
    suggestions.update();

    var preview_suggestion = function() {
      var suggestion_index = profiler_state.selected_suggestion_index(),
          suggestion = undefined;
      if (suggestion_index != undefined) {
        suggestion = profiler_state.suggestions()[suggestion_index];
      }
      suggestions.highlight_suggestion(suggestion_index)

      draw_suggested_view(profiler_state, suggestion);
      if (onsuggest) {
        onsuggest(suggestion);
      }
    }

    preview_suggestion();

    jQuery(document).unbind('keydown.profiler_view');
    jQuery(document).bind('keydown.profiler_view', function(event) {
      var type = event && event.srcElement && event.srcElement.type
    	if(type!='text'){
    	  switch(event.which){
          case 38:
            /*Up*/
      	    profiler_state.decrement_selected_suggestion_index();
      	    preview_suggestion();
      	    event.preventDefault()
            break
          case 40:
      		  /*Down*/
      	    profiler_state.increment_selected_suggestion_index();
      	    preview_suggestion();
            event.preventDefault()
            break
          case 27:
            profiler_state.selected_suggestion_index(undefined);
      	    preview_suggestion();
            event.preventDefault()
            break
        }
      }
    })


  }

  return view;
};
/* Controls logic of a wrangler app
* Options
* initial_transforms: transforms to run immediately when controller starts.
* backend: the backend to use ('pg' for postgres, 'js' for javascript.)
*/
dp.controller = function(options){
		options = options || {};
		var controller = {},
		    table = options.data,
        selected_suggestion_index,
        backend = options.backend || 'js';

  function clear_suggestions() {
    suggestions = [];
    selected_suggestion_index = undefined;
  }

	controller.suggestions = function() {
	  return suggestions;
	}

  controller.selected_suggestion_index = function(x) {
    if (!arguments.length) return selected_suggestion_index;
    selected_suggestion_index = x;
    return controller;
  }

  controller.increment_selected_suggestion_index = function() {
    if (!suggestions.length) return controller;
    if (selected_suggestion_index === undefined) {
      selected_suggestion_index = 0;
    }
    else if (selected_suggestion_index === suggestions.length - 1) {
      selected_suggestion_index = 0;
    } else {
      selected_suggestion_index = selected_suggestion_index + 1;
    }
    return controller;
  }

  controller.decrement_selected_suggestion_index = function() {
    if (!suggestions.length) return controller;
    if (selected_suggestion_index === undefined) {
      selected_suggestion_index = suggestions.length - 1;
    }
    else if (selected_suggestion_index === 0) {
      selected_suggestion_index = undefined;
    } else {
      selected_suggestion_index = selected_suggestion_index - 1;
    }
    return controller;
  }

	controller.table = function() {
	  return table;
	}

	controller.interaction = function(params){
    var related;
    suggestions = [];
    suggestions = suggestions.concat(dp.suggestion.missing(table));
    suggestions = suggestions.concat(dp.suggestion.error(table));

    suggestions = suggestions.concat(dp.suggestion.extreme(table));
    suggestions = suggestions.concat(dp.suggestion.duplicate(table));

    suggestions.map(function(s) {
      binner = function() {
       return dp.suggestion.entropy.bin(table, table[s.col], s.bin()).binner;
      }
      s.binner = binner;
      related = function() {
        if (!s.bin) return [];
        return dp.suggestion.entropy(table, dp.factory.bin().default_bin(table, table[s.col]), {ignored_columns:[s.col]})
      }
      s.related = related;
      reason = function() {
        if (!s.bin) return [];
        return dp.suggestion.entropy(table, s.bin(), {ignored_columns:[s.col]})
      }
      s.reason = reason;
    })


		selected_suggestion_index = undefined;
		return controller;
	}

	return controller;
}
dp.text_cluster = function(container, group, fields, opt) {
  opt = opt || {};
  opt.chart_type = 'text_cluster';
  opt.quality_type = 'spreadsheet';
  opt.container_dom_type = 'div';
  opt.child_dom_type = 'div';
  opt.height = 300;
  var vis = dp.vis(container, group, fields, opt);
  return vis;
};
dp.query = {};
dp.query.bin = function(data, fields, opt) {
  opt = opt || {};
  opt.min = opt.min || [], opt.max = opt.max || [], opt.step = opt.step || [];

  var bins = opt.bins || 10, binner = [], min = [], max = [],
      step = [], num_bins = [], bin;

  fields.map(function(field, i) {
    bin = dv_bins(data[field], bins, opt.min[i], opt.max[i], opt.step[i]);
    min.push(bin[0]), max.push(bin[1]), step.push(bin[2]);
    num_bins.push(Math.ceil((max[i] - min[i]) / step[i]));
    binner.push(dv.bin(field, step[i], min[i], max[i]));
  })

  return {dims: binner, vals: [dv.count('*')], parameters:{num_bins:num_bins, step:step, min:min, max:max}, code:true};
};
dp.query.group = function(data, fields, opt) {
  return {dims: [fields[0]], vals: [dv.count('*')], code:false};
};
dp.query.quarter = function(data, fields, opt) {
  opt = opt || {};

  var binner = [],
      num_bins = [];

  fields.map(function(field, i) {
    num_bins.push(4);
    binner.push(dv.quarter(field));
  })

  return {dims: binner, vals: [dv.count('*')], parameters:{num_bins:num_bins}, code:true};
};
dp.query.month = function(data, fields, opt) {
  opt = opt || {};

  var binner = [],
      num_bins = [];

  fields.map(function(field, i) {
    num_bins.push(12);
    binner.push(dv.month(field));
  })

  return {dims: binner, vals: [dv.count('*')], parameters:{num_bins:num_bins}, code:true};
};
dp.query.year = function(data, fields, opt) {
  opt = opt || {};

  var binner = [],
      num_bins = [];

  fields.map(function(field, i) {
    minmax = dt.minmax(data[field]);
    min = dt.year(minmax[0]);
    max = dt.year(minmax[1]);
    num_bins.push(dt.year_difference(max, min) + 1);
    binner.push(dv.year(field, min.getFullYear(), max.getFullYear()));
  })

  return {dims: binner, vals: [dv.count('*')], parameters:{num_bins:num_bins}, code:true};
};
dp.query.month_year = function(data, fields, opt) {
  opt = opt || {};

  var binner = [],
      num_bins = [], minmax, min, max;

  fields.map(function(field, i) {
    minmax = dt.minmax(data[field]);
    min = dt.day(minmax[0]);
    max = dt.day(minmax[1]);
    num_bins.push(dt.month_year_difference(max, min) + 1);
    binner.push(dv.month_year(field, min, max));
  })

  return {dims: binner, vals: [dv.count('*')], parameters:{num_bins:num_bins}, code:true};
};
dp.query.day = function(data, fields, opt) {
  opt = opt || {};

  var binner = [],
      num_bins = [], minmax, min, max;

  fields.map(function(field, i) {
    minmax = dt.minmax(data[field]);
    min = dt.day(minmax[0]);
    max = dt.day(minmax[1]);
    num_bins.push(~~dt.day_difference(max, min) + 1);
    binner.push(dv.day(field, min, max));
  })

  return {dims: binner, vals: [dv.count('*')], parameters:{num_bins:num_bins}, code:true};
};
dp.query.hour = function(data, fields, opt) {
  opt = opt || {};

  var binner = [],
      num_bins = [], minmax, min, max;

  fields.map(function(field, i) {
    minmax = dt.minmax(data[field]);
    min = dt.hour(minmax[0]);
    max = dt.hour(minmax[1]);
    num_bins.push(~~dt.hour_difference(max, min) + 1);
    binner.push(dv.hour(field, min, max));
  })

  return {dims: binner, vals: [dv.count('*')], parameters:{num_bins:num_bins}, code:true};
};
dp.chart = {};

dp.chart.chart = function(container, group, fields, opt) {
  var chart = {}, vis,
      data = opt.data || group.data, rollup,
      chart_width = opt.width || 200,
      chart_height = (opt.height || 194),
      targets, marks, selection,
      query, start_row, end_row, options = opt;

  if(typeOf(container) === 'string') {
    container = d3.select('#'+ container)
      .append('svg:svg')
      .attr('width', chart_width)
      .attr('height', chart_height);
  }

  chart.initBins = function(){};

  chart.initUI = function() {
    jQuery(container[0]).empty();
    container.attr('class', 'chart_area');
    vis = container.append('svg:g')
        .attr('width', chart_width)
        .attr('height', chart_height)
        .attr('class', 'bordered');
  };

  chart.container = function(x) {
    if (!arguments.length) return container;
    container = x;
    return chart;
  }

  chart.vis = function(x) {
    if (!arguments.length) return vis;
    vis = x;
    return chart;
  }

  chart.width = function(x) {
    if (!arguments.length) return chart_width;
    chart_width = x;
    return chart;
  }

  chart.height = function(x) {
    if (!arguments.length) return chart_height;
    chart_height = x;
    return chart;
  }

  chart.update = function() {
    chart.initBins();
    chart.draw();
  }

  chart.option = function(key, value) {
    if (arguments.length === 1) {
      return options[key];
    }
    options[key] = value;
    return chart;
  }

  chart.data = function(x) {
    if (!arguments.length) return data;
    data = x;
    return chart;
  }

  chart.group = function() {
    return group;
  }

  chart.update_rollup = function(x) {
    if (query) {
      rollup = data.query(query);
    } else {
      rollup = data;
    }
    return chart;
  }

  chart.rollup = function(x) {
    if (!arguments.length) return rollup;
    rollup = x;
    return chart;
  }

  chart.query = function(x) {
    if (!arguments.length) return query;
    query = x;
    return chart;
  }

  chart.marks = function(x) {
    if (!arguments.length) return marks;
    marks = x;
    return chart;
  }

  chart.start_row = function(x) {
    if (!arguments.length) return start_row;
    start_row = x;
    return chart;
  }

  chart.end_row = function(x) {
    if (!arguments.length) return end_row;
    end_row = x;
    return chart;
  }

  chart.targets = function(x) {
    if (!arguments.length) return targets;
    targets = x;
    return chart;
  }

  chart.selection = function(x) {
    if (!arguments.length) return selection;

    var selection_manager = chart.group().selection_manager();
    if (selection) {
      selection_manager.remove(selection)
    }
    selection = x;
    selection_manager.add(selection);
    return chart;
  }

  chart.fields = function(x) {
    if(!arguments.length) return fields;
    fields = x;
    return chart;
  }

  return chart;
};
dp.chart.bar = function(container, fields, opt) {
  var group = this,
      config = dp.config.vis,
      bar = dp.chart.chart(container, group, fields, opt),
      field = fields[0],
      min_bar_width = 2,
      bar_space = opt.bar_spacing || dp.config.vis.bar_spacing || 2,
      bar_height = opt.bar_height || dp.config.vis.bar_height || 10,
      onscreen_bars = 60,
      x_scale, y_scale, sortidx, scroll_offset = 0;

  bar.width(opt.width || 180);

  bar.height(opt.height || 594);
  bar.selection(dp.selection(group, bar, fields));
  bar.start_row(opt.start_row || 0);
  bar.end_row(opt.end_row || bar.start_row()+60);

  bar.initBins = function() {
    var query = {dims: [field], vals: [dv.count('*')], code:false};
    bar.query(query);
  };

  bar.draw = function() {
    var roll = bar.rollup(),
        chart_width = bar.width(),
        chart_height = bar.height(), idx, idx_truncated,
        marks, targets, data = bar.data(),
        vis = bar.vis(), sort = opt.sort || 'count', partition_results;


    vis.selectAll("text").remove();
  	vis.selectAll("rect").remove();

    partition_results = dv.partition_results(roll, fields, fields.length, {missing:roll[0][roll[0].length-2], error:roll[0][roll[0].length-1]});
    roll = partition_results.clean;
    if (roll[0].length === 2) bar_height = 30

    idx = d3.range(roll[0].length);
    sortidx = idx;
    if (sort === 'count') {
      roll = dv.sort_multiple(roll, [fields.length], [dv.result_order.DESC]);
      sortidx = roll.idx;
    }

    onscreen_bars = Math.min(60, roll[0].length);
    idx_truncated = d3.range(bar.start_row() || 0, Math.min(bar.end_row() || roll[0].length, roll[0].length)) ;
    var label_width = 0;
    x_scale = d3.scale.linear()
          .domain([0, d3.max(roll[1])])
          .range([0, chart_width-label_width]);

    marks = vis.selectAll('rect.base')
        .data(idx_truncated)
        .enter().append('svg:rect')
        .attr('class', 'base')
        .attr('y', function(d, i) { return (bar_height + bar_space) * i; })
        .attr('x', label_width)
        .attr('height', bar_height)
        .attr('width', function(d, i) {
          var val = roll[1][d];
          if(val === 0) return 0;
          val = x_scale(val);
          return Math.max(val, min_bar_width);
        });

    targets = vis.selectAll('rect.pointer')
       .data(idx_truncated)
       .enter().append('svg:rect')
       .attr('class', 'pointer');

    vis.selectAll('rect.pointer')
       .attr('y', function(d, i) { return (bar_height + bar_space) * i; })
       .attr('x', 0)
       .attr('width', chart_width)
       .attr('height', bar_height)
       .attr('opacity', 0);

    vis.selectAll('rect.brush')
       .data(idx_truncated)
       .enter().append('svg:rect')
       .attr('class', 'brush');

    vis.selectAll('rect.brush')
       .attr('y', function(d, i) { return (bar_height + bar_space) * i; })
       .attr('x', 0)
       .attr('height', bar_height)
       .attr('width', 0);

    vis.selectAll('text.bar_label')
        .data(idx_truncated)
        .enter().append("svg:text")
        .attr('y', function(d, i) { return (bar_height + bar_space) * i; })
        .attr('x', 0)
        .attr('class', 'bar_label')
        .attr("text-anchor", "left")
        .attr("dy", config.bar_label_y)
        .attr("dx", config.bar_label_x)
        .attr("pointer-events", "none")
        .text(function(d, i) {
          var t = data[field].lut[roll[0][d]];
          if (t && t.length > 25) t = t.substring(0, 22) + "..."
          return t;
        });

    bar.selection().marks(marks).targets(targets).rollup(roll, idx_truncated);
  };

  bar.select = function(e) {
  	var vis = bar.vis();
  	if (e.data) {
  	  var roll = e.data.query(bar.query()),
  	      partition_results = dv.partition_results(roll, fields, fields.length, {missing:roll[0][roll[0].length-2], error:roll[0][roll[0].length-1]});
  	  roll = partition_results.clean;
  	  vis.selectAll('rect.brush')
  		 .attr('width', function(d,i) {
  		   var val = x_scale(roll[1][sortidx[d]]);
  		   if(val === 0) return 0;
  		   return val <= min_bar_width ? min_bar_width : val;
  		 });
  	} else {
  	  vis.selectAll('rect.brush')
  		 .attr('width', 0);
  	}
  };

  bar.chart_vis = function() {
    return vis;
  }

  bar.type = function() { return 'bar'; };
  bar.initUI();
  bar.initBins();
  bar.update_rollup();
  return bar;
};
dp.chart.grouped_bar = function(container, fields, opt) {
  var group = this,
      bar = dp.chart.chart(container, group, fields, opt),
      field = fields[0],
      min_bar_width = 2,
      bar_space = 2,
      bar_height = 10,
      group_space = 5,
      onscreen_bars = 60,
      x_scale, y_scale, sortidx, scroll_offset = 0;

  bar.width(opt.width || 180);
  bar.height(opt.height || 594);
  bar.selection(dp.selection(group, bar, fields));
  bar.start_row(opt.start_row || 0);
  bar.end_row(opt.end_row || bar.start_row()+60);

  bar.initBins = function() {
    bar.query(undefined)
  };

  bar.draw = function() {
    var chart_width = bar.width(),
        chart_height = bar.height(), idx, idx_truncated,
        marks, targets, data = bar.data(),
        vis = bar.vis(), sort = opt.sort || 'count', partition_results;

    vis.selectAll("text").remove();
  	vis.selectAll("rect").remove();

    var q = 2, k = 3;



    cached_clusters = dp.qgram_self_cluster(data, fields[0], q, k);
    cached_clusters = cached_clusters.filter(function(c){return (['The Alamo', 'Spy Hard', 'Die Hard', 'The Howling', 'The Calling', 'Twilight', 'Daylight'].indexOf(c.id) ==-1) && c.id.replace('The', '').length > 6})

    roll = [[],[],[],[],[],[]];
    cached_clusters.map(function(c, cluster_number) {
      var entropy = dp.stat.normalized_entropy(c.counts);
      var total_count = c.counts.reduce(function(a,b){return a+b});
      var sequel = c.cluster.filter(function(d) {
        return d[d.length-1] == 2;
      }).length > 0;
      c.cluster.map(function(d, i) {
        roll[0].push(d);
        roll[1].push(c.counts[i]);
        roll[2].push(cluster_number);
        roll[3].push(entropy);
        roll[4].push(sequel);
        roll[5].push(total_count);
      })
    })
    console.log(cached_clusters.length)

    idx = d3.range(roll[0].length);
    sortidx = idx;
    if (sort === 'count') {

      roll = dv.sort_multiple(roll, [4, 3, 5, 2, 1, 0], [dv.result_order.DESC, dv.result_order.ASC, dv.result_order.DESC, dv.result_order.ASC, dv.result_order.DESC, dv.result_order.ASC]);
      sortidx = roll.idx;
      var group = -1, current_group = -1;
      for (var i = 0; i < roll[2].length; ++i) {
        if (current_group != roll[2][i]) {
          group++;
          current_group = roll[2][i]
        };
        roll[2][i] = group;
      }
    }


    onscreen_bars = Math.min(60, roll[0].length);
    idx_truncated = d3.range(bar.start_row() || 0, Math.min(bar.end_row() || roll[0].length, roll[0].length)) ;

    x_scale = d3.scale.linear()
          .domain([0, d3.max(roll[1])])
          .range([0, chart_width]);

    function yOffset(d, i) {
      return (bar_height + bar_space) * (i - idx_truncated[0]) + group_space * roll[2][d]
    }

    marks = vis.selectAll('rect.base')
        .data(idx_truncated)
        .enter().append('svg:rect')
        .attr('class', 'base')
        .attr('y', function(d, i) { return yOffset(d, i); })
        .attr('x', 0)
        .attr('height', bar_height)
        .attr('width', function(d, i) {
          var val = roll[1][d];
          if(val === 0) return 0;
          val = x_scale(val);
          return Math.max(val, min_bar_width);
        });

    targets = vis.selectAll('rect.pointer')
       .data(idx_truncated)
       .enter().append('svg:rect')
       .attr('class', 'pointer');

    vis.selectAll('rect.pointer')
       .attr('y', function(d, i) { return yOffset(d, i); })
       .attr('x', 0)
       .attr('width', chart_width)
       .attr('height', bar_height)
       .attr('opacity', 0);

    vis.selectAll('rect.brush')
       .data(idx_truncated)
       .enter().append('svg:rect')
       .attr('class', 'brush');

    vis.selectAll('rect.brush')
       .attr('y', function(d, i) { return yOffset(d, i); })
       .attr('x', 0)
       .attr('height', bar_height)
       .attr('width', 0);

    vis.selectAll('text.label')
        .data(idx_truncated)
        .enter().append("svg:text")
        .attr('y', function(d, i) { return yOffset(d, i); })
        .attr('x', 0)
        .attr("text-anchor", "left")
        .attr('class', 'bar_label')
        .attr("dy", "1em")
        .attr("dx", ".5em")
        .attr("pointer-events", "none")
        .text(function(d, i) {
          var t = roll[0][d];
          if (t.length > 28) t = t.substring(0, 25) + "..."
          return t;
        });

    bar.selection().marks(marks).targets(targets).rollup(roll, idx_truncated);
  };

  bar.select = function(e) {
  	var vis = bar.vis();
  	if (e.data) {
  	  var roll = e.data.query(bar.query()),
  	      partition_results = dv.partition_results(roll, fields, fields.length, {missing:roll[0][roll[0].length-2], error:roll[0][roll[0].length-1]});
  	  roll = partition_results.clean;
  	  vis.selectAll('rect.brush')
  		 .attr('width', function(d,i) {
  		   var val = x_scale(roll[1][sortidx[d]]);
  		   if(val === 0) return 0;
  		   return val <= min_bar_width ? min_bar_width : val;
  		 });
  	} else {
  	  vis.selectAll('rect.brush')
  		 .attr('width', 0);
  	}
  };

  bar.chart_vis = function() {
    return vis;
  }

  bar.type = function() { return 'bar'; };
  bar.initUI();
  bar.initBins();
  bar.update_rollup();
  return bar;
};
dp.chart.spreadsheet = function(container, fields, opt)
{
  opt = opt || {};
  var group = opt.group || this,
      spread = dp.chart.chart(container, group, fields, opt),
      w = opt.width || 400,
      h = (opt.height || 194),
      interaction = opt.interaction,
      table_layout = opt.table_layout || dp.layout.table.uniform(),
	    limit = opt.limit || 15, timeout = opt.timeout || 200,
	    cell_double_click = false;

  spread.width(w);
  spread.height(h);


  spread.initUI = function() {
    jQuery(container[0]).empty();
    container.attr('class', 'chart_area');
    var vis = container.append('table')
        .attr('width', spread.width())
        .attr('height', spread.height())
        .attr('class', 'bordered');
    spread.vis(vis);
  };
  spread.initBins = function() {
    spread.query(undefined)
  };
  spread.fields = function() {
    var data = spread.data();
    if (fields && fields.length > 0) {
      return fields;
    }
    return d3.range(data.length);
  }
  spread.field_names = function() {
    var data = spread.data();
    return spread.fields().map(function(c) {
  		return data[c].name();
  	});
  }
  spread.draw = function() {
    var data = spread.rollup(),
        fields = spread.fields(),
        d, names, roll, vis = spread.vis(), rows, header;

    if (!fields || fields.length === 0) return;


    jQuery(vis[0]).empty();
    roll = fields.map(function(c) {
  		d = data[c];
  		return dv.range(limit).map(function(x) {return d.get_raw(x)});
  	});

    names = spread.field_names();

  	var idx = d3.range(limit),
  	    column_widths, header_width = 20;

  	column_widths = d3.range(roll.length).map(function(d, i) {
  	  return table_layout.column_width(data, data[d], d, {});
  	})

    var total_width = header_width + column_widths.reduce(function(a,b) {return a + b}, 0)

    vis.attr('width', total_width)
		.attr('min-width', total_width)
		.attr('max-width', total_width)

    header =  vis.append('thead')
  		.attr('class', 'base')
  		.append('tr')
        .attr('class', 'base header')

    header.append('th')
          .attr('width', header_width)
      		.attr('min-width', header_width)
      		.attr('max-width', header_width);

    header.selectAll('th.base')
  		.data(d3.range(roll.length))
  		.enter().append('th')
  		.attr('class', 'base')
  		.attr('width', function(d, i) {return column_widths[d]})
  		.attr('min-width', function(d, i) {return column_widths[d]})
  		.attr('max-width', function(d, i) {return column_widths[d]})
  		.text(function(d) {return names[d]});

   	rows = vis.append('tbody')
  		.attr('class', 'base')
  		.selectAll('tr.base')
        .data(idx)
       .enter().append('tr')
        .attr('class', 'base')

  	 rows.append('td')
        .text(function(d, i) {return i < data[0].length ? (i + 1) : ''})
        .classed('row_header', true)

  	 rows.selectAll('td.base')
  		.data(function(d) {return roll.map(function() {return d})})
  		.enter().append('td')
  		.attr('class', 'base')
  		.text(function(d, i) {return (roll[i][d] != undefined) ? (''+ roll[i][d]).substr(0,15) : '';});

      add_interactions(header, rows)
  };

  function add_interactions(header, rows) {
    var data;
    header.selectAll('th.base')
          .on('click', function(d, i) {
            data = spread.data();
            var e = d3.event;
          interaction({type:dw.engine.col, position:{row:d, col:data[i].name()}, table:data, shift:e.shiftKey, ctrl:e.metaKey})
          })
    rows.selectAll('td.row_header')
        .on('click', function(d, i) {
          var e = d3.event;
          data = spread.data();
          interaction({type:dw.engine.row, position:{row:d, col:-1}, table:data, shift:e.shiftKey, ctrl:e.metaKey})
    })

    rows.selectAll('td:not(.row_header)')
        .on('mouseup', function(d, i) {
          data = spread.data();
          var row_index = d,
              col_index = i,
              selection = getSelection(),
          		val = "" + (data[col_index].get_raw([row_index]));
  						if(selection && val && val.length > selection.startCursor){
								var position = {row:row_index, col:data[col_index].name()}
								var timeout = (selection.startCursor === selection.endCursor) ? timeout : 0;
								setTimeout(function(){
									if(!cell_double_click){

										if(selection.startCursor != selection.endCursor) {
										  interaction({type:dw.engine.highlight, position:position, selection:selection})
										}
									}
								}, timeout)
              }
            })
          .on('mousedown', function(d, i) {
            Highlight.removeHighlight(d3.event.currentTarget)
          })
  }

  function getSelection() {
		var selection = window.getSelection()
		if(!selection) return;
		try{
			var range = selection.getRangeAt(0),
			    startCursor = range.startOffset,
			    endCursor = range.endOffset,
			    split = {startCursor:startCursor, endCursor:endCursor};
			return split;
		}
		catch(e){
			return undefined;
		}
	}

  spread.select = function(e) {
    var fields = spread.fields(), vis = spread.vis();
    if (e.data) {
  		roll = fields.map(function(c) {
  			 var d = e.data[c];
  		return dv.range(limit).map(function(x) {return d.get_raw(x)});
  		});

		  var idx = d3.range(limit);
		  vis.selectAll('tr.base')
			    .selectAll('td.base')
			    .text(function(d, i) {return (roll[i][d] != undefined) ? roll[i][d] : ''});
	  } else {
			roll = fields.map(function(c) {
				 var d = data[c];
         return dv.range(limit).map(function(x) {return d.get(x)});
      });

			var idx = d3.range(limit);
			vis.selectAll('tr.base')
				.selectAll('td.base')
				.text(function(d, i) {
				  return (roll[i][d] != undefined) ? roll[i][d] : '';
				});
	    }
  };

  spread.cells = function(opt) {
    var vis = spread.vis(),
        data = spread.data(),
        rows = opt.rows, cols = opt.cols,
        cell_filter = opt.cell_filter,
        start_row = 0,
        end_row = 20,
        field_names = spread.field_names(), selection;

    selection = vis.select('tbody').selectAll('tr')
    if (rows) {
      selection = selection.filter(function(d, i) { return rows.indexOf(i) > -1 })
      if (opt.header) {
        selection = d3.selectAll(d3.merge(d3.merge([vis.select('thead').selectAll('tr'), selection])))
      }
    }
    if (cols) {
      selection = d3.merge([selection.selectAll('th'), selection.selectAll('td')])


      cols = cols.map(function(c) {

        return field_names.indexOf(c.name()) + 1;
      })

      selection = selection.map(function(row) {
        return row.filter(function(d, i) {return cols.indexOf(i) > -1})
        }
      )
      selection = d3.selectAll(d3.merge(selection))
    }
    return selection;
  }

  spread.type = function() { return 'spreadsheet'; };
  spread.initUI();
  spread.initBins();
  spread.update_rollup();

  spread.visible_rows = function() {

    return [0, 20]
  }

  return spread;
};/***
  Options include:
  bins: the number of bins
  dims: dimensions used to partition (deprecated)
  query: query used to generate data
  chart_height: height of chart
  chart_width: height of chart
  label_height: height of labels
  tick_text_anchor: how to anchor text
  tick_format: how to format tick labels
**/
dp.chart.histogram = function(container, fields, opt)
{
  var group = this,
      config = dp.config.vis,
      hist = dp.chart.chart(container, group, fields, opt),
      field = fields[0],
      num_bins = opt.bins || 20,
      label_height = (opt.label_height || config.xaxis_gutter_height || 12),
      min_bar_height = 5, dims = [],
      space = 2, targets, marks,
      min, max, x_scale, y_scale, tick_scale, vis;

  hist.selection((opt.selection || dp.selection.range)(group, hist, fields));
  hist.width(opt.width || 200);
  hist.height((opt.height || 194));

  hist.initBins = function() {
    var query, query_fields = fields, query_data = hist.data();



    if (opt.transform) {

      var transform = opt.transform(dw.derive.variable(field)),
          new_col_name = "*" + transform.name + "_" + field, transformed_field = query_data[new_col_name];
      if (!transformed_field) {
        transformed_field = transform.evaluate(query_data);
      }
      transformed_field = query_data.addColumn(new_col_name, transformed_field, transformed_field.type, {system:true, encoded:transformed_field.lut != undefined, lut:transformed_field.lut});
      query_fields = [transformed_field.name()];
      hist.selection().fields([transformed_field.name()])
    }

    if(hist.query()) {
      query = hist.query()
    } else if(opt.query) {
      query = opt.query(query_data, query_fields, opt);
    } else {
      query = dp.query.bin(query_data, query_fields, {min:opt.min,max:opt.max,bins:opt.bins,step:opt.step});
    }
    hist.query(query);
    if(query.parameters) {
      num_bins = query.parameters.num_bins[0] || num_bins;
      hist.selection().query_parameters(query.parameters)
    }
  };

  hist.chart_height = function() {
    return hist.height() - label_height;
  }

  hist.draw = function() {

    var roll = (hist.update_rollup(), hist.rollup()),
        chart_width = hist.width(),
        chart_height = hist.chart_height(),
        bar_space = Math.floor(chart_width / num_bins),
        vis = hist.vis(), idx, marks, targets, partition_results;

    vis.selectAll("text").remove();
  	vis.selectAll("rect").remove();

    partition_results = dv.partition_results(roll, fields, dims.length + 1);
    roll = partition_results.clean;

    idx = d3.range(roll[0].length),

    tick_scale = d3.scale.linear()
        .domain([d3.min(roll[0]), d3.max(roll[0])+(roll[0][1]-roll[0][0])])
        .range([0, chart_width])

    x_scale = d3.scale.linear()
        .domain([0, idx.length])
        .range([0, chart_width])

    y_scale_ticks = d3.scale.linear()
            .domain([0, d3.max(roll[1])])
            .range([chart_height, min_bar_height]);

    y_scale = d3.scale.linear()
        .domain([1, d3.max(roll[1])])
        .range([chart_height-min_bar_height, 0]);


    marks = vis.selectAll('rect.base')
      .data(idx)
      .enter().append('svg:rect')
      .attr('class', 'base');

    vis.selectAll('rect.base')
      .attr('x', x_scale)
      .attr('y', function(d, i) { return bar_y(d, i, roll)})
      .attr('width', bar_space - 1)
      .attr('height', function(d, i) { return bar_height(d, i, roll)});

    targets = vis.selectAll('rect.pointer')
       .data(idx)
       .enter().append('svg:rect')
       .attr('class', 'pointer');

    vis.selectAll('rect.pointer')
       .attr('x', x_scale)
       .attr('y', 0)
       .attr('width', bar_space - 1)
       .attr('height', chart_height)
       .attr('opacity', 0);

    vis.selectAll('rect.brush')
       .data(idx)
       .enter().append('svg:rect')
       .attr('class', 'brush');

    vis.selectAll('rect.brush')
       .attr('x', x_scale)
       .attr('y', chart_height)
       .attr('width', bar_space - 1)
       .attr('height', 0);

    hist.labels();

    hist.selection().marks(marks).targets(targets).rollup(roll);
  };

  var BILLION = 1000000000, MILLION = 1000000, THOUSAND = 1000;

  hist.labels = function() {
    var x_ticks = tick_scale.ticks(10),
        y_ticks = y_scale_ticks.ticks(10), vis = hist.vis();


    var min_x = x_ticks[0];
    var max_x = x_ticks[x_ticks.length - 1];

    function pretify(val) {
      if (val >= BILLION) {
        val = Math.ceil(val / BILLION) + 'B';
      } else if (val >= MILLION) {
        val = Math.ceil(val / MILLION) + 'M';
      } else if (val >= THOUSAND) {
        val = Math.ceil(val / THOUSAND) + 'K';
      }
      return val;
    }
    min_x = dp.tick.pretify(min_x);
    max_x = dp.tick.pretify(max_x);
    var max_len_x = (max_x + '').length;
    var chart_width = hist.width(),
        chart_height = hist.chart_height();

    vis.selectAll('text.label')
        .data([0])
        .enter()
        .append('svg:text')
        .attr('x',1)
        .attr('y',chart_height +  config.xaxis_vertical_padding)
        .text(min_x + '');

    vis.selectAll('text.label')
        .data([0])
        .enter()
        .append('svg:text')
        .attr('x',chart_width - max_len_x * config.axis_character_offset)
        .attr('y',chart_height +  config.xaxis_vertical_padding)
        .text(max_x + '');


    var min_y = y_ticks[0];
    var max_y = y_ticks[y_ticks.length - 1];
    min_y = pretify(min_y)
    max_y = pretify(max_y)
    var min_len_y = (min_y + '').length;
    var max_len_y = (max_y + '').length;
    vis.selectAll('text.label')
        .data([0])
        .enter()
        .append('svg:text')
        .attr('x',chart_width + config.yaxis_gutter_width - config.yaxis_horizontal_padding - min_len_y * config.axis_character_offset)
        .attr('y',chart_height)
        .text(min_y + '');

    vis.selectAll('text.label')
        .data([0])
        .enter()
        .append('svg:text')
        .attr('x',chart_width + config.yaxis_gutter_width - config.yaxis_horizontal_padding - max_len_y * config.axis_character_offset)
        .attr('y',label_height)
        .text(max_y + '');
  }

  hist.select = function(e) {
    var vis = hist.vis(), chart_height = hist.height();
    if (e.data) {
      var roll = dv_profile_cache(e, hist.query()),
          partition_results = dv.partition_results(roll, fields, dims.length + 1);
      roll = partition_results.clean;
      vis.selectAll('rect.brush')
        .attr('y', function(d, i) { return bar_y(d, i, roll)})
        .attr('height', function(d, i) { return bar_height(d, i, roll)})
    } else {
      vis.selectAll('rect.brush')
         .attr('y', chart_height)
         .attr('height', 0);
    }
  };

  /** Computes bar y from data, index, and rollup
  */
  function bar_y(d, i, roll) {
    var val = roll[1][i], chart_height = hist.chart_height();
    if(val === 0) return chart_height;
    val = y_scale(val);
    return val;
    return Math.min(val, chart_height-min_bar_height);
  }

  /** Computes bar height from data, index, and rollup
  */
  function bar_height(d, i, roll) {
    var val = roll[1][i], chart_height = hist.chart_height();
    if(val === 0) return 0;
    val = y_scale(val);
    return chart_height-val;
    return Math.max(chart_height - val, min_bar_height);
  }

  hist.type = function() { return 'histogram'; };

  hist.initUI();
  hist.initBins();
  hist.update_rollup();
  return hist;
};
/***
  Options include:
  bins: the number of bins
  dims: dimensions used to partition (deprecated)
  query: query used to generate data
  chart_height: height of chart
  chart_width: height of chart
  label_height: height of labels
  tick_text_anchor: how to anchor text
  tick_format: how to format tick labels
**/
dp.chart.date_histogram = function(container, fields, opt)
{
  var group = this,
      line = dp.chart.chart(container, group, fields, opt),
      field = fields[0],
      dims = opt.dims || [],
      label_height = (opt.label_height || 12),
      space = 2, x_scale, y_scale, tick_scale, brush, brush_area;

  line.width(opt.width || 200);
  line.height((opt.height || 194) - label_height);
  line.selection((opt.selection || dp.selection.range)(group, line, fields));

  line.initBins = function() {
    var query, data = line.data();
    if(opt.query) {
      query = opt.query(data, fields, opt);
    } else {
      query = dp.query.month(data, fields, opt);
    }
    line.query(query);
    if(query.parameters) {
      line.selection().query_parameters(query.parameters)
    }
  };

  line.draw = function() {
    var roll = line.rollup(),
        chart_width = line.width(),
        chart_height = line.height(), targets,
        marks, bar_space = Math.floor(chart_width / roll[0].length),
        idx, vis = line.vis(), partition_results;

    vis.selectAll('rect').remove();

    partition_results = dv.partition_results(roll, fields, dims.length + 1);
    roll = partition_results.clean;

    idx = d3.range(roll[0].length);

    tick_scale = d3.scale.linear()
        .domain([d3.min(roll[0]), d3.max(roll[0])+(roll[0][1]-roll[0][0])])
        .range([0, chart_width])

    x_scale = d3.scale.linear()
        .domain([d3.min(roll[0]), d3.max(roll[0])])
        .range([0, chart_width - bar_space])

    y_scale = d3.scale.linear()
        .domain([0, d3.max(roll[1])])
        .range([0, chart_height]);

    marks = vis.selectAll("rect.base")
       .data(idx)
       .enter().append("svg:rect")
       .attr('class', 'base')
       .attr("x", function(d) {return x_scale(roll[0][d]);})
       .attr("y", function(d) {return chart_height - y_scale(roll[1][d]);})
       .attr('width', function(d) {return bar_space - 1})
       .attr('height', function(d) {return y_scale(roll[1][d]);})


   targets = vis.selectAll('rect.pointer')
      .data(idx)
      .enter().append('svg:rect')
      .attr('class', 'pointer')
      .attr('x', function(d) {return x_scale(roll[0][d]);})
      .attr('y', 0)
      .attr('width', bar_space - 1)
      .attr('height', chart_height)
      .attr('opacity', 0);

   brush = vis.selectAll("rect.brush")
      .data(idx)
      .enter().append("svg:rect")
      .attr('class', 'brush')
      .attr("x", function(d) {return x_scale(roll[0][d]);})
      .attr("y", function(d) {return 0})
      .attr('width', function(d) {return bar_space - 1})
      .attr('height', function(d) {0})




    line.selection().marks(marks).targets(targets).rollup(roll);

    line.labels();
  };

  line.labels = function() {
    var vis = line.vis(),
        x_ticks = tick_scale.ticks(10),
        y_ticks = y_scale.ticks(10), roll = line.rollup();

    vis.selectAll('text').remove();




    var min_x = d3.min(roll[0]);
    var max_x = d3.max(roll[0]);

    var min_date = opt.tick_format(new Date(min_x), min_x);
    var max_date = opt.tick_format(new Date(max_x), max_x % 12);
    var max_len_x = (max_date + '').length;
    vis.selectAll('text.label')
        .data([0])
        .enter()
        .append('svg:text')
        .attr('x',1)
        .attr('y',192)
        .text(min_date + '');

    vis.selectAll('text.label')
        .data([0])
        .enter()
        .append('svg:text')
        .attr('x',178 - max_len_x*6)
        .attr('y',192)
        .text(max_date + '');


    var min_y = y_ticks[0];
    var max_y = y_ticks[y_ticks.length - 1];
    var min_len_y = (min_y + '').length;
    var max_len_y = (max_y + '').length;
    vis.selectAll('text.label')
        .data([0])
        .enter()
        .append('svg:text')
        .attr('x',198 - min_len_y*6)
        .attr('y',180)
        .text(min_y + '');

    vis.selectAll('text.label')
        .data([0])
        .enter()
        .append('svg:text')
        .attr('x',198 - max_len_y*6)
        .attr('y',10)
        .text(max_y + '');
  }

  line.select = function(e) {
    var vis = line.vis(), chart_height = line.height();
    if (e.data) {
      var roll = dv_profile_cache(e, line.query()),
          partition_results = dv.partition_results(roll, fields, dims.length + 1);
      roll = partition_results.clean;
      brush.attr('y', function(d, i) {return chart_height - y_scale(roll[1][d]);})
      .attr('height', function(d, i) {return y_scale(roll[1][d]);})
    } else {
      brush.attr('y', function(d, i) {return 0})
      .attr('height', function(d, i) {return 0})

    }
  };

  line.type = function() { return 'line'; };

  line.initUI();
  line.initBins();
  line.update_rollup();
  return line;
};
/***
  Options include:
  bins: the number of bins
  dims: dimensions used to partition (deprecated)
  query: query used to generate data
  chart_height: height of chart
  chart_width: height of chart
  label_height: height of labels
  tick_text_anchor: how to anchor text
  tick_format: how to format tick labels
**/
dp.chart.line = function(container, fields, opt)
{
  var group = this,
      config = dp.config.vis,
      line = dp.chart.chart(container, group, fields, opt),
      field = fields[0],
      dims = opt.dims || [],
      label_height = (opt.label_height || config.xaxis_gutter_height),
      space = 2, x_scale, y_scale, tick_scale, brush, brush_area;

  line.width(opt.width || 200);
  line.height((opt.height || 194));
  line.selection((opt.selection || dp.selection.range)(group, line, fields));

  line.chart_height = function() {
    return line.height() - label_height;
  }

  line.initBins = function() {
    var query, data = line.data();
    if(line.query()) {
      query = line.query()
    } else if(opt.query) {
      query = opt.query(data, fields, opt);
    } else {
      query = dp.query.month(data, fields, opt);
    }
    line.query(query);
    if(query.parameters) {
      line.selection().query_parameters(query.parameters)
    }
  };

  line.draw = function() {
    var roll = (line.update_rollup(), line.rollup()),
        chart_width = line.width(),
        chart_height = line.chart_height(),
        marks,
        idx, vis = line.vis(), partition_results;

    vis.selectAll('path').remove();

    partition_results = dv.partition_results(roll, fields, dims.length + 1);
    roll = partition_results.clean;

    idx = d3.range(roll[0].length);

    tick_scale = d3.scale.linear()
        .domain([d3.min(roll[0]), d3.max(roll[0])+(roll[0][1]-roll[0][0])])
        .range([0, chart_width])

    x_scale = d3.scale.linear()
        .domain([d3.min(roll[0]), d3.max(roll[0])])
        .range([0, chart_width])

    y_scale = d3.scale.linear()
        .domain([0, d3.max(roll[1])])
        .range([chart_height-1, 0]);

    marks = vis.attr("class", "base")
       .selectAll("path.base")
       .data([idx])
       .enter().append("svg:path")
       .attr('class', 'base')
       .attr("d", d3.svg.area()
        .x(function(d) { return x_scale(roll[0][d]); })
        .y0(function(d) { return chart_height; })
        .y1(function(d) { return area_y(roll[1][d]); }))


    brush_area = d3.svg.area()
      .x(function(d) { return x_scale(roll[0][d]); })
      .y0(function(d) { return chart_height; })
      .y1(function(d) { return chart_height; })

     brush = vis.selectAll("path.brush")
         .data([idx])
         .enter().append("svg:path")
         .attr('class', 'brush')
         .attr("d", brush_area);

    line.selection().marks(marks);

    line.labels();
  };

  line.labels = function() {
    var vis = line.vis(),
        x_ticks = tick_scale.ticks(10),
        y_ticks = y_scale.ticks(10), roll = line.rollup(),
        chart_height = line.chart_height(), chart_width = line.width();

    vis.selectAll('text').remove();




    var min_x = d3.min(roll[0]);
    var max_x = d3.max(roll[0]);

    var type = line.query().type;
    var tick_format = type ? dp.tick[type] : opt.tick_format;

    var min_date = tick_format(new Date(min_x), min_x);
    var max_date = tick_format(new Date(max_x), max_x % 12);
    var max_len_x = (max_date + '').length;
    vis.selectAll('text.label')
        .data([0])
        .enter()
        .append('svg:text')
        .attr('x',1)
        .attr('y',chart_height + config.xaxis_vertical_padding)
        .text(min_date + '');

    vis.selectAll('text.label')
        .data([0])
        .enter()
        .append('svg:text')
        .attr('x',chart_width - max_len_x * config.axis_character_offset)
        .attr('y',chart_height + config.xaxis_vertical_padding)
        .text(max_date + '');


    var min_y = y_ticks[0];
    var max_y = y_ticks[y_ticks.length - 1];
    var min_len_y = (min_y + '').length;
    var max_len_y = (max_y + '').length;
    var textx = chart_width + 10 - min_len_y*6;
    vis.selectAll('text.label')
        .data([0])
        .enter()
        .append('svg:text')
        .attr('x', chart_width + config.yaxis_gutter_width - config.yaxis_horizontal_padding - min_len_y * config.axis_character_offset)
        .attr('y',chart_height)
        .text(min_y + '');

    vis.selectAll('text.label')
        .data([0])
        .enter()
        .append('svg:text')
        .attr('x', chart_width + config.yaxis_gutter_width - config.yaxis_horizontal_padding - max_len_y * config.axis_character_offset)
        .attr('y', label_height)
        .text(max_y + '');
  }

  function area_y(val) {
    if(val === 0) return line.chart_height();
    val = y_scale(val);
    return val;
  }

  /** Computes bar height from data, index, and rollup
  */
  function area_height(d, i, roll) {
    var val = roll[1][i], chart_height = hist.height();
    if(val === 0) return 0;
    val = y_scale(val);
    return chart_height-val;
    return Math.max(chart_height - val, min_bar_height);
  }


  line.select = function(e) {
    var vis = line.vis(), chart_height = line.chart_height();
    if (e.data) {
      var roll = dv_profile_cache(e, line.query()),
          partition_results = dv.partition_results(roll, fields, dims.length + 1);
      roll = partition_results.clean;
      brush.attr("d", brush_area
         .y1(function(d) { return area_y(roll[1][d]); }))
         .classed('selected', true)
    } else {
      brush.attr("d", brush_area.y1(chart_height))
               .classed('selected', false)
    }
  };

  line.type = function() { return 'line'; };

  line.initUI();
  line.initBins();
  line.update_rollup();
  return line;
};
dp.chart.scatter = function(container, fields, opt)
{
  var group = this,
      scatter = dp.chart.chart(container, group, fields, opt),
      num_bins = 20,
      dims = opt.dims || [],
      num_xbins, num_ybins,
      min_opacity = global_scatter_visible === true ? .2 : 0, opacity_scale,
      space = 2, min, max,
      y_scale;

  scatter.width(opt.width || 200);
  scatter.height(opt.height || 200);
  scatter.selection(dp.selection.range(group, scatter, fields));

  scatter.initBins = function() {
    opt.bins = 20
    var query, query_fields = fields, query_data = scatter.data();

    if (opt.transform) {
      var field = query_fields[0]

      var transform = opt.transform(dw.derive.variable(field)),
          new_col_name = "*" + transform.name + "_" + field, transformed_field = query_data[new_col_name];
      if (!transformed_field) {
        transformed_field = transform.evaluate(query_data);
      }
      transformed_field = query_data.addColumn(new_col_name, transformed_field, transformed_field.type, {system:true, encoded:transformed_field.lut != undefined, lut:transformed_field.lut});
      query_fields = [transformed_field.name(), query_fields[1]]
      scatter.selection().fields(query_fields)
    }
    if(opt.query) {
      query = opt.query(query_data, query_fields, opt);
    } else {
      query = dp.query.bin(query_data, query_fields, opt);
    }
    scatter.query(query);
    if(query.parameters) {
      num_bins = query.parameters.num_bins || num_bins;
      scatter.selection().query_parameters(query.parameters);
      scatter.selection().step(query.parameters.step);
      scatter.selection().num_bins(num_bins);
      num_xbins = num_bins[0];
      num_ybins = num_bins[1];
    }
  };

  function opacity(i, rollup) {
    var v = rollup[2][i];
    return v == 0 ? 0 : opacity_scale(v);
  }

  scatter.draw = function() {
    var roll = (scatter.update_rollup(), scatter.rollup()), vis = scatter.vis(),
        chart_width = scatter.width(),
        chart_height = scatter.height(),
        box_width = Math.floor(chart_width / num_xbins),
        box_height = Math.floor((chart_height) / num_ybins),
        partition_results = dv.partition_results(roll, fields, dims.length + 1),
        xbmax, xbmin, ybmax, ybmin, x_scale, y_scale, marks, targets;

    roll = partition_results.clean;
    xbmax = d3.max(roll[0]);
    xbmin = d3.min(roll[0]);
    ybmin = d3.min(roll[1]);
    ybmax = d3.max(roll[1]);

    x_scale = d3.scale.linear().domain([xbmin, xbmax]).range([0, box_width * (num_xbins - 1)]);
    y_scale = d3.scale.linear().domain([ybmin, ybmax]).range([box_height * (num_ybins - 1), 0]);
    opacity_scale = d3.scale.linear().domain([0, d3.max(roll[2])]).range([min_opacity, 1]);

    vis.selectAll("text").remove();
  	vis.selectAll("rect").remove();

    var non_zero_indices = indices(roll);


    targets = marks = vis.selectAll('rect.base')
        .data(non_zero_indices)
        .enter().append('svg:rect')
        .attr('class', 'base')
        .classed('scatter_base', 'true')
        .attr('x', function(i) { return x_scale(roll[0][i]); })
        .attr('y', function(i) { return y_scale(roll[1][i]) - 1.5; })
        .attr('width', box_width)
        .attr('height', box_height)
        .attr('opacity', function(d){return opacity(d, roll)});

    vis.selectAll('rect.brush')
        .data(non_zero_indices)
        .enter().append('svg:rect')
        .attr('class', 'brush')
        .attr('pointer-events', 'none')
        .attr('width', box_width)
        .attr('height', box_height)
        .attr('x', function(i) { return x_scale(roll[0][i]); })
        .attr('y', function(i) { return y_scale(roll[1][i]) - 1.5; })
        .style('opacity', 0);


    var xmin = roll[0][0], xmax = xbmax + roll[0][1] - roll[0][0], ymax = ybmax + roll[1][1] - roll[1][0];

    roll = roll.map(function(c) {
      return non_zero_indices.map(function(i) {
        return c[i];
      })
    })

    vis.append('svg:text')
        .text(dp.tick.pretify(xmax))

        .attr('y', chart_height-1)
        .attr('x',chart_width-15)





    vis.append('svg:text')
          .text(xmin)
          .attr('x', 1)
          .attr('y', chart_height-1)

            vis.append('svg:text')
              .text(dp.tick.pretify(ymax))

              .attr('y', '10')

              .attr('x', chart_width)
              .attr('dx', -3)


          vis.append('svg:text')
              .text(dp.tick.pretify(ybmin))
              .attr('x', chart_width)
                .attr('dx', -3)
                .attr('y', chart_height - 20)


    scatter.selection().marks(marks).targets(targets).rollup(roll);
  };

  scatter.select = function(e) {
    var vis = scatter.vis();
    if (e.data) {
      var roll = e.data.query(scatter.query());

      partition_results = dv.partition_results(roll, fields, dims.length + 1);
      roll = partition_results.clean;
      vis.selectAll('rect.brush')
         .style('opacity', function(d){return opacity(d, roll)});
    } else {
      vis.selectAll('rect.brush')
         .style('opacity', 0);
    }
  };

  function bar_y(d, i, roll) {
    var val = roll[1][i], chart_height = scatter.height();
    if(val === 0) return chart_height;
    val = y_scale(val);
    return Math.min(val, chart_height-min_bar_height);
  }

  function bar_height(d, i, roll) {
    var val = roll[1][i], chart_height = scatter.height();;
    if(val === 0) return 0;
    val = y_scale(val);
    return Math.max(chart_height - val, min_bar_height);
  }

  scatter.type = function() { return 'scatter'; };

  function indices(t) {
    var idx = [], len = t[2].length;
    for (var i = 0; i < len; ++i) {
      if (t[2][i] > 0) idx.push(i);
    }
    return idx;
  }

  scatter.initUI();
  scatter.initBins();
  scatter.update_rollup();
  return scatter;
};
dp.chart.world_map = function(container, fields, opt) {
  var group = this,
      config = dp.config.vis,
      atlas = dp.chart.chart(container, group, fields, opt),
      field = fields[0],


      rollup_index,
      ext_container = opt.ext_container,
      graph_id = opt.graph_id,
      zoom_num = 0.8, loc_x = 0, loc_y = 0,
      arrow_panel_left, arrow_panel_right, arrow_panel_up, arrow_panel_down, arrow_panel_center,
      zoom_panel_in, zoom_panel_out, is_mousedown = false, curX = false, curY = false, cached_max;

  atlas.width(opt.width || 400);
  atlas.height(opt.height || 594);
  atlas.selection(dp.selection.world_map(group, atlas, fields));
  atlas.initBins = function() {
    var query = {dims: [field], vals: [dv.count('*')], code:false};
    atlas.query(query);
  };

  atlas.draw = function() {
	var roll = atlas.update_rollup().rollup(),
        chart_width = atlas.width(),
        chart_height = atlas.height(),
        vis = atlas.vis(), mercator = d3.geo.mercator(),
  	    path = d3.geo.path().projection(mercator),
  	    boundary_data = world_countries_features.features, boundaries, data = atlas.data();

    cached_max = d3.max(roll[1]);
    partition_results = dv.partition_results(roll, fields, fields.length);
    roll = partition_results.clean, field_lut = data[field].lut;
    rollup_index = boundary_data.map(function(d) {return d.id}).map(function(d) {return field_lut.indexOf(d)});

    ext_container.on('mousedown', function(d, i) {
      is_mousedown = true;
    });
    ext_container.on('mouseup', function(d, i) {
      is_mousedown = false;
      curX = false;
      curY = false;
    });
    $('body').mouseup(function() {
      is_mousedown = false;
      curX = false;
      curY = false;
    });
    $('#' + graph_id).mousewheel(function(event, delta) {
      zoom_num += delta / 30;
      if(zoom_num < 0.2) {
        zoom_num = 0.2;
      }
      if(zoom_num > 20) {
        zoom_num = 20;
      }
      atlas.zoom(zoom_num, loc_x, loc_y);
	});
    $('#' + graph_id).mousemove(function(evt) {
      if(is_mousedown) {
        if(curX === false) {
          var n = 'awef';
        }
        else {
          var diffX = evt.layerX - curX;
          var diffY = evt.layerY - curY;
          loc_x += diffX;
          loc_y += diffY;
          atlas.zoom(zoom_num, loc_x, loc_y);
        }
        curX = evt.layerX;
        curY = evt.layerY;
      }
    });

    boundaries = vis.append("svg:g").selectAll("path.map_region")
        .data(boundary_data)
        .enter().append("svg:path")
        .attr("d", path)
       .attr("class",  function(d, i) {return quantize(d, i, roll)})
        .classed("Blues", true)
       .classed('map_region', true)

    vis.append("svg:g").selectAll("path.brush")
          .data(boundary_data)
          .enter().append("svg:path")
          .attr("d", path)
          .attr("class", 'brush')
          .style("opacity", 0)
          .attr("pointer-events", "none");

      loc_x+=config.map_padding_x
      loc_y+=config.map_padding_y
      atlas.zoom(zoom_num, loc_x, loc_y)

















































































    atlas.selection().marks(boundaries).targets(boundaries).rollup([rollup_index]);
  };

  function rollup_data(d, i, roll) {
    var index = rollup_index[i];
    if (index === -1) return 0;
    return roll[1][index];
  }

  function quantize(d, i, roll) {
    var coloroffset = 1, numcolors = 8, colorcompress = 1, value, quantile, max = d3.max(roll[1]);
    value = rollup_data(d, i, roll);
    if(value === 0) return "";
    quantile = Math.min((Math.floor((value / (max))*(numcolors-1)*(colorcompress)))+coloroffset, numcolors);
		return "Blues q" + quantile + "-" + (numcolors+1);
  }

  atlas.zoom = function(scale, location_x, location_y) {

    location_x = location_x || 0;
    location_y = location_y || 0;
    var newx = -180 * scale/0.8 + location_x;
    var newy = -12 * scale/0.8 + location_y;
    atlas.vis().attr('transform', 'translate(' + newx + ',' + newy + ') scale(' + scale + ')');







    $('#' + graph_id + ' path').css('stroke-width', 0.8/scale + 'px');
  }

  atlas.select = function(e) {
    var vis = atlas.vis();
  	if (e.data) {
  	  var roll = e.data.query(atlas.query());
      var opacity_scale = d3.scale.linear().domain([0, d3.max(roll[1])]).range([.1, .9]);
  	  partition_results = dv.partition_results(roll, fields, fields.length);
  	  roll = partition_results.clean;

  	  vis.selectAll("path.brush")

        .style('opacity', function(d, i){
          var v = rollup_data(d, i, roll);
          if (v === 0) return 0;



          return opacity_scale(v)
          })
        .classed('brush', true)
  	} else {
  	  vis.selectAll('path.brush')
         .classed('brush', true)
         .style("opacity", 0)
  	}
  };

  atlas.type = function() { return 'atlas'; };
  atlas.initUI();

  atlas.vis().attr('transform', 'translate(-180,-12) scale(0.8)');
  return atlas;
};
dp.chart.month_histogram = function(container, fields, opt)
{
  opt = opt || {};
  var group = opt.group || this, months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  opt.query = dp.query.month;
  opt.selection = dp.selection.month
  opt.tick_format = function(d, i) {
    return months[d];
  }
  opt.tick_text_anchor = "center";

  var hist = dp.chart.histogram.apply(group, [container, fields, opt]);

  hist.type = function() { return 'month_histogram'; };
  return hist;
};
dp.chart.text_cluster = function(container, fields, opt)
{
  opt = opt || {};
  var group = opt.group || this,
      cluster = dp.chart.chart(container, group, fields, opt),
      w = opt.width || 400,
      h = (opt.height || 194), cashed_clusters,
	    limit = opt.limit || 15, timeout = opt.timeout || 200;

  cluster.width(w);
  cluster.height(h);

  cluster.initUI = function() {
    jQuery(container[0]).empty();
    container.attr('class', 'chart_area');
    var vis = container.append('div')
        .attr('width', cluster.width())
        .attr('min-width', cluster.width())
        .attr('height', cluster.height())
        .attr('class', 'bordered')
        .classed('cluster_visualization', true);
    cluster.vis(vis);
  };
  cluster.initBins = function() {
    cluster.query(undefined)
  };

  cluster.draw = function() {
    var data = cluster.data(),
        fields = cluster.fields(),
        d, names, roll, vis = cluster.vis(), groups;

    if (!fields || fields.length === 0) return;


    jQuery(vis[0]).empty();

    var q = 2, k = 2;
    var group_by_col = 'Release Date'
    if (true) {
      var view = dv.partition(data, ['datestr(Release Date)'])
    }

    cached_clusters = roll = dp.qgram_self_cluster(data, fields[0], q, k);

  	var idx = d3.range(Math.min(roll.length, 25)),
  	    column_widths, header_width = 20;

   	groups = vis.append('div')
  		.attr('class', 'base')
  		.selectAll('div.base')
        .data(idx)
       .enter().append('div')
        .attr('class', 'base')
        .classed('cluster_group', true)

	 groups.selectAll('div.cluster_element')
		.data(function(d) {return d3.range(roll[d].cluster.length).map(function(){return d})})
  	.enter().append('div')
  	.attr('class', 'cluster_element')
  	.text(function(d, i) {
  	  var str = roll[d].cluster[i], count = roll[d].counts[i];
  	  return (str != undefined) ? (''+ str).substr(0,35) + ' (' + count + ')' : '';
  	});
  };

  cluster.select = function(e) {
    var vis = cluster.vis(), roll;
    if (e.data) {

       jQuery(vis[0]).empty();

       var q = 2, k = 2, cache = [], filtered_lut = [], f = e.data[fields[0]], lut = f.lut;
       f.map(function(x) {
         if (x && !cache[lut[x]]) {
          filtered_lut.push(lut[x]);
         cache[lut[x]] = 1
         }
       })
       filtered_lut.sort();
       roll = dp.qgram_self_cluster(filtered_lut, q, k);

     	var idx = d3.range(Math.min(roll.length, 25)),
     	    column_widths, header_width = 20;

      	groups = vis.append('div')
     		.attr('class', 'base')
     		.selectAll('div.base')
           .data(idx)
          .enter().append('div')
           .attr('class', 'base')
           .classed('cluster_group', true)

   	 groups.selectAll('div.cluster_element')
   		.data(function(d) {return roll[d].cluster})
     	.enter().append('div')
     	.attr('class', 'cluster_element')
     	.text(function(d) {return (d != undefined) ? (''+ d).substr(0,35) : '';});
	  } else {

        jQuery(vis[0]).empty();


        roll = cached_clusters;

      	var idx = d3.range(Math.min(roll.length, 25)),
      	    column_widths, header_width = 20;

       	groups = vis.append('div')
      		.attr('class', 'base')
      		.selectAll('div.base')
            .data(idx)
           .enter().append('div')
            .attr('class', 'base')
            .classed('cluster_group', true)

    	 groups.selectAll('div.cluster_element')
    		.data(function(d) {return roll[d].cluster})
      	.enter().append('div')
      	.attr('class', 'cluster_element')
      	.text(function(d) {return (d != undefined) ? (''+ d).substr(0,35) : '';});
    }
  };

  cluster.type = function() { return 'text_cluster'; };
  cluster.initUI();
  cluster.initBins();
  cluster.update_rollup();

  cluster.visible_rows = function() {

    return [0, 20]
  }

  return cluster;
};
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
dp.factory.bin = function() {
  var factory = {},
      date_factory = dp.factory.date();

  factory.default_bin = function(data, col, opt) {
    var type = col.type.type();
    switch (type) {
      case 'number':
      case 'int':
      case 'numeric':
        return dp.query.bin(data, [col.name()]).dims[0].array(col);
      case 'datetime':
      case 'ordinal':
        return date_factory.query(date_factory.default_type(col))(data, [col.name()]).dims[0].array(col);
      case 'geo':
        return col;
      case 'geolocation':
        return col;
      case 'geo_world':
        return col;
      case 'string':
      case 'nominal':
        return dv.categorical_bin(col.name()).array(col, col.lut)
    }
  }

  factory.all_bins = function(data, col, opt) {
    var type = col.type.type(),
        binOptions;
    switch (type) {
      case 'number':
      case 'int':
      case 'numeric':


        binOptions = [10];
        return binOptions.map(function(b) {
          var x = dp.query.bin(data, [col.name()], {bins:b});
          x.bin = function() {
            return x.dims[0].array(col)
          }
          return x;
        })
      case 'datetime':
      case 'ordinal':
        binOptions = ['year', 'month', 'quarter']
        return binOptions.map(function(b) {
          var x = date_factory.query(b)(data, [col.name()]);
          x.bin = function() {
            return x.dims[0].array(col)
          }
          x.type = b;
          return x;
        })
      case 'geolocation':
        return [{bin:function(){return col}}];
      case 'geo_world':
        return [{bin:function(){return col}}];
      case 'string':
      case 'nominal':
        var x = dv.categorical_bin(col.name());
        x.bin = function() {
          return x.array(col, col.lut);
        }
        return [x];
    }
  }



  return factory;
};

dp.factory.date = function() {
  var factory = {};


  factory.default_type = function(data, opt) {
    opt = opt || {};
    var min = opt.min,
        max = opt.max, minmax;

    if (min == undefined) {
      minmax = dt.minmax(data);
      min = minmax[0];
    }
    if (max == undefined) {
      minmax = minmax || dt.minmax(data);
      max = minmax[1];
    }

    if (max - min < 86400000) {
      return 'hour';
    }
    if (false) {

      return 'month';
    } else {
      return 'year'
    }
  }




  factory.query = function(type) {
    return dp.query[type];
  }

  factory.ticks = function(type, options) {
    return dp.tick[type];
  }

  return factory;
};
dp.quality = {
  valid: 'valid',
  error: 'error',
  missing: 'missing'
};

dp.quality.keys = [dp.quality.valid, dp.quality.error, dp.quality.missing];
dp.quality.bar = function(container, fields, opt) {
  var group = this,
      bar = dp.chart.chart(container, group, fields, opt),
      data = group.data, rollup, cleaned_rollup,
      min_bar_width = 2,
      x_scale, vis, query, normalized_summary,
      selection = dp.selection.quality(group, bar, fields);

  bar.width(opt.width || 200);
  bar.height(opt.height || 30);
  bar.selection(selection);
  bar.initBins = function() {
    if(opt.query) {
      query = opt.query(data, fields, opt);
    } else {
      query = {dims: [bar.fields()[0]], vals: [dv.count('*')], code:true};
    }
    bar.query(query);
  };

  bar.draw = function() {

    var idx, vis = bar.vis(), chart_width = bar.width(), chart_height = bar.height(),
        roll = data.query(query);
    partition_results = dv.partition_results(roll, fields, 1);
    roll = partition_results.summaries[0];
    sortidx = roll.idx;


    normalized_summary = normalize_summary(roll, 10, chart_width);

    var bars = vis.selectAll('rect.bar')
        .data(normalized_summary)
        .enter().append('svg:rect')
        .attr('x', function(d, i) { return normalized_summary.slice(0, i).reduce(function(s,x) {return s + x.val}, 0); })
        .attr('class', function(d) {return d.type})
        .classed('bar', true)
        .attr('width', function(d, i) {return d.val})
        .attr('height', chart_height)

    bars.append('svg:title')
        .text(function(d, i) {return barTitle(roll, d)});

    vis.selectAll('rect.bar_brush')
        .data(normalized_summary)
        .enter().append('svg:rect')
        .attr('class', function(d) {return d.type})
        .classed('bar_brush', true)
        .attr('x', function(d, i) { return normalized_summary.slice(0, i).reduce(function(s,x) {return s + x.val}, 0); })
        .attr('width', 0)
        .attr('height', chart_height)

    var targets = vis.selectAll('rect.pointer')
    .data(normalized_summary)
    .enter().append('svg:rect')
    .attr('x', function(d, i) { return normalized_summary.slice(0, i).reduce(function(s,x) {return s + x.val}, 0); })
    .attr('opacity', 0)
    .attr('class', 'pointer')
    .attr('width', function(d, i) {return d.val})
    .attr('height', chart_height)


    selection.marks(bars).targets(targets).rollup(roll);
    return bars;
  };

  bar.select = function(e) {
    var vis = vis = bar.vis();
  	if (e.data) {
      var idx, chart_width = bar.width(), chart_height = bar.height(),
          roll = e.data.query(query);
      partition_results = dv.partition_results(roll, fields, 1);
      roll = partition_results.summaries[0];
      sortidx = roll.idx;
      normalized_summary = normalize_summary(roll, 10, chart_width, {total: bar.data().rows()});
      vis.selectAll('rect.bar')
          .classed('background', true)

      vis.selectAll('rect.bar_brush')
          .attr('width', function(d, i) {return normalized_summary[i].val})
  	} else {
      vis.selectAll('rect.bar')
          .classed('background', false)
      vis.selectAll('rect.bar_brush')
          .attr('width', 0)
  	}
  };

  var normalize_summary = function(summary, min, width, opt) {
    opt = opt || {}
    var nsummary = [], total, nonzero, remainder, w = 0, bw, keys;
    summary.total = total = opt.total || (summary.valid + summary.error + summary.missing);
    nonzero = d3.keys(summary).filter(function(k) {
      return k != 'unique' && k != 'total';
    }).filter(function(key) {
      return summary[key] != 0;
    }).length;

    remainder = width - nonzero * min;
    keys = dp.quality.keys;
    keys.forEach(function(key) {
      bw = Math.round((summary[key] === 0) ? 0 : (min + (remainder * (summary[key] - 1) / (total - nonzero))));
      nsummary.push({type: key, val: bw});
      w += bw;
    });
    return nsummary;
  }

  var barTitle = function(summary, d) {
    var l = summary[d.type];
    switch (d.type) {
      case 'missing':
      case 'valid':
        return l + ' ' + d.type + ' ' + (l === 1 ? 'value' : 'values');
      case 'error':
        return l + ' ' + (l === 1 ? 'value' : 'values') + " don't parse";
    }
  }

  bar.type = function() { return 'bar'; };
  bar.initUI();
  return bar;
};
dp.quality.scatter = function(container, fields, opt) {
  var group = this,
      scatter = {},
      data = group.data, rollup, cleaned_rollup,
      field = fields[0],
      chart_width = opt.width || 400,
      chart_height = (opt.height || 30),
      min_scatter_width = 2,
      scatter_height = chart_height,
      x_scale, vis, query;

  if(typeOf(container) === 'string') {
    container = d3.select('#'+ container)
        .append('svg:svg')
        .attr('width', chart_width)
        .attr('height', chart_height);
  }


  scatter.initUI = function() {
    container.attr('class', 'chart_area');
    vis = container.append('svg:g')
        .attr('width', chart_width)
        .attr('height', chart_height)
        .attr('class', 'bordered');

  };

  scatter.initBins = function() {
    if(opt.query) {
      query = opt.query(data, fields, opt);
    } else {
      query = {dims: [field], vals: [dv.count('*')]};
    }
  };

  scatter.update = function() {
    vis.append('svg:rect')
      .attr('width', chart_width)
      .attr('height', chart_height)
      .classed('valid', true)
    return;
    var idx;
    function mouseout(d, i) {
    }
    function mouseover(d, i) {
    }
    function clicked(d, i) {
    }

    scatter.initBins();
    roll = data.query(query);
    partition_results = dv.partition_results(roll, fields, 1);
    roll = partition_results.summaries[0];
    sortidx = roll.idx;

    function mouseout() {
    };

    function mouseover(d, i) {
    };

    normalized_summary = normalize_summary(roll, 10, chart_width);

    var scatters = vis.selectAll('rect.scatter')
        .data(normalized_summary)
        .enter().append('svg:rect')
        .attr('class', 'scatter')
        .attr('x', function(d, i) { return normalized_summary.slice(0, i).reduce(function(s,x) {return s + x.val}, 0); })
        .attr('class', function(d) {return d.type})
        .attr('width', function(d, i) {return d.val})
        .attr('height', chart_height)
        .on('mouseover', mouseover)
        .on('mouseout', mouseout)
        .append('svg:title')
        .text(function(d, i) {return scatterTitle(roll, d)});

    return scatters;
  };

  scatter.select = function(e) {
  	if (e.data) {

  	} else {

  	}
  };

  scatter.rollup = function() { return roll; };

  scatter.fields = function() {
  	if (arguments.length == 0) return fields;
  	fields = arguments;
  	field = fields[0];
  	return scatter;
  };

  scatter.options = function() {
  	if (arguments.length == 0) return fields;
  	opt = arguments[0];
  	bins = opt.bins || bins;
  	w = opt.width || w;
  	h = opt.height || h;
  	scatter.update();
  	return scatter;
  };

  var normalize_summary = function(summary, min, width) {

    var nsummary = [], total, nonzero, remainder, w = 0, bw, keys;
    summary.total = total = (summary.valid + summary.bparse + summary.brole + summary.missing);
    nonzero = d3.keys(summary).filter(function(k) {
      return k != 'unique' && k != 'total';
    }).filter(function(key) {
      return summary[key] != 0;
    }).length;

    remainder = width - nonzero * min;
    keys = dp.quality.keys;
    keys.forEach(function(key) {
      bw = Math.round((summary[key] === 0) ? 0 : (min + (remainder * (summary[key] - 1) / (total - nonzero))));
      nsummary.push({type: key, val: bw});
      w += bw;
    });
    return nsummary;
  }

  var scatterTitle = function(summary, d) {
    var l = summary[d.type];
    switch (d.type) {
      case 'missing':
      case 'valid':
        return l + ' ' + d.type + ' ' + (l === 1 ? 'value' : 'values');
      case 'bparse':
        return l + ' ' + (l === 1 ? 'value' : 'values') + " don't parse";
      case 'brole':
        return l + ' ' + (l === 1 ? 'value' : 'values') + " don't match role";
    }
  }

  scatter.type = function() { return 'scatter'; };
  scatter.initUI();
  scatter.update();

  return scatter;
};
dp.quality.spreadsheet = function(container, fields, opt) {
  var group = this,
      bar = dp.chart.chart(container, group, fields, opt),
      data = group.data, rollup, cleaned_rollup,
      min_bar_width = 2;

  bar.width(opt.width || 200);
  bar.height(opt.height || 30);
  bar.initBins = function() {

  };

  bar.draw = function() {

  };

  bar.select = function() {

  }

  bar.type = function() { return 'spreadsheet'; };
  bar.initUI();
  return bar;
};
dp.tick = {};

var BILLION = 1000000000, MILLION = 1000000, THOUSAND = 1000;
dp.tick.pretify = function(val) {
  if (val >= BILLION) {
    val = Math.ceil(val / BILLION) + 'B';
  } else if (val >= MILLION) {
    val = Math.ceil(val / MILLION) + 'M';
  } else if (val >= THOUSAND) {
    val = Math.ceil(val / THOUSAND) + 'K';
  }
  return val;
}
dp.tick.month = function() {
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mar', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return function(d, i) {
    return months[i];
  }
}();dp.tick.quarter = function() {
  var months = ['Q1', 'Q2','Q3','Q4'];
  return function(d, i) {
    return months[i];
  }
}();dp.tick.month_year = function() {
  return function(d, i) {
    return [d.getMonth()+1, d.getFullYear()].join('/');
  }
}();dp.tick.year = function() {
  return function(d, i) {
    if (i === 0) return 1911
    return 2010
    return d.getFullYear();
  }
}();dp.tick.day = function() {
  return function(d, i) {
    return [d.getMonth()+1, d.getDate(), d.getFullYear()].join('-');
  }
}();dp.tick.hour = function() {
  return function(d, i) {
    var hrs = d.getHours();
    var ampm = "AM";
    if(hrs > 12) {
      ampm = "PM";
      hrs -= 12;
    }
    else if(hrs == 0) {
      hrs = 12;
    }
    else if(hrs == 12) {
      ampm = "PM";
    }
    return hrs + ":00 " + ampm;
  }
}();dp.scroll = {};dp.scroll.histogram = function(container, fields, opt) {

};
dp.scroll.bar = function(container, fields, opt) {
  var group = this,
      bar = dp.chart.chart(container, group, fields, opt),
      data = group.data, rollup, cleaned_rollup,
      chart_vis = opt.chart_vis,
      min_bar_width = 2,
      bar_space = 2,
      bar_height = 10,
      scroll_height = 1,
      scroll_space = 0,
      targets, marks,
      y_scale, sortidx, vis, brush, selection = dp.selection(group, bar, fields), query, scrollbar_panel, scrollbar, num_bars;

  bar.width(opt.width || 20);
  bar.height(opt.height || 594);

  bar.initUI = function() {
    container.attr('class', 'chart_area');
    vis = container.append('svg:g')
        .attr('width', bar.width())
        .attr('height', bar.height())
        .attr('class', 'bordered');

    vis.attr('transform', 'translate(180,10)')

  };

  bar.initBins = function() {
    bar.query({dims: bar.fields(), vals: [dv.count('*')], code:false});
  };

  bar.draw = function() {
    var roll = bar.update_rollup().rollup(),
        partition_results = dv.partition_results(roll, fields, 1);

    var oroll = roll = partition_results.clean;
    roll = dv.sort_multiple(roll, [fields.length], [dv.result_order.DESC]);
    sortidx = roll.idx;
    var onscreen_bars = Math.min(60, roll[0].length),
        idx = d3.range(roll[0].length),
        scroll_array = [],
        scroll_total = bar.height(),
        num_bars = idx.length;

    for(i = 0; i < scroll_total; i++) {
        scroll_array.push(i);
    }

    scrollbar_panel = vis.append("svg:g")
               .attr("width", bar.width())
               .attr("height", bar.height())
               .attr('class', 'profilerScrollBar');

    x_scale_scrollbar = d3.scale.linear()
          .domain([0, d3.max(roll[1])])
          .range([0, bar.width()]);

    bar.redraw(0, 0);
  };

  bar.contextmouseover = function(d, i, was_clicked) {
    if(!dp.selection.is_mouse_down && !was_clicked) { return; }
    chart_vis.start_row(d);
    chart_vis.end_row(d+60);
    chart_vis.update();

    bar.redraw(d, i);
  };

  bar.redraw = function(d, i) {
    var scroll_array = [], chart_height = bar.height() * 2, scroll_total = chart_height, show_scroll = true;
    var roll = bar.update_rollup().rollup(),
        partition_results = dv.partition_results(roll, fields, 1);

    var oroll = roll = partition_results.clean;
    roll = dv.sort_multiple(roll, [fields.length], [dv.result_order.DESC]);

    if(bar.rollup()[0].length < 24) show_scroll = false;
    for(var k = 0; k < scroll_total; k++) {
        scroll_array.push(k);
    }
    scrollbar_panel.selectAll("rect").remove();

    scrollbar = scrollbar_panel.append('svg:rect')
        .attr('class', 'context')
        .attr('y', function(k) { return 0 })
        .attr('x', 0)
        .attr('height', chart_height)
        .attr('width', bar.width())

        if (show_scroll) {
          var x_scale = d3.scale.linear()
                .domain([0, d3.max(roll[1])])
                .range([0, bar.width()]);
                       var y_scale = d3.scale.linear()
                              .domain([0, 2 *roll[1].length])
                              .range([0, chart_height]);


            scrollbar_panel.selectAll('rect.base')
                .data(bar.rollup()[1])
                .enter().append('svg:rect')
                .attr('class', 'base  ')
                .attr('y', function(d, i) { return y_scale(i); })
                .attr('x', 0)
                .attr('height', 1)
                .attr('width', function(d, i) {return x_scale(((i < 2 && i % 2 === 0) + 1))})
                .attr('opacity', .6)

                scrollbar = scrollbar_panel.selectAll('rect.context_filled')
                    .data(d3.range(i - 5, i + 19))
                    .enter().append('svg:rect')
                    .attr('class', 'context_filled')
                    .attr('y', function(k) { return ((scroll_height + scroll_space) * k) + 5; })
                    .attr('x', 0)
                    .attr('height', scroll_height)
                    .attr('width', bar.width())

        }


      if (show_scroll) {
        scrollbar.on("click", function(d, i) {
          bar.contextmouseover(d, i, true);
        })
        .on("mouseover", function(d, i) {
          bar.contextmouseover(d, i, false);
        })
        .on("mousedown", function(d, i) {
          bar.contextmouseover(d, i, false);
        });

      }
  };

  bar.type = function() { return 'bar'; };
  bar.initUI();
  return bar;
};
dp.scroll.scatter = function(container, fields, opt) {
  var group = this,
      bar = dp.chart.chart(container, group, fields, opt),
      data = group.data, rollup, cleaned_rollup,
      chart_vis = opt.chart_vis,
      min_bar_width = 2,
      bar_space = 2,
      bar_height = 10,
      scroll_height = 1,
      scroll_space = 0,
      targets, marks,
      y_scale, sortidx, vis, brush, selection = dp.selection(group, bar, fields), query, scrollbar_panel, scrollbar, num_bars;

  bar.width(opt.width || 20);
  bar.height(opt.height || 594);

  bar.initUI = function() {
    container.attr('class', 'chart_area');
    vis = container.append('svg:g')
        .attr('width', bar.width())
        .attr('height', bar.height())
        .attr('transform', 'translate(180,10)')
        .attr('class', 'bordered');
  };

  bar.initBins = function() {
    bar.query({dims: bar.fields(), vals: [dv.count('*')], code:false});
  };

  bar.draw = function() {
    vis.selectAll("text").remove();
  	vis.selectAll("rect").remove();

    vis.append('svg:rect')
      .attr('width', 10)
      .attr('x', 10)
      .attr('height', bar.height())
      .classed('valid', true)








    return;
  };

  bar.contextmouseover = function(d, i, was_clicked) {
    if(!dp.selection.is_mouse_down && !was_clicked) { return; }
    chart_vis.start_row(d);
    chart_vis.end_row(d+60);
    chart_vis.update();

    bar.redraw(d, i);
  };

  bar.redraw = function(d, i) {
    var scroll_array = [], chart_height = bar.height(), scroll_total = chart_height, show_scroll = true;
    if(bar.rollup()[0].length < 24) show_scroll = false;
    for(var k = 0; k < scroll_total; k++) {
        scroll_array.push(k);
    }
    scrollbar_panel.selectAll("rect").remove();
    scrollbar = scrollbar_panel.selectAll('rect.base')
      .data(scroll_array)
      .enter().append('svg:rect')
      .attr('class', function(k) {
        if(show_scroll && i-5 <= k && k <= i+5) { return 'context_filled'; }
        return 'context';
      })
      .attr('y', function(k) { return (scroll_height + scroll_space) * k; })
      .attr('x', 0)
      .attr('height', scroll_height)
      .attr('width', bar.width())

      if (show_scroll) {
        scrollbar.on("click", function(d, i) {
          bar.contextmouseover(d, i, true);
        })
        .on("mouseover", function(d, i) {
          bar.contextmouseover(d, i, false);
        })
        .on("mousedown", function(d, i) {
          bar.contextmouseover(d, i, false);
        });

      }
  };

  bar.type = function() { return 'bar'; };
  bar.initUI();
  return bar;
};
dp.menu = {};

dp.menu.menu = function(container, fields, menu_items, opt) {
  opt = opt || {};
  var group = this,
      menu = dp.chart.chart(container, group, fields, opt),
      menu_width = opt.width || 20,
      menu_height = opt.height || 10,
      quality_width = opt.quality_width || 180,
      chart_width = opt.chart_width || 200,
      graph_id = opt.graph_id,
      vis, menu_image, menu_div, menu_panel;

  menu.initUI = function() {
    container.attr('class', 'chart_area');
    vis = container.append('svg:g')
        .attr('width', menu_width)
        .attr('height', menu_height)
        .attr('transform', 'translate(' + quality_width + ',0)')
        .attr('class', 'bordered');
  };

  menu.draw = function() {
    $('#' + graph_id + ' .menu_toggler').remove();
    menu_panel = vis.append("svg:g")
               .attr("width", menu_width)
               .attr("height", menu_height)
               .attr('fill', '#EFEFEF')
               .attr('class', 'menu');

    menu_image = menu_panel.append('svg:image')
                           .attr('width', menu_width)
                           .attr('height', menu_height)
                           .attr('fill', '#EFEFEF')
                           .attr('class', 'menu_toggler')
                           .attr('xlink:href', '../../profiler/style/images/downArrow.png')
                           .on('mousedown', menu.show);

    menu_div = d3.select('#'+ graph_id)
          .append('div')
          .attr('class', 'chart_menu')
          .attr('id', 'chart_menu')
          .style('width', chart_width)
          .style('height', chart_width)
          .style('left', chart_width)
          .style('top', 0)
          .style('position', 'absolute')
          .style('visibility', 'hidden');

    menu_items.map(function(item) {
        dp.menu.menu_widget(jQuery(menu_div[0]), item.name, item.type, item.options)
    });
  };

  menu.show = function() {
    menu_div.style('visibility', 'visible');
    menu_image.attr('xlink:href', '../../profiler/style/images/rightArrow.png');
    menu_image.on('mousedown', menu.hide);
  };

  menu.chart = function() {
    return opt.chart_vis;
  }

  menu.hide = function() {
    menu_div.style('visibility', 'hidden');
    menu_image.attr('xlink:href', '../../profiler/style/images/downArrow.png');
    menu_image.on('mousedown', menu.show);
  };

  return menu;
};

dp.menu.menu_widget = function (parent_container, name, type, opt) {
  opt = opt || {};
  var editor_id = opt.editor_id, container = dv.jq('div').addClass('editor_container');

  parent_container.append(container);

  function input(container, name, type, opt) {
    var editor = dv.jq('input');
    editor.attr('id', editor_id);
    editor.val(opt.default_value);
    editor.keypress(function(event) {
      if (event.keyCode === 13) {
        opt.onenter(editor.val(), editor.attr('id'));
      }
    });
    container.append(editor);
  }

  function select(container, name, type, opt) {
    var editor = dv.jq('select', opt);
    editor.attr('id', editor_id);
    editor.change(function() {
      opt.onchange(editor.val());
    })
    container.append(editor);
  }

  function label(container, name, type, for_id, opt) {
    var label = dv.jq('label');
    label.attr('for', for_id);
    label.append(name);
    container.append(label);
  }

  label(container, name, type, editor_id, opt);

  switch (type) {
    case dp.menu.menu_widget.type.input:
      input(container, name, type, opt);
    break;
    case dp.menu.menu_widget.type.select:
      select(container, name, type, opt);
    break;
  }
};

dp.menu.menu_widget.type= {
 input:'input',
 select:'select'
};
dp.menu.histogram = function(container, fields, opt) {

  function bin_change(new_value, old_value) {
    var chart = histogram.chart();
    chart.option('bins', new_value);
    chart.update();
  }

  function scale_change(new_value, old_value) {
    var chart = histogram.chart();
    if (new_value === 'linear') {
      chart.option('transform', undefined)
    } else {
      chart.option('transform', dw.derive[new_value]);
    }
    chart.update();
  }

  var items = [
    {
      name:'Bins', type:'select', options:{
      onchange:bin_change,
      select_options:{'10':10, '20':20, '50':50}}
    },
    {name:'Aggregate', type:'select', options:{select_options:{'Count':'Count', 'Average':'Average', 'Sum':'Sum'}}},
    {
      name:'Scale', type:'select', options:{
      onchange:scale_change,
      select_options:{'linear':'linear', 'log':'log', 'zscore':'zscore', 'quantile':'quantile'}}
    }
  ], histogram = dp.menu.menu(container, fields, items, opt), vis = opt.vis, chart_vis = opt.chart_vis;

  histogram.initUI();
  histogram.update();

  return histogram;

};
dp.menu.date_histogram = function(container, fields, opt) {

  function bin_change(new_value, old_value) {
    var chart = line.chart();
    chart.option('query', dp.factory.date().query(new_value));
    chart.option('tick_format', dp.factory.date().ticks(new_value));
    chart.update();
  }

  var items = [
    {
      name:'Bins', type:'select', options:{
      onchange:bin_change,
      select_options:{'year':'year', 'month':'month', 'day':'day'}}
    }
  ], line = dp.menu.menu(container, fields, items, opt), vis = opt.vis, chart_vis = opt.chart_vis;

  line.initUI();
  line.update();

  return line;

};
dp.menu.spreadsheet = function(container, fields, opt) {
  var items = [
  ], menu = dp.menu.menu(container, fields, items, opt), vis = opt.vis, chart_vis = opt.chart_vis;

  menu.initUI();
  menu.update();
  return menu;
};
dp.menu.text_cluster = function(container, fields, opt) {
  var items = [
  ], menu = dp.menu.menu(container, fields, items, opt), vis = opt.vis, chart_vis = opt.chart_vis;

  menu.initUI();
  menu.update();
  return menu;
};
dp.menu.bar = function(container, fields, opt) {

  function sort_change(new_value, old_value) {
    var chart = bar.chart();
    chart.option('sort', new_value);
    chart.update();
  }

  var items = [
    {
      name:'Sort', type:'select', options:{
      onchange:sort_change,
      select_options:{'count':'count', alphabet:'alphabetically'}}
    }], bar = dp.menu.menu(container, fields, items, opt);

  bar.initUI();
  bar.update();

  return bar;
};
dp.menu.grouped_bar = function(container, fields, opt) {
  var items = [
  ], menu = dp.menu.menu(container, fields, items, opt), vis = opt.vis, chart_vis = opt.chart_vis;

  menu.initUI();
  menu.update();
  return menu;
};
dp.menu.line = function(container, fields, opt) {

  function bin_change(new_value, old_value) {
    var chart = line.chart();
    chart.option('query', dp.factory.date().query(new_value));
    chart.option('tick_format', dp.factory.date().ticks(new_value));
    chart.update();
  }

  var items = [
    {
      name:'Bins', type:'select', options:{
      onchange:bin_change,
      select_options:{'year':'year', 'month':'month', 'day':'day'}}
    }
  ], line = dp.menu.menu(container, fields, items, opt), vis = opt.vis, chart_vis = opt.chart_vis;

  line.initUI();
  line.update();

  return line;

};
dp.menu.scatter = function(container, fields, opt) {

  function bin_change(new_value, old_value) {
    var chart = scatter.chart();
    chart.option('bins', new_value);
    chart.update();
  }

  function scale_change(new_value, old_value) {
    var chart = scatter.chart();
    if (new_value === 'linear') {
      chart.option('transform', undefined)
    } else {
      chart.option('transform', dw.derive[new_value]);
    }
    chart.update();
    chart.option('containing_vis').update_scroll();
  }

  var items = [
    {
      name:'Bins', type:'select', options:{
      onchange:bin_change,
      select_options:{'10':10, '20':20, '50':50}}
    },
    {name:'Aggregate', type:'select', options:{select_options:{'Count':'Count', 'Average':'Average', 'Sum':'Sum'}}},
    {
      name:'x Scale', type:'select', options:{
      onchange:scale_change,
      select_options:{'linear':'linear', 'log':'log'}}
    },
    {
      name:'y Scale', type:'select', options:{
      onchange:scale_change,
      select_options:{'linear':'linear', 'log':'log'}}
    }
  ], scatter = dp.menu.menu(container, fields, items, opt), vis = opt.vis, chart_vis = opt.chart_vis;

  scatter.initUI();
  scatter.update();

  return scatter;

};
dp.menu.world_map = function(container, fields, opt) {
  var world_map = dp.menu.menu(container, fields, [], opt);

  world_map.initUI();
  world_map.update();

  return world_map;
};
dp.menu.month_histogram = function(container, fields, opt) {
  var month_histogram = dp.menu.menu(container, fields, [], opt);

  month_histogram.initUI();
  month_histogram.update();

  return month_histogram;
};
dp.summary = {};
dp.summary.numeric = function(container, fields, opt) {
  var group = this,
      bar = {},
      data = group.data, rollup, cleaned_rollup,
      field = fields[0],
      chart_width = opt.width || 400,
      chart_height = (opt.height || 30),
      vis;

  if(typeOf(container) === 'string') {
    container = d3.select('#'+ container)
        .append('svg:svg')
        .attr('width', chart_width)
        .attr('height', chart_height);
  }

  bar.initUI = function() {
    container.attr('class', 'chart_area');
    vis = container.append('svg:g')
        .attr('width', chart_width)
        .attr('height', chart_height)
        .attr('class', 'bordered');
  };

  bar.initBins = function() {
  };

  bar.update = function() {

    var idx;

    bar.initBins();

    return bars;
  };

  bar.select = function(e) {
  	if (e.data) {

  	} else {

  	}
  };

  bar.rollup = function() { return roll; };

  bar.fields = function() {
  	if (arguments.length == 0) return fields;
  	fields = arguments;
  	field = fields[0];
  	return bar;
  };

  bar.options = function() {
  	if (arguments.length == 0) return fields;
  	opt = arguments[0];
  	bins = opt.bins || bins;
  	w = opt.width || w;
  	h = opt.height || h;
  	bar.update();
  	return bar;
  };

  var normalize_summary = function(summary, min, width) {

    var nsummary = [], total, nonzero, remainder, w = 0, bw, keys;
    summary.total = total = (summary.valid + summary.error + summary.missing);
    nonzero = d3.keys(summary).filter(function(k) {
      return k != 'unique' && k != 'total';
    }).filter(function(key) {
      return summary[key] != 0;
    }).length;

    remainder = width - nonzero * min;
    keys = dp.quality.keys;
    keys.forEach(function(key) {
      bw = Math.round((summary[key] === 0) ? 0 : (min + (remainder * (summary[key] - 1) / (total - nonzero))));
      nsummary.push({type: key, val: bw});
      w += bw;
    });
    return nsummary;
  }

  var barTitle = function(summary, d) {
    var l = summary[d.type];
    switch (d.type) {
      case 'missing':
      case 'valid':
        return l + ' ' + d.type + ' ' + (l === 1 ? 'value' : 'values');
      case 'error':
        return l + ' ' + (l === 1 ? 'value' : 'values') + " don't parse";
    }
  }

  bar.type = function() { return 'bar'; };
  bar.initUI();
  bar.update();

  return bar;
};
dp.editor = function(container, fields, opt) {
  opt = opt || {};
  var editor = {},
      group = this,
      bar = {},
      data = group.data, rollup, cleaned_rollup,

      editor_width = opt.width || 200,
      editor_height = (opt.height || 30),
      vis, query;

  if(typeOf(container) === 'string') {
    container = d3.select('#'+ container)
        .append('div')
        .attr('width', editor_width)
        .attr('height', editor_height);
  }

  editor.width = function() {
    if(!arguments.length) return editor_width;
  }

  editor.height = function() {
    if(!arguments.length) return editor_height;
  }

  editor.container = function () {
    if(!arguments.length) return container;
  }

  return editor;
};dp.editor.range = function(container, fields, opt) {
  var input = dp.editor(container, fields, opt),
      container = input.container(),
      slider;

  slider = container
      .append("div")
      .attr('height', input.height())
      .attr('width', input.width());


  jQuery(slider).slider({
  			range: true,
  			min: 0,
  			max: 500,
  			values: [ 75, 300 ],
  			slide: function( event, ui ) {
  				$( "#amount" ).val( "$" + ui.values[ 0 ] + " - $" + ui.values[ 1 ] );
  			}
  		});

  return input;
};dp.editor.input = function(container, fields, opt) {
  var input = dp.editor(container, fields, opt);

  return input;
};dp.editor.formula = function(container, opt)
{
  opt = opt || {};
  var group = this,
      editor = {},
      data = opt.data,
      onupdate = opt.onupdate,
      w = opt.width || 400,
      h = (opt.height || 194),
      script_container, script_input, script_submit, transform_type_select,
      transform_types = opt.transform_types || dw.transform.types, script_text, current_transform;

  function choose_example() {






  };

  editor.request = function() {
    var script_text = script_input.attr('value', script_text),
        transform, update_dashboard = false;
    switch (transform_type_select.val()) {
      case 'filter':
           transform = dw.derive.derived_predicate(dw.parser.parse(script_text));
           update_dashboard = true;
           break
      case 'derive':
      default:
        transform = dw.derive().formula(script_text).insert_position(dw.INSERT_END);
        break;
    }
    return {derived_transform: transform, update_dashboard: true}
  }

  function submit_transform() {
    if(onupdate) {
      onupdate(editor.request())
    }
  }

  editor.initUI = function() {
    script_input = dv.jq('textArea').attr('id', 'playground_script_input');
    script_submit = dv.jq('button').attr('id','script_submit').append('execute');
    script_container = dv.jq('div').attr('id', 'playground_script_container');
    transform_type_select = dv.jq('select').attr('id', 'upload_example_select');
    script_container.append(transform_type_select).append(script_submit).append(script_input);


    script_submit.click(function() {
      submit_transform();
    })

    add_option = function(type, name) {
  		dv.add_select_option(transform_type_select, name, type);
  	}

  	transform_type_select.change(function() {
  		choose_example();
  	})

    add_option(undefined, 'Transform:');
    transform_types.forEach(function(ex) {
      add_option(ex, ex);
    })

    container.append(script_container);
  };

  editor.formula = function(x) {
    if (!arguments.length) return script_text;
    script_text = x;
    editor.update();
    return editor;
  }

  editor.update = function() {
    if(script_text) {
      script_input.attr('value', script_text)
    } else if (current_transform) {
      script_input.attr('value', current_transform.as_javascript())
    }
  };

  editor.select = function(e) {
    if (e) {
      script_text = e.script_text;
      current_transform = e.transform;
    } else {
      script_text = undefined;
      current_transform = undefined;
    }
    editor.update();
  };

  editor.options = function() {
    if (arguments.length == 0) return {};
    opt = arguments[0];
    bins = opt.bins || bins;
    w = opt.width || w;
    h = opt.height || h;
    editor.update();
    return editor;
  };

  editor.type = function() { return 'editor'; };

  editor.initUI();
  editor.update();
  return editor;
};
dp.layout = {};

dp.layout.layout = function(profiler, opt) {
  opt = opt || {};
  var layout = {},
      plots = [],
      chart_locations = [],
      num_graphs = 0, parent_left = opt.parent_left || 0,
      formula_box_margin = 0;

  layout.profiler = function() {
    return profiler;
  }


  layout.createScatter = function(vis, graphName) {
    var id_graph_name, graph_id_num, old_graph;
    id_graph_name = '#' + graphName;
    graph_id_num = parseInt(graphName.substring(5));
    old_graph = layout.remove(graph_id_num);
    vis.type = "scatter";
    coord = layout.get_vis_coordinates(vis, graph_id_num, old_graph.top, old_graph.left);
    coord.left = 0;
    coord.left = coord.left + parent_left;
    if(!coord) {

      $(id_graph_name).remove();

      return;
    }
    else if(coord.redraw) {
      layout.refresh();
      layout.redraw();
    }
    else {
      $(id_graph_name).css('top', (coord.top + formula_box_margin) + 'px');
      $(id_graph_name).css('left', coord.left + 'px');
    }
  };

  layout.add = function(vis, drop_top, drop_left) {
    var id_graph_name, coord, origHeight, newTranslateHeight, newHeightRatio, obj;
    num_graphs++;
    id_graph_name = '#graph' + num_graphs;

    if(drop_top || drop_left || drop_top === 0) {
      coord = layout.get_vis_coordinates(vis, num_graphs, drop_top, drop_left);
      coord.left = coord.left + parent_left;
    }
    else {
      coord = layout.get_vis_coordinates(vis, num_graphs);
      if (coord.height_slot === 3 && coord.left_slot === 2) {
        if (coord.map_vis === 1) {
          coord.left = 212
        }
      }
      coord.left = coord.left + parent_left;
    }
    if(!coord) {
      $(id_graph_name).remove();

      return;
    }
    else if(coord.redraw) {
      layout.refresh();
      layout.redraw();
    }
    else {
      $(id_graph_name).css('top', (coord.top + formula_box_margin) + 'px');
      $(id_graph_name).css('left', coord.left + 'px');
      if(coord.resize) {
        $(id_graph_name).height(coord.height+2);
        obj = document.getElementById(id_graph_name.substring(1));
        obj.childNodes[0].setAttribute('height', coord.height);
        vis.plot.height(coord.height);
      }
    }
  };


  layout.remove = function(chart_id) {
    var to_remove, i;
    for(i = 0; i < chart_locations.length; i++) {
      if(chart_locations[i].chart_id == chart_id) {
        to_remove = chart_locations[i];
        chart_locations.splice(i,1);
        plots.splice(i,1);
        return to_remove;
      }
    }
    layout.update_spaces();
  };


  layout.redraw = function() {
    var coord, id_graph_name, i;
    for(i = 0; i < chart_locations.length; i++) {
      coord = chart_locations[i];
      id_graph_name = '#graph' + coord.chart_id;
      $(id_graph_name).css('top', (coord.top + formula_box_margin) + 'px');
      $(id_graph_name).css('left', coord.left + 'px');
    }
  }

  layout.plots = function() {
    return plots;
  };

  layout.chart_locations = function() {
    return chart_locations;
  };

  layout.num_graphs = function() {
    return num_graphs;
  };

  layout.init_ui = function() {

  };

  return layout;
};
dp.layout.naive = function(container, opt) {
  opt = opt || {};
  var naive = {},
      config = dp.config.vis,
      max_rows = config.max_rows,
      max_cols = config.max_cols,
      cell_height = config.cell_height,
      cell_width = config.cell_width,
      cell_vertical_margin = config.cell_vertical_margin,
      cell_horizontal_margin = config.cell_horizontal_margin,
      formula_box_margin = 0,
      bar_height = config.bar_height,
      cells;

  naive.cellHeight = function() {
    return cell_height;
  }

  naive.cellWidth = function() {
    return cell_width;
  }

  naive.horizontalMargin = function() {
    return cell_horizontal_margin;
  }

  naive.verticalMargin = function() {
    return cell_vertical_margin;
  }

  cells = d3.range(0, max_cols).map(function() {
    return dv.array(max_rows)
  })

  naive.add = function(vis) {
    var chart_type,
        dimensions = get_chart_dimensions(vis),
        vertical_cells = dimensions.vertical_cells,
        horizontal_cells = dimensions.horizontal_cells,
        free_location = find_free_location(vertical_cells, horizontal_cells);

    if (free_location) {
      add_at_location(vis, free_location.left, free_location.top, vertical_cells, horizontal_cells)
    } else {
      vis_container(vis).empty();
    }

  }

  naive.remove = function(vis) {
    var r, c;
    for (c = 0; c < max_cols; c++) {
      for (r = 0; r < max_rows; r++) {
        if (vis === cells[c][r]) {
          cells[c][r] = 0;
        }
      }
    }
  }

  function add_at_location(vis, left, top, vertical_cells, horizontal_cells) {
    var chart_container = vis_container(vis);
    fill_space(top, left, vertical_cells, horizontal_cells, vis);
    chart_container.css('top', pixels_top(top, left) + 'px');
    chart_container.css('left', pixels_left(top, left) + 'px');
    if (vertical_cells > 0) {
      vis.plot.height(vertical_cells_to_pixels(vertical_cells));
    }
  }

  function vertical_cells_to_pixels(num_cells) {
    if (!num_cells) return 0;
    return cells_to_pixels(num_cells, cell_height, cell_vertical_margin);
  }

  function horizontal_cells_to_pixels(num_cells) {
    if (!num_cells) return 0;
    return cells_to_pixels(num_cells, cell_width, cell_horizontal_margin);
  }

  function cells_to_pixels(num_cells, cell_size, margin_size) {
    if (!num_cells) return 0;
    return (cell_size + margin_size) * num_cells - margin_size;
  }

  function pixels_left(row, col) {
    var parent_left = container.position().left - 20, left;
    left = horizontal_cells_to_pixels(col) + parent_left;
    if (col) top += cell_horizontal_margin;
    return left;
  }

  function pixels_top(row, col) {
    var parent_top = container.position().top, top;
    top = vertical_cells_to_pixels(row) + parent_top;
    if (row) top += cell_vertical_margin;
    return top;
  }

  function vis_container(vis) {
    return vis.plot.parent();
  }

  function cell(row, col, chart) {
    if (arguments.length < 3) {
      return cells[col][row];
    } else {
      cells[col][row] = chart;
    }
  }

  function fill_space(row, col, vertical_cells, horizontal_cells, chart) {
    var end_row = row + vertical_cells,
        end_col = col + horizontal_cells;
    for (c = col; c < end_col; c++) {
      for (r = row; r < end_row; r++) {
        cell(r, c, chart);
      }
    }
    return true;
  }

  function has_space(row, col, vertical_cells, horizontal_cells) {
    var end_row = row + vertical_cells,
        end_col = col + horizontal_cells;
    if (end_row > max_rows ||
        end_col > max_cols) {
      return false;
    }
    for (c = col; c < end_col; c++) {
      for (r = row; r < end_row; r++) {
        if (cell(r, c)) {
          return false;
        }
      }
    }
    return true;
  }

  function find_free_location(vertical_cells, horizontal_cells) {
    var r, c;
    for (c = 0; c < max_cols; c++) {
      for (r = 0; r < max_rows; r++) {
        if (has_space(r, c, vertical_cells, horizontal_cells)) {
          return {top:r, left:c};
        }
      }
    }
    return undefined;
  }

  function get_chart_dimensions(vis) {
    var vertical_cells = 1, horizontal_cells = 1;
    switch (vis.type) {
      case 'numeric':
      case 'ordinal':
      break
      case 'nominal':

      var num_bars = vis.plot.rollup()[0].length - 2;
      vertical_cells = Math.min(3, Math.ceil((num_bars * bar_height) / cell_height));
      break
      case 'scatter':
      vertical_cells = 2;
      break
      case 'geo_world':
      horizontal_cells = 2;
      vertical_cells = 3;
      break
    }
    return {
      vertical_cells:vertical_cells,
      horizontal_cells:horizontal_cells
    };

  }

  function init() {
    jQuery('#app_container').droppable({
      drop: function(event, ui) {
        var index = jQuery(ui.helper).data('index');
        if (index != undefined) {
          opt.add(index)
        }
      }
    });

    jQuery('div.data_label').draggable({
      zIndex: 3,
      helper: function(e) {
        var index, temp, type,
            width_dim = cell_width - cell_horizontal_margin,
            height_dim = cell_height - cell_vertical_margin,
            animation_time = 300;
        index = jQuery(e.currentTarget).index();
        temp = jQuery(this).clone().appendTo('body').addClass('dragged').data('index', index);
        jQuery(".data_menu", temp).remove();
        jQuery(".chart_menu", temp).remove();

        type = data[index].type.type();
        if(type == "nominal" || type == "ordinal") {
          height_dim = cell_height * 3 - cell_vertical_margin;
        }
        else if(type == "numeric") {
        }
        else {
          height_dim = cell_height * 5 - cell_vertical_margin;
          width_dim = cell_width * 2 - cell_horizontal_margin;
        }
        $('.dragged').animate({
          width: width_dim + 'px',
          height: height_dim + 'px'
        }, animation_time);
          return temp;
        },
      start: function() {
        jQuery('#app_container').addClass('drag_target');
      },
      stop: function() {
        jQuery('#app_container').removeClass('drag_target');
      }
    });
  }
  init();
  return naive;
};
dp.layout.linear = function(opt) {
  opt = opt || {};
  var layout = [],
      table_layout = opt.table_layout || dp.layout.table.uniform();

  layout.add_vis = function(vis) {
    layout.push(vis)
  }

  layout.refresh = function() {
    var width;
    layout.forEach(function(vis, i){
      width = table_layout.column_width(layout, vis, i, {});
      vis.width(width);
      vis.update();
      vis.container().style('display', 'inline-block')
    })
  }

  return layout;
};
dp.layout.table = function() {

};
dp.layout.table.uniform = function(opt) {
  opt = opt || {};
  var layout = {},
      max_table_width = opt.max_table_width || 800,
      min_column_width = opt.min_column_width || 100;
  layout.column_width = function(data, column, view_index, opt) {
    opt = opt || {}
    var fields = opt.fields || data;
    return Math.max(min_column_width, max_table_width / fields.length);
  }
  return layout;
};
dp.selection = function(group, source, fields) {
  var selection = {},
      marks, targets, fields = fields, source = source, rollup, rollup_indices = [], query_parameters, selection_manager,

      index;

  selection.marks = function(x) {
    if(!arguments.length) return marks;
    marks = x;
    selection.update();
    return selection;
  }

  selection.group = function() {
    return group;
  }

  selection.selection_manager = function(x) {
    if(!arguments.length) return selection_manager;
    selection_manager = x;
    return selection;
  }

  selection.index = function(x) {
    if(!arguments.length) return index;
    index = x;
    selection.update();
    return selection;
  }

  selection.query_parameters = function(x) {
    if(!arguments.length) return query_parameters;
    query_parameters = x;
    return selection;
  }

  selection.rollup = function(x, index) {
    if(!arguments.length) return rollup;
    rollup = x;
    if (index) {
      rollup = rollup.map(function(c) {
        return index.map(function(i) {
          return c[i];
        })
      })
    }
    selection.update();
    return selection;
  }

  selection.rollup_indices = function(x) {
    if(!arguments.length) return rollup_indices;
    rollup_indices = x;
    selection.update();
    return selection;
  }

  selection.fields = function(x) {
    if(!arguments.length) return fields;
    fields = x;
    selection.update();
    return selection;
  }

  selection.targets = function(x) {
    if(!arguments.length) return targets;
    targets = x;
    selection.update();
    return selection;
  }


  selection.update = function() {
    if(!marks || !targets) {
      return;
    }

    targets.on('mouseover', selection.mouseover)
        .on('mousedown', selection.mousedown)
        .on('click', selection.click)
        .on('mouseout', selection.mouseout);
  };

  selection.mouseover = function(d, i) {
    var formula = selection.formula();
    if (formula && formula.length) {
      d3.select('#formulaView').html(formula);
    }
    selection.select_element(d, i, {dragging:true})
  }

  selection.mousedown = function(d, i) {
    source.option('containing_vis').select({});
    if (!d3.event.metaKey) {
      rollup_indices = [];
    }
    d3.event.stopPropagation();
    dp.selection.is_mouse_down = 1;
    selection_manager.current_selection(selection);
    selection_manager.clear();
    selection.select_element(d, i, {mouse_down:true})
  }

  selection.current_rollup_index = function() {
    return rollup_indices[rollup_indices.length-1];
  }

  selection.select_element = function(d, i, opt) {


    opt = opt || {};
    i = index ? index[i] : i;
    var current_rollup = selection.current_rollup_index(), selected_index;
    if (opt.mouse_down || selection.is_mouse_down()) {
      if (current_rollup) {
        selected_index = current_rollup.indexOf(i);
      }
      if (selected_index > -1) {
        selection.remove_from_current_rollup(current_rollup, i, selected_index);
      } else if (opt.dragging) {
        if (current_rollup) {
          selection.add_to_current_rollup(current_rollup, i);
        }
      } else {
        rollup_indices.push([i]);
      }
      selection.update_brushing();
      selection.select();
    }
  }

  selection.remove_from_current_rollup = function(current_rollup, index, selected_index) {
    current_rollup.splice(selected_index+1, current_rollup.length-(selected_index+1));
  }

  selection.add_to_current_rollup = function(current_rollup, index) {
    current_rollup.push(index);
  }

  selection.update_brushing = function() {
    d3.selectAll(marks[0]).classed('brush_over', false)
    d3.merge(rollup_indices).map(function(i) {
      d3.select(marks[0][i]).classed('brush_over', true);
    })
  }

  selection.select = function () {
    group.select({source: source, filter: selection.filter(rollup_indices)}, 25);
    group.formula_editor().formula(selection.formula());
  }

  selection.click = function(d, i) {

  }

  selection.is_mouse_down = function() {
    return dp.selection.is_mouse_down;
  }

  selection.mouseout = function(d, i) {







  }

  selection.clear = function() {
    rollup_indices = [];
    selection.update_brushing();
  }

  selection.filter = function(rollup_indices) {
    if (rollup === undefined || rollup[0] === undefined || rollup_indices[0] === undefined || fields === undefined) {
      return;
    }
    var a = rollup[0][rollup_indices[0][0]], f = fields[0];

    if (rollup_indices.length === 1) {
      return function(t,r) {
          var v = t[f][r];
          return v === a;
      };
    } else {
      a = rollup_indices.map(function(r) {
        return rollup[0][r[0]];
      })
      return function(t,r) {
          var v = t[f][r];
          return a.indexOf(v) != -1;
      };
    }
  }

  selection.formula = function() {
    var f = fields[0];
    return d3.merge(rollup_indices).map(function(r) {
        return group.data[f].name() + ' = "' + group.data[f].lut[rollup[0][r]] + '"';
    }).join(' or ')
  }

  selection.update();
  return selection;
};dp.selection.manager = function(group) {
  var manager = [], current_selection;

  manager.current_selection = function(x) {
    if (!arguments.length) return current_selection;
    current_selection = x;
    return manager;
  }

  manager.add = function(selection) {
    manager.push(selection);
    selection.selection_manager(manager);
  };

  manager.remove = function(selection) {
    var index = manager.indexOf(selection);
    if (index != -1) {
      manager.splice(index);
    }
  };

  manager.clear = function() {
    group.select({source: null}, 25);
    manager.map(function(sel) {
      if (sel != current_selection) {
        sel.clear();
      }
    })
    current_selection = undefined;
  }
  return manager;
};
dp.selection.range = function(container, source, fields) {
  var step, selection = dp.selection(container, source, fields);

  selection.step = function(x) {
    if(!arguments.length) return selection.query_parameters().step;
    selection.query_parameters().step = x;
    return selection;
  }

  selection.num_bins = function(x) {
    if(!arguments.length) return selection.query_parameters().num_bins;
    selection.query_parameters().num_bins = x;
    return selection;
  }

  selection.filter = function(rollup_indices) {
    rollup_indices = d3.merge(rollup_indices);
    fields = selection.fields();

    if (fields.length === 1) {
      var rollup = selection.rollup(),
          step = selection.step()[0],
          left_index = rollup_indices[0],
          right_index = rollup_indices[rollup_indices.length-1],
          temp_index, left_boundary, right_boundary, include_boundary, f;

      if (right_index === undefined) {
        right_index = left_index;
      }

      if (left_index > right_index) {
        temp_index = left_index;
        left_index = right_index;
        right_index = temp_index;
      }
      left_boundary = rollup[0][left_index];
      right_boundary = rollup[0][right_index]+step;
      include_boundary = (right_index === (rollup[0].length-1));
      f = selection.fields()[0];

      return function(t,r) {
          var v = t[f][r];
          if (v === null || v === undefined) return false;
          return v >= left_boundary && v <= right_boundary && (include_boundary || v != right_boundary);
      };
    }

    if (fields.length === 2) {
      var rollup = selection.rollup(),
          step = selection.step(),
          left_index = rollup_indices[0],
          right_index = rollup_indices[rollup_indices.length-1] || left_index,
          left_boundaries = fields.map(function(f, i){return rollup[i][left_index]}),
          right_boundaries = fields.map(function(f, i){return rollup[i][right_index]+step[i]}),
          include_boundaries = fields.map(function(f, i){return (rollup[i][right_index] === rollup[i][rollup[i].length-1])});
      console.log(left_boundaries)
      console.log(right_boundaries)
      return function(t,r) {
          var v;
          for(var i = 0; i < fields.length; ++i) {
            v = t[fields[i]][r];
            if (v === null || v === undefined) return false;
            if(!(v >= left_boundaries[i] && v <= right_boundaries[i] &&
                (include_boundaries[i] || v != right_boundaries[i]))) {
              return false;
            };
          }
          return true;
      };
    }
  };

  function fill_current_rollup(current_rollup, start_index, end_index) {
    var rollup = selection.rollup(),


        reversed = (end_index < start_index),
        start_end = get_min_max(start_index, end_index),
        start = start_end[0], end = start_end[1], x_range, y_range,
        num_bins = selection.num_bins(),
        xbins = num_bins[0], ybins = num_bins[1], x, y;
    current_rollup.length = 0;
    x_range = [get_val(rollup, 0, start), get_val(rollup, 0, end, true)];
    y_range = [get_val(rollup, 1, start), get_val(rollup, 1, end, true)];
    d3.range(rollup[0].length).forEach(function(i) {
      x = rollup[0][i];
      y = rollup[1][i];
      if (x_range[0] <= x && x_range[1] > x
          && y_range[0] <= y && y_range[1] > y) {
        current_rollup.push(i);
      }
    })
    if (reversed) {
      current_rollup.reverse();
    }
    console.log(current_rollup);
  }

  if (fields.length > 1) {
    selection.remove_from_current_rollup = function(current_rollup, index, selected_index) {
      fill_current_rollup(current_rollup, current_rollup[0], index);
    }

    selection.add_to_current_rollup = function(current_rollup, index) {
      fill_current_rollup(current_rollup, current_rollup[0], index);
    }
  }

  function get_start_end(range) {
    var min = range[0],
        max = range[range.length-1];
    return (min > max) ? [max, min] : [min, max];
  }

  function get_min_max(x, y) {
    return (x > y) ? [y, x] : [x, y]
  }

  function get_val(rollup, field, index, is_right_boundary) {
    return rollup[field][index] + (is_right_boundary ? (selection.step()[field]): 0);
  }

  function include_boundary(rollup, field, index) {
    return index === (rollup[field].length-1)
  }

  selection.formula = function() {
    var f = fields[0], start, end, start_end,
        rollup = selection.rollup(), rollup_indices = selection.rollup_indices(),
        group = selection.group(), comp;
    return rollup_indices.map(function(range) {
        start_end = get_start_end(range);
        start = get_val(rollup, 0, start_end[0]);
        end = get_val(rollup, 0, start_end[1], true);
        comp = include_boundary(rollup, 0, start_end[1]) ? ' <= ' : ' < ';
        return group.data[f].name() + ' >= ' + start + ' and ' + group.data[f].name() + comp + end;
    }).join(' or ')
  }

  return selection;
};
dp.selection.month = function(container, source, fields) {
  var step, selection = dp.selection(container, source, fields);

  selection.filter = function(rollup_indices) {
    rollup_indices = d3.merge(rollup_indices)

    if (fields.length === 1) {
      var rollup = selection.rollup(),
          left_index = rollup_indices[0],
          right_index = rollup_indices[1] || left_index,
          left_boundary = rollup[0][left_index],
          right_boundary = rollup[0][right_index]+1,
          include_boundary = (right_index === (rollup[0].length-1)),
          f = selection.fields()[0];

      return function(t,r) {
          var v = t[f][r];
          if(!v) return false;
          v = v.getMonth();
          return v >= left_boundary && (v <= right_boundary && (include_boundary || v != right_boundary));
      };
    }

    if(fields.length > 1) {
      console.error('Month selection not yet supported for more than one field.')
    }


  };

  return selection;
};
dp.selection.quality = function(container, source, fields) {
  var selection = dp.selection(container, source, fields);

  selection.filter = function(rollup_indices) {
    rollup_indices = d3.merge(rollup_indices)
    if (fields.length === 1) {
      var left_index = rollup_indices[0],
          f = selection.fields()[0],
          error = dt.ERROR, missing = dt.MISSING;

      if(left_index === 0) {
        return function(t,r) {
            var v = t[f][r];
            return v !== missing && v !== error;
        };
      } else if (left_index === 1) {
        return function(t,r) {
          var v = t[f][r];
          return v === error;
        };
      } else if (left_index === 2) {
        return function(t,r) {
          var v = t[f][r];
          return v === missing;
        };
      }
    }
  }

  selection.formula = function() {
    var rollup_indices = selection.rollup_indices(),
        field_name = selection.group().data[fields[0]].name();
    return d3.merge(rollup_indices).map(function(r) {
        switch (r) {
          case 0:
            return field_name + " is valid"
          case 1:
            return field_name + " is error"
          case 2:
            return field_name + " is missing"
        }
    }).join(' or ')
  }

  return selection;
};
dp.selection.world_map = function(container, source, fields) {
  var step, selection = dp.selection(container, source, fields);

  selection.filter = function(rollup_indices) {
    var rollup = selection.rollup();
    if (rollup === undefined || rollup[0] === undefined || rollup_indices[0] === undefined || fields === undefined) {
      return;
    }
    var a = rollup[0][rollup_indices[0][0]], f = fields[0];

    if (rollup_indices.length === 1) {
      return function(t,r) {
          var v = t[f][r];
          return v === a;
      };
    } else {
      a = rollup_indices.map(function(r) {
        return rollup[0][r[0]];
      })
      return function(t,r) {
          var v = t[f][r];
          return a.indexOf(v) != -1;
      };
    }
  };

  return selection;
};
dp.stat = {};

dp.stat.entropy = function(table, field, bins) {
  var dims = [dp_stats_dim(table, field, bins)],
    vals = [dv.count('*')],
    data = table.query({dims: dims, vals: vals});

  return dp_stats_entropy(data[1]);
};

dp.stat.perplexity = function(table, field, bins) {
  return Math.pow(2, dp.stat.entropy(table, field, bins));
};

dp.stat.mutual = function(table, field1, field2, bins) {
  var dims = [dp_stats_dim(table, field1, bins),
        dp_stats_dim(table, field2, bins)],
    vals = [dv.count('*')],
    data = table.query({dims: dims, vals: vals, code: false});
  return dp_stats_mutual(data, false);
};

dp.stat.mutual_binned = function(table, x, y) {
  var vals = [dv.count('*')],
      data = table.query({dims:[x, y], vals: vals, code:false});
  return dp_stats_mutual(data, false)
}

dp.stat.normalized_mutual_binned = function(table, x, y) {
  if(!table) {
      table = dv.table();
      table.addColumn("dummy", y.slice(), "nominal", {encoded:true, lut:y[0].lut})
  }
  var vals = [dv.count('*')],
      data = table.query({dims:[x, y], vals: vals, code:false});

   return dp_stats_normalized_mutual(data, true)
}

dp.stat.mutualdist = function(table, field1, field2, bins) {
  var dims = [dp_stats_dim(table, field1, bins),
        dp_stats_dim(table, field2, bins)],
    vals = [dv.count('*')],
    data = table.query({dims: dims, vals: vals, code: false});
  return dp_stats_mutual(data, true);
};

function dp_stats_dim(table, field, bins) {
  if (table[field].type === dp.type.numeric) {
    bins = bins || 20;
    bins = dv_bins(table[field], bins);
    return dv.bin(field, bins[2], bins[0], bins[1]);
  } else {
    return field;
  }
}

function dp_stats_entropy(x) {
  var i, p, s = 0, H = 0;
  for (i = 0; i < x.length; ++i) {
    s += x[i];
  }
  if (s == 0) return 0;
  for (i = 0; i < x.length; ++i) {
    p = x[i] / s;
    if (p > 0) H += p * Math.log(p) / Math.LN2;
  }
  return -H;
};

dp.stat.normalized_entropy = function(x) {
  var i, p, s = 0, H = 0;
  if (x.length <= 1) return 1;
  for (i = 0; i < x.length; ++i) {
    s += x[i];
  }
  if (s == 0) return 0;
  for (i = 0; i < x.length; ++i) {
    p = x[i] / s;
    if (p > 0) H += p * Math.log(p);
  }
  return -H / Math.log(x.length);
};

function dp_stats_mutual(data, dist) {
  var dist = dist || false,
    x = data[0], y = data[1], z = data[2],
    px = dv.array(x.unique),
    py = dv.array(y.unique),
    i, s = 0, t, N = z.length, p, I = 0;
  for (i = 0; i < N; ++i) {
    px[x[i]] += z[i];
    py[y[i]] += z[i];
    s += z[i];
  }
  t = 1 / (s * Math.LN2);
  for (i = 0; i < N; ++i) {
    if (z[i] == 0) continue;
    p = (s * z[i]) / (px[x[i]] * py[y[i]]);
    I += z[i] * t * Math.log(p);
  }
  if (dist) {
    px = dp_stats_entropy(px);
    py = dp_stats_entropy(py);
    return 1.0 - I / (px > py ? px : py);
  } else {
    return I;
  }
};
dp.stat.test_stats_normalized_mutual = function(data, dist) {
  var dist = dist || false,
    x = data[0], y = data[1], z = data[2],
    px = dv.array(x.unique),
    py = dv.array(y.unique),
    i, s = 0, t, N = z.length, p, I = 0;
  for (i = 0; i < N; ++i) {
    px[x[i]] += z[i];
    py[y[i]] += z[i];
    s += z[i];
  }
  t = 1 / (s * Math.LN2);
  for (i = 0; i < N; ++i) {
    if (z[i] == 0) continue;
    p = (s * z[i]) / (px[x[i]] * py[y[i]]);
    I += z[i] * t * Math.log(p);
  }
  if (dist) {
    px = dp_stats_entropy(px);
    py = dp_stats_entropy(py);
    return 1.0 - I / (px > py ? px : py);
  } else {
    return I;
  }
};

function dp_stats_normalized_mutual(data, dist) {
  var dist = dist || false,
    x = data[0], y = data[1], z = data[2],
    px = dv.array(x.unique),
    py = dv.array(y.unique),
    i, s = 0, t, N = z.length, p, I = 0;
  for (i = 0; i < N; ++i) {
    px[x[i]] += z[i];
    py[y[i]] += z[i];
    s += z[i];
  }
  t = 1 / (s * Math.LN2);
  for (i = 0; i < N; ++i) {
    if (z[i] == 0) continue;
    p = (s * z[i]) / (px[x[i]] * py[y[i]]);
    I += z[i] * t * Math.log(p);
  }
  if (dist) {
    px = dp_stats_entropy(px);
    py = dp_stats_entropy(py);
    return 1.0 - (I / (px > py ? px : py));
  } else {
    px = dp_stats_entropy(px);
    py = dp_stats_entropy(py);
    return I / Math.sqrt(px * py);
  }
};
dp.levenshtein = function(s1, s2, cap) {
	cap = cap || (s1.length + s2.length);
  var l1 = s1.length, l2 = s2.length;
	if (l1 - l2 > cap) return undefined;
  if (l1 === 0) {
		if (l2 > cap) return undefined;
		return l2;
	}
	if (l2 === 0) {
   	if (l1 > cap) return undefined;
		return l1;
  }
  var i = 0, j = 0, d = [];


  for (i = 0; i <= l1; i++) {
    d[i] = [];
    d[i][0] = i;
  }
  for (j = 0; j <= l2; j++) {
    d[0][j] = j;
  }

	var terminate, dist, l, u, ul,
	    max = Math.max, min = Math.min;
	for (i = 1; i <= l1; i++) {
		terminate = true;
    for (j = max(1, i - cap); j <= min(l2, i + cap); j++) {

			l = d[i - 1][j];
      u = d[i][j - 1];
      ul = d[i - 1][j - 1];
			if (l === undefined) l = Infinity;
			if (u === undefined) u = Infinity;

			dist = min(
        l + 1, u + 1, ul + (s1[i - 1] === s2[j - 1] ? 0 : 1)
      );
			if (dist <= cap) terminate = false;
			d[i][j] = dist;
    }
		if (terminate) return undefined;
  }
  return d[l1][l2];
};


dp.atomic_string = function(left, right, delimiter) {
  var left_atomic, right_atomic, delimiter = delimiter || dp.atomic_string.delimiter,
      l = 0, r = 0, llength, rlength, lword, rword, lc, rc, matches = 0;
  left_atomic = left.split(delimiter).sort();
  right_atomic = right.split(delimiter).sort();
  llength = left_atomic.length;
  rlength = right_atomic.length;
  for (l, r; l < llength, r < rlength; ) {
    lword = left_atomic[l];
    rword = right_atomic[r];
    if (lword === rword) (matches++, ++l, ++r);
    else if (lword < rword) ++l;
    else ++r;
  }

  return (2 * matches) / (llength + rlength);
};

dp.atomic_string.delimiter = /[^a-zA-Z0-9]+/;


/**
   qgram filter based on algorithm from Gravano et. al,
   Approximate String Joins in a Database (Almost) for Free

 *  id: The id of the word of interest within the dictionary
 *  index: a dp.qgram.index
 *  k: the desired edit distance between candidates and target word.
*/
dp.qgram_filter = function(target_word, target_word_grams, index, k, opt) {
  opt = opt || {};
	var q = index.q, dictionary = index.words, min_matching_grams = target_word.length - 1 - ((k-1)*q),
	    target_word_length = target_word.length, candidates = [], counts = {}, gram, i, j, candidate_id, grams = target_word_grams,
	    gram_position_index = index.gram_position_index, grams_length = grams.length, gram, count, gram_words, gram_positions, abs = Math.abs,
	    candidate_word, less_than_id = opt.less_than_id;

	for (i = 0; i < grams_length; ++i) {
		gram = grams[i];
		if (gram === undefined) continue;
		gram_words = gram_position_index[gram][0];
		gram_positions = gram_position_index[gram][1];
		for (j = 0; j < gram_words.length; ++j) {
      candidate_id = gram_words[j];

			if (candidate_id != less_than_id && (!less_than_id || candidate_id < less_than_id)
			    && (abs(pos = gram_positions[j] - i) <= k )) {
				count = counts[candidate_id]
				if (count === -1) continue;
				candidate_word = dictionary[candidate_id];
				if (count === undefined) {

					if (abs(target_word_length-candidate_word.length) > k) {
						count = counts[candidate_id] = -1;
					}
					else {
						count = counts[candidate_id] = 0;
					}
				}
				if (count===-1) continue;
				count = ++counts[candidate_id]
				if (count >= min_matching_grams && count >= candidate_word.length-1-((k-1)*q)) {
					counts[candidate_id] = -1;
					if(dp.levenshtein(target_word, dictionary[candidate_id], k) <= k)
						candidates.push(candidate_id)

				}
			}
		}
	}

	return candidates;
};

dp.qgram_dictionary_filter = function(word, index, k) {
  return dp.qgram_filter(word, index.create_gram_index_for_word(word), index, k)
};

dp.qgram_self_filter = function(id, index, k) {
  return dp.qgram_filter(index.words[id], index.word_to_gram_index[id], index, k, {less_than_id:id})
};

dp.qgram_self_cluster = function(data, field, q, k) {
  var index, candidates = [], clustered = [], list, counts;
  list = data[field].lut;
  counts = data.query({dims: [field], vals: [dv.count('*')], code:false})
  index = dp.index.qgram(list, q);
  list.map(function(x) {
    x = "" + x;
    if (clustered[x]) return;
    var c = dp.qgram_dictionary_filter(x, index, k);
    if (c.length > 1) {

      var old_cluster;
      c.map(function(i){
        if (!old_cluster) old_cluster = clustered[list[i]]
      })
      if (old_cluster) {
        c.map(function(i) {
          if (old_cluster.cluster.indexOf(list[i])===-1) {
            old_cluster.cluster.push(list[i])
            old_cluster.counts.push(counts[1][i])
            old_cluster.size++;
          }
          clustered[list[i]] = old_cluster;
        })
      } else {
        var new_cluster = {};
        new_cluster.id = x;
        new_cluster.cluster = c.map(function(i){
            clustered[list[i]] = new_cluster;
            return list[i]}
        );
        new_cluster.size = c.length,
        new_cluster.counts =  c.map(function(i){
            return counts[1][i];
          })
          candidates.push(new_cluster)
      }
      if (false) {
        var new_cluster = {
          id: x,
          cluster: c.map(function(i){
            clustered[list[i]] = 1;
            return list[i]}
          ),
          size: c.length,
          counts: c.map(function(i){
            return counts[1][i];
          })
        }
        candidates.push(new_cluster);
      }

    }
  })
  return candidates;
};
dp.outlier = {};
dp.outlier.zscore = function(opt) {

  var mean = opt.mean, std = opt.std, query_vals = [], field = opt.field, query_result, table = opt.table, data = table[field], deviations = opt.deviations || 2;

  if (!mean) {
	  query_vals.push(dv.avg(field, {as: 'mean'}));
	}

  if (!std) {
	  query_vals.push(dv.stdev(field, {as: 'std'}));
	}

  query_result = table.query({dims: [], vals: query_vals});

  /* */
  if (!mean) mean = query_result['mean'][0];
  if (!std) std = query_result['std'][0];

  return [mean - std * deviations, mean + std * deviations];

};
dp.outlier.linear_regression = function(opt) {

	var mean = opt.mean, std = opt.std, query_vals, xfield = opt.xfield, yfield = opt.yfield, query_result, table = opt.table, xdata = table[xfield], ydata = table[yfield], deviations = opt.deviations || 2,
	    residuals = dv.array(xdata.length), slope, intercept, residual_table,
	    i;


	query_vals = [dp.reg_slope(xfield, yfield).as('slope'), dp.reg_intercept(xfield, yfield).as('intercept')];
	query_result = table.query({dims: [], vals: query_vals});

  slope = query_result['slope'][0];
  intercept = query_result['intercept'][0];


	residuals = dv.array(xdata.length);
	for (i = 0; i < xdata.length; ++i) {
		residuals[i] = (ydata[i] - (slope * xdata[i] + intercept));
	}


  residual_table = dv.table([{values: residuals, name: 'residuals', type: dv.numeric}]);


	return dp.outlier.zscore({table: residual_table, field: 'residuals'});

};

dp.dot = function(x, y, o) {
  o = o || {};
  var op = dv.op(x, o);
	op.init = function() {var o = {}; o[expr] = [op.key]; return o;}
	op.done = function(ctx) {return ctx[op.key]; };
	op.key = 'dot_' + x + '*' + y;
	op.value = x;
	op.map = function(table, i) {
	  return table[x][i] * table[y][i];
	}
	return op;

};

dp.reg_slope = function(x, y, o) {
  o = o || {};
  var op = dv.op(x, o), adj = o.sample ? 1 : 0;
  op.init = function() {
    var o = {'*': ['cnt']}; o[x] = ['sum', 'ssq']; o[y] = ['sum']; o['^'] = [dp.dot(x, y)]; return o;
  };
  op.done = function(ctx) {
    var cnt = ctx['cnt'], sumx = ctx['sum_'+ x], sumy = ctx['sum_'+ y], ssq = ctx['ssq_'+ x], dot = ctx[dp.dot(x, y).key];

    return sumx.map(function(v,i) { return (cnt * dot[i] - sumx[i] * sumy[i]) / (cnt * ssq[i] - sumx[i] * sumx[i]); });
  };
  op.value = x + '*'+ y;
  return op;
};

dp.reg_intercept = function(x, y, sample) {
  o = o || {};
  var op = dv.op(x, o), adj = o.sample ? 1 : 0;
  op.init = function() {
    var o = {'*': ['cnt']}; o[x] = ['sum', 'ssq']; o[y] = ['sum']; o['^'] = [dp.dot(x, y)]; return o;
  };
  op.done = function(ctx) {
    var cnt = ctx['cnt'], sumx = ctx['sum_'+ x], sumy = ctx['sum_'+ y], ssq = ctx['ssq_'+ x], dot = ctx[dp.dot(x, y).key];
    var slope = sumx.map(function(v,i) { return (cnt * dot[i] - sumx[i] * sumy[i]) / (cnt * ssq[i] - sumx[i] * sumx[i]); });

    return sumx.map(function(v,i) { return (sumy[i] - slope[i] * sumx[i]) / (cnt); });
  };
  op.value = x + '*'+ y;
  return op;
};
dp.outlier.mahalanobis = function(opt) {

	var mean = opt.mean, std = opt.std, query_vals, xfield = opt.xfield, yfield = opt.yfield, query_result, table = opt.table, xdata = table[xfield], ydata = table[yfield], deviations = opt.deviations || 2,
	    residuals = dv.array(xdata.length), slope, intercept, covariance_table,
	    i;


	result = table.query({dims: [], vals: [dv.avg(xfield).as('xmean'), dv.avg(yfield).as('ymean')]}),
		      xmean = result['xmean'], ymean = result['ymean'],
		      xl = xdata.length, xx = dv.array(xl), xy = dv.array(xl), yy = dv.array(xl), mx, my;

	xx.name = 'xx';
	yy.name = 'yy';
	xy.name = 'xy';


	for (i = 0; i < xl; ++i) {
		mx = xdata[i] - xmean;
		my = ydata[i] - ymean;
		xx[i] = mx * mx;
		yy[i] = my * my;
		xy[i] = mx * my;
	}

	covariance_table = dv.table([{values: xx, name: 'xx', type: dv.numeric},{values: xy, name: 'xy', type: dv.numeric}, {values: yy, name: 'yy', type: dv.numeric}]);
	result = covariance_table.query({dims: [], vals: [dv.count('*'), dv.sum('xx'), dv.sum('xy'), dv.sum('yy')]});

	covariance = result.slice(1).map(function(c) {
		return c.map(function(d, i) {
			return d / (result[0] - 1);
		});
	});


	var inverse = [[], [], []], det, ul = covariance[0][0], ur = covariance[1][0], ll = covariance[1][0], lr = covariance[2][0];

	det = (ul * lr) - (ur * ll);

	iul = lr / det;
	ill = iur = -1 * ur / det;
	ilr = ul / det;


	var distance = [], mx, my;

	for (i = 0; i < xl; ++i) {
		mx = xdata[i] - xmean;
		my = ydata[i] - ymean;
		distance[i] = ((mx * iul + my * ill) * mx + (mx * iur + my * ilr) * my);
	}

	distance_table = dv.table([{values: distance, name: 'distance', type: dv.numeric}]);

	return dp.outlier.zscore({table: distance_table, field: 'distance'});


};
dp.index = {};
dp.index.qgram = function(words, q) {
  var i = 0, w, words_length = words.length, word, wl, word_to_gram_index = Array(words_length),
      gram, gram_position_index = [], dict = {}, unique = 0, v, gram_lut = [];

  for (i; i < words_length; ++i) {
    word = words[i];
    wl = word.length;


    if (wl === undefined || wl < q) {
      word_to_gram_index[i] = [];
      continue;
    }

    word_to_gram_index[i] = Array(wl - q + 1);
    for (j = 0; j < wl - q + 1; ++j) {
      gram = word.substr(j, q);
      if ((v = dict[gram]) === undefined) {
        dict[gram] = v = unique;
        unique++;
        gram_position_index[v] = [[], []];
        gram_lut.push(gram);
      }
      word_to_gram_index[i][j] = v;


      gram_position_index[v][0].push(i);
      gram_position_index[v][1].push(j);
    }
  }







  var create_gram_index_for_word = function(word) {
    var wl = word.length, index, index_length, gram, v;

    if (wl < q) {
      return [];
    }
    index_length = wl - q + 1;
    index = Array(index_length);
    for (j = 0; j < index_length; ++j) {
      gram = word.substr(j, q);
      index[j] = dict[gram];
    }
    return index;
  }

  return {create_gram_index_for_word:create_gram_index_for_word, word_to_gram_index: word_to_gram_index,
      gram_position_index: gram_position_index, gram_lut: gram_lut, q: q, words: words};
};
dp.suggestion = {};
dp.suggestion.related_variable = function(data, opt) {
  var initial_graph = dp.graph.sparse(),
      best_graph,
      binned_data;

  generate_random_graph();
  generate_binned_data();

  function shuffle(array) {
    var tmp, current, top = array.length;
    if(top) while(--top) {
      current = Math.floor(Math.random() * (top + 1));
      tmp = array[current];
      array[current] = array[top];
      array[top] = tmp;
    }
    return array;
  }

  function generate_random_graph() {

   var col, name, idx;
   idx = shuffle(d3.range(data.length));
   console.log(idx)
   idx.forEach(function(index, i) {
     col = data[index];
     name = col.name();
     initial_graph.add_node(name)
   })
   idx.forEach(function(index, i) {
     col = data[index];
     name = col.name();
     if (index < idx.length - 1)
     initial_graph.add_edge(name, data[index+1].name())
   })


   console.log("Initial graph");
   initial_graph.debug()
  }

  function generate_binned_data() {
   var bin;
   binned_data = [];
   data.map(function(col) {
     bin = dp.factory.bin().default_bin(data, col);
     bin.unique = bin.lut.length;
     binned_data.push(bin);
     binned_data[col.name()] = bin;
   })
  }

  best_graph = dp.graph.search.greedy(initial_graph, binned_data, dp.bayes.bde(),
      dp.graph.move.multi_connected_dag(), {max_moves:300, max_attempts:15000}).search()
  best_graph.graph.debug();
  console.log(best_graph.score)
};
dp.suggestion.entropy_all = function(data, opt) {
  var best_graph,
      binned_data, binned_data_table;

  generate_binned_data();

  function generate_binned_data() {
   var bin;
   binned_data = [];
   data.map(function(col) {
     bin = dp.factory.bin().default_bin(data, col);
     bin.unique = bin.lut.length;
     binned_data.push(bin);
     binned_data[col.name()] = bin;
     binned_data.type = dt.type
     bin.binned = true;
   })
  }

  var i = 0, j, table = dv.table(), matrix = [], score, all_scores = [];

  for (i ; i < binned_data.length; ++i) {
    matrix.push([])
  }

  table.addColumn("dummy", binned_data[0].slice(), "nominal", {encoded:true, lut:binned_data[0].lut})
  for (i = 0; i < binned_data.length - 1; ++i) {
    for (j = i + 1; j < binned_data.length; ++j) {
      score = dp.stat.mutual_binned(table, binned_data[i], binned_data[j]);
      matrix[i][j] = score;
      matrix[j][i] = score;
      all_scores.push({i:i,j:j, score:score})
    }
  }

  all_scores.sort(function(a,b) {return a.score < b.score ? 1 : -1})
  all_scores.map(function(s) {
    console.log(data[s.i].name(), data[s.j].name(), s.score)
  })
  return all_scores;
};

dp.add_generated_features = function(data) {
  data.forEach(function(col) {

    if (col.system) return false;
    var type = col.type.type(), field = col.name();
    switch (type) {
      case 'number':
      case 'int':
      case 'numeric':
      var transform = dw.derive.log(dw.derive.variable(field)),
          new_col_name = transform.name + "(" + field + ")", transformed_field = data[new_col_name];
      if (!transformed_field) {
        transformed_field = transform.evaluate(data);
        data.addColumn(new_col_name, transformed_field, transformed_field.type, {system:true, encoded:transformed_field.lut != undefined, lut:transformed_field.lut});
      }
      break;
      case 'datetime':
      case 'ordinal':
      break;
      case 'geolocation':
      case 'geo_world':
      break
      case 'string':
      case 'nominal':






      default:
      break;
    }
  })
}


dp.suggestion.entropy = function(data, bin, opt) {
  var best_graph,
      binned_data, binned_data_table,
      ignored_columns = opt.ignored_columns || [];


  generate_binned_data();



  bin.binned = true;

  function generate_binned_data() {
   var b;
   binned_data = [];
   data.filter(function(col){
     return ignored_columns.indexOf(col.name()) === -1 && (!col.lut || col.lut.length < 100);
   }).map(function(col) {
     var x = dp.suggestion.entropy.bin(data, col, bin);
     b = x.bin;
     b.binner = x.binner;

     b.unique = bin.lut.length;
     binned_data.push(b);
     binned_data[col.name()] = b;
     binned_data.type = dt.type
     b.binned = true;
     b.col = col;
   })
  }

  var i = 0, j, score, all_scores = [], min_score = .2;
  for (i = 0; i < binned_data.length; ++i) {
    score = dp.stat.normalized_mutual_binned(undefined, bin, binned_data[i]);
    if (score > 0) {
      all_scores.push({col:binned_data[i].col.name(), score:score, binner:binned_data[i].binner})
    }
  }
  all_scores.sort(function(a,b) {return a.score > b.score ? 1 : -1})
  return all_scores;
};

dp.suggestion.entropy.bin = function(table, col, targetBins) {
  var candidateBins = dp.factory.bin().all_bins(table, col), c, score, maxScore = Infinity, bestBin;

  targetBins.binned = true;
  if (col.name()=== 'Release Date') {
    var x = 'test'
  }
  candidateBins.map(function(c) {
    var bin = c.bin();
    bin.binned = true;
    bin.unique = bin.lut.length;

    score = dp.stat.normalized_mutual_binned(undefined, targetBins, bin);
    if (col.name()==='Release Date') {
      console.log(targetBins)
      console.log(bin)
      console.log(score)
    }
    if (score < maxScore) {
      bestBin = {binner:c, bin:bin, score:score}
      maxScore = score;
    }
  })
  return bestBin;
};
dp.suggestion.missing = function(data, opt) {
  var counts,
      valid, error, missing,
      missing_entropy, bin;

  counts = data.map(function(col) {
    valid = error = missing = 0;
    col.map(function(v) {
      if (v === dt.MISSING) {
        missing++;
      } else if (v === dt.ERROR) {
        error++;
      } else {
        valid++;
      }
    })
    return {col:col.name(), missing:missing, error:error, valid:valid}
  })

  missing_entropy = counts.map(function(count) {
    bin = function() {
      var b = data[count.col].map(function(v) {
        if (v === dt.MISSING) {
          return 1;
        } else {
          return 0;
        }
      })
      b.lut = ['non-missing', 'missing']
      return b;
    }
    text = function() {
      return count.col;
    }
    return {group:'Missing', col:count.col, bin:bin, text:text, entropy: dp_stats_entropy([count.valid + count.error, count.missing])}
  })

  return missing_entropy.filter(function(v) {
    return v.entropy != 0;
  }).sort(function(a, b) {
    if (a.col === 'Release Location') {
      return 1;
    }
    if (b.col === 'Release Location') {
      return -1
    }
    if (a.entropy > b.entropy) {
      return -1;
    }
    return 1;
  })

};
dp.suggestion.error = function(data, opt) {
  var counts,
      valid, error, missing,
      error_entropy, bin;

  counts = data.map(function(col) {
    valid = error = missing = 0;
    col.map(function(v) {
      if (v === dt.MISSING) {
        missing++;
      } else if (v === dt.ERROR) {
        error++;
      } else {
        valid++;
      }
    })
    return {col:col.name(), missing:missing, error:error, valid:valid}
  })

  error_entropy = counts.map(function(count) {
    bin = function() {
      var b = data[count.col].map(function(v) {
        if (v === dt.ERROR) {
          return 1;
        } else {
          return 0;
        }
      })
      b.lut = ['non-error', 'error']
      return b;
    }
    text = function() {
      return count.col;
    }
    return {group:'Error', col:count.col, bin:bin, text:text, entropy: dp_stats_entropy([count.valid + count.missing, count.error])}
  })

  return error_entropy.filter(function(v) {
    return v.entropy != 0;
  }).sort(function(a, b) {
    if (a.entropy < b.entropy) {
      return -1;
    }
    return 1;
  })

};
dp.suggestion.extreme = function(data, opt) {
  var counts, numeric_columns,
      min, max, small, big, other, zscore,
      extreme_entropy, bin;


  numeric_columns = data.filter(function(col) {
    var type = col.type.name();
    return type === 'number' || type === 'int';
  })

  counts = numeric_columns.map(function(col) {
    other = small = big = 0;
    zscore = dp.outlier.zscore({table:data, field:col.name(), deviations:1.8})
    min = zscore[0];
    max = zscore[1];
    bin = [];
    col.map(function(v) {
      if (v === dt.MISSING || v === dt.ERROR) {
        other++;
      }
      else if (v > max) {
        big++;
      } else if (v < min) {
        small++;
      } else {
        other++;
      }
    })
    bin.lut = ['non-extreme', 'small', 'big'];
    return {col:col.name(), bin:bin, big:big, small:small, other:other, min:min, max:max}
  })

  extreme_entropy = counts.map(function(count) {
    bin = function() {

      var minv = count.min, maxv = count.max;
      var b = data[count.col].map(function(v) {
        if (v === dt.MISSING || v === dt.ERROR) {
          return 0;
        }
        else if (v > maxv) {
          return 2;
        } else if (v < minv) {
          return 1;
        } else {
          return 0
        }
      })
      b.lut = ['non-extreme', 'small', 'big'];
      return b;
    }
    text = function() {
      return count.col;
    }
    return {group:"Extreme", col:count.col, bin:bin, text:text, entropy: dp_stats_entropy([count.other, count.big, count.small])}
  })

  return extreme_entropy.filter(function(v) {
    return v.entropy != 0;
  }).sort(function(a, b) {
    if (a.entropy < b.entropy) {
      return 1;
    }
    return 1;
  })

};
dp.suggestion.primary = function(data, opt) {
  var counts = [{col:'Title'}], extreme_entropy;

  extreme_entropy = counts.map(function(count) {
    bin = function() {
      return undefined;
    }
    text = function() {
      return count.col;
    }
    return {group:'Schema', col:count.col, bin:data[count.col], text:text, vis_type:'grouped_bar'}
  })
  return extreme_entropy;
};
dp.median = function(data) {
  data.sort(function(a, b) {
    if (a < b) return -1;
    if (b < a) return 1;
    return 0;
  })
  var length = data.length;
  if (length % 2) {
    return data[(length - 1) / 2]
  }
  return (data[length / 2] + data[(length / 2) - 1] / 2)
}
dp.residuals = function(data, x) {
  return data.map(function(d) {
    var v = d - x;
    return v < 0 ? -v : v;
  })
}

dp.hampel = function(data) {
  var missing = dt.MISSING, error = dt.ERROR;
  var filtered_data = data.filter(function(c) {
    return c != missing && c != error;
  })

  var median = dp.median(filtered_data);
  var median_residuals = dp.residuals(filtered_data, median);
  var mad = dp.median(median_residuals);


  var std = 2;
  var cutoff = 1.4826 * std * mad;
  return [median - cutoff, median + cutoff];
}



dp.suggestion.hampel = function(data, opt) {
  var counts, numeric_columns,
      min, max, small, big, other, zscore,
      extreme_entropy, bin;


  numeric_columns = data.filter(function(col) {
    var type = col.type.name();
    return type === 'number' || type === 'int';
  })

  counts = numeric_columns.map(function(col) {
    other = small = big = 0;
    zscore = dp.hampel(data[col.name()])
    min = zscore[0];
    max = zscore[1];
    bin = [];
    col.map(function(v) {
      if (v === dt.MISSING || v === dt.ERROR) {
        other++;
      }
      else if (v > max) {
        big++;
      } else if (v < min) {
        small++;
      } else {
        other++;
      }
    })
    bin.lut = ['non-extreme', 'small', 'big'];
    return {col:col.name(), bin:bin, big:big, small:small, other:other, min:min, max:max}
  })

  extreme_entropy = counts.map(function(count) {
    bin = function() {

      var minv = count.min, maxv = count.max;
      var b = data[count.col].map(function(v) {
        if (v === dt.MISSING || v === dt.ERROR) {
          return 1;
        }
        else if (v > maxv) {
          return 2;
        } else if (v < minv) {
          return 1;
        } else {
          return 0
        }
      })
      b.lut = ['non-extreme', 'small', 'big'];
      return b;
    }
    text = function() {
      return count.col;
    }
    routines = ['Hampel', 'z-score']
    return {group:"Extreme", routines:routines, col:count.col, bin:bin, text:text, entropy: dp_stats_entropy([count.other, count.big, count.small])}
  })

  return extreme_entropy.filter(function(v) {
    return v.entropy != 0;
  }).sort(function(a, b) {
    if (a.entropy < b.entropy) {
      return 1;
    }
    return 1;
  })

};
dp.suggestion.duplicate = function(data, opt) {
  var counts, duplicate_columns,
      min, max, small, big, other, zscore,
      extreme_entropy, bin;


  duplicate_columns = data.filter(function(col) {
    var type = col.type.type();
    return type === 'nominal';
  })

  counts = duplicate_columns.map(function(col) {
    return {col:col.name()}
  })

  extreme_entropy = counts.map(function(count) {
    bin = function() {
      return undefined;
    }
    text = function() {
      return count.col;
    }
    return {group:'Inconsistent', routines:['Levenshtein'], data:data, col:count.col, bin:function(){return data[count.col]}, text:text, vis_type:'grouped_bar'}
  })
  return extreme_entropy;
};
dp.view.suggestion = {};

dp.view.suggestion.text = function(container, opt) {
  var view = dw.view.suggestion(container, opt)

  view.update = function() {
    var suggestion = view.suggestion(),
        vis = view.vis();

    if (!suggestion) {
      return;
    }

    vis.append('div').classed('suggestion_title', true).text(suggestion.text())


    function draw_menu(related_container) {

      var rundetector = function() {
        /* TODO: fix bug in paritioning code. */
      }
      related_container.append(dv.jq('div').width(120).text("Run Detector").css('text-decoration', 'underline').click(rundetector));

      var related_type_select = dv.jq('select').attr('id', 'anomaly_type_select');
      related_container.append(related_type_select);
      add_option = function(type, name) {
    		dv.add_select_option(related_type_select, name, type);
    	}
    	related_type_select.change(function() {

    	})
      var names = ['Levenshtein'];
      names.forEach(function(ex) {
        add_option(ex, ex);
      })

      var related_type_select = dv.jq('select').attr('id', 'anomaly_type_select');
      related_container.append(related_type_select);
      add_option = function(type, name) {
    		dv.add_select_option(related_type_select, name, type);
    	}
    	related_type_select.change(function() {

    	})
    	add_option("Radius: 2", "Threshold: 3")
      var groups = ["2", "3", "", ""];
      groups.forEach(function(ex) {
        add_option(ex.name, ex.name);
      })


      related_container.append(dv.jq('div').width(120).text("Partitions:"));

      var related_type_select = dv.jq('select').attr('id', 'partition_select');
      related_container.append(related_type_select);
      add_option = function(type, name) {
    		dv.add_select_option(related_type_select, name, type);
    	}
    	related_type_select.change(function() {

    	})

    	add_option("Column:", "Column:")
      movies_data.forEach(function(ex) {
        add_option(ex.name, ex.name);
      })

      var related_type_select = dv.jq('select').attr('id', 'partition_select');
      related_container.append(related_type_select);
      add_option = function(type, name) {
    		dv.add_select_option(related_type_select, name, type);
    	}
    	related_type_select.change(function() {

    	})
    	add_option("Group:", "Group:")
      var groups = ["Year", "Quarter", "Month", "Day"];
      groups.forEach(function(ex) {
        add_option(ex, ex);
      })
      related_container.append(dv.jq('div').width(120).text("Add Partition").css('text-decoration', 'underline'));

    }

    if (suggestion.routines) {
      vis.append('div').classed('suggestion_routine', true).text("(" + suggestion.routines[0] + ")")


        function togglemenu(d, i) {
          menu_div.classed('displayed_menu', !menu_div.classed('displayed_menu'))
          d3.event.stopImmediatePropogation();
        }
      var menu_div = vis.append('div').classed('suggestion_menu',true);
      draw_menu(jQuery(menu_div[0]))

    }

  }

  return view;
};
})();