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
