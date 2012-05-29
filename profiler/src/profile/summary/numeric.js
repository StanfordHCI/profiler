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
