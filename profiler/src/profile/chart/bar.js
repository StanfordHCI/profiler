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
