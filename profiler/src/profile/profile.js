
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

})(jQuery);