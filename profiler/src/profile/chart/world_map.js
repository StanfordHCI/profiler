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
