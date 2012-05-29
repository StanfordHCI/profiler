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
