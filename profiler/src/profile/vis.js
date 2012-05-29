dp.vis = function(parent, group, fields, opt) {
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
