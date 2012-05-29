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
