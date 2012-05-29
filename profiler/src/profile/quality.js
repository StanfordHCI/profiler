dp.quality = {
  valid: 'valid',
  bad_role: 'brole',
  bad_parse: 'bparse',
  missing: 'missing'
};

dp.quality.keys = [dp.quality.valid, dp.quality.bad_role, dp.quality.bad_parse, dp.quality.missing];

dp.quality_bar = function(group, vis, summary, field, opt) {
  var qb = {};

  var normalize_summary = function(summary, min, width) {

    var nsummary = [], total, nonzero, remainder, w = 0, bw, keys;
    summary.total = total = (summary.valid + summary.bparse + summary.brole + summary.missing);
    nonzero = d3.keys(summary).filter(function(k) {

       	   return k != 'unique' && k != 'total';
		})
	.filter(function(key) {
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
    function mouseout() {
      d3.select(this).classed('brush_selected', false);
      /*

      group.select({source:qb}, 25);
      */
    };

    function mouseover(d, i) {
      d3.select(this).classed('brush_selected', true);
    };

    var w = opt.width || 400, good, empty, bparse, brole;

    normalized_summary = normalize_summary(summary, 10, w);
    var data = normalized_summary;
    var types = dp.quality.keys;
    var h = opt.height || 10,
        x = d3.scale.linear().domain([0, 1]).range([0, w]),
        y = d3.scale.ordinal().domain(d3.range(data.length)).rangeBands([0, h], .2);

    var barTitle = function(summary, d) {
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

  var bars = vis.selectAll('rect.bar')
                .data(data)
                .enter().append('svg:rect')
                .attr('class', 'bar')
                .attr('x', function(d, i) { return normalized_summary.slice(0, i).reduce(function(s,x) {return s + x.val}, 0); })
                .attr('class', function(d) {return d.type})
                .attr('width', function(d, i) {return d.val})
                .attr('height', h)
                .on('mouseover', mouseover)
                .on('mouseout', mouseout)
                .append('svg:title')
                .text(function(d, i) {return barTitle(summary, d)});

  return bars;
};