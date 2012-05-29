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
