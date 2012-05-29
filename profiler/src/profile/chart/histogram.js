/***
  Options include:
  bins: the number of bins
  dims: dimensions used to partition (deprecated)
  query: query used to generate data
  chart_height: height of chart
  chart_width: height of chart
  label_height: height of labels
  tick_text_anchor: how to anchor text
  tick_format: how to format tick labels
**/
dp.chart.histogram = function(container, fields, opt)
{
  var group = this,
      config = dp.config.vis,
      hist = dp.chart.chart(container, group, fields, opt),
      field = fields[0],
      num_bins = opt.bins || 20,
      label_height = (opt.label_height || config.xaxis_gutter_height || 12),
      min_bar_height = 5, dims = [],
      space = 2, targets, marks,
      min, max, x_scale, y_scale, tick_scale, vis;

  hist.selection((opt.selection || dp.selection.range)(group, hist, fields));
  hist.width(opt.width || 200);
  hist.height((opt.height || 194));

  hist.initBins = function() {
    var query, query_fields = fields, query_data = hist.data();



    if (opt.transform) {

      var transform = opt.transform(dw.derive.variable(field)),
          new_col_name = "*" + transform.name + "_" + field, transformed_field = query_data[new_col_name];
      if (!transformed_field) {
        transformed_field = transform.evaluate(query_data);
      }
      transformed_field = query_data.addColumn(new_col_name, transformed_field, transformed_field.type, {system:true, encoded:transformed_field.lut != undefined, lut:transformed_field.lut});
      query_fields = [transformed_field.name()];
      hist.selection().fields([transformed_field.name()])
    }

    if(hist.query()) {
      query = hist.query()
    } else if(opt.query) {
      query = opt.query(query_data, query_fields, opt);
    } else {
      query = dp.query.bin(query_data, query_fields, {min:opt.min,max:opt.max,bins:opt.bins,step:opt.step});
    }
    hist.query(query);
    if(query.parameters) {
      num_bins = query.parameters.num_bins[0] || num_bins;
      hist.selection().query_parameters(query.parameters)
    }
  };

  hist.chart_height = function() {
    return hist.height() - label_height;
  }

  hist.draw = function() {

    var roll = (hist.update_rollup(), hist.rollup()),
        chart_width = hist.width(),
        chart_height = hist.chart_height(),
        bar_space = Math.floor(chart_width / num_bins),
        vis = hist.vis(), idx, marks, targets, partition_results;

    vis.selectAll("text").remove();
  	vis.selectAll("rect").remove();

    partition_results = dv.partition_results(roll, fields, dims.length + 1);
    roll = partition_results.clean;

    idx = d3.range(roll[0].length),

    tick_scale = d3.scale.linear()
        .domain([d3.min(roll[0]), d3.max(roll[0])+(roll[0][1]-roll[0][0])])
        .range([0, chart_width])

    x_scale = d3.scale.linear()
        .domain([0, idx.length])
        .range([0, chart_width])

    y_scale_ticks = d3.scale.linear()
            .domain([0, d3.max(roll[1])])
            .range([chart_height, min_bar_height]);

    y_scale = d3.scale.linear()
        .domain([1, d3.max(roll[1])])
        .range([chart_height-min_bar_height, 0]);


    marks = vis.selectAll('rect.base')
      .data(idx)
      .enter().append('svg:rect')
      .attr('class', 'base');

    vis.selectAll('rect.base')
      .attr('x', x_scale)
      .attr('y', function(d, i) { return bar_y(d, i, roll)})
      .attr('width', bar_space - 1)
      .attr('height', function(d, i) { return bar_height(d, i, roll)});

    targets = vis.selectAll('rect.pointer')
       .data(idx)
       .enter().append('svg:rect')
       .attr('class', 'pointer');

    vis.selectAll('rect.pointer')
       .attr('x', x_scale)
       .attr('y', 0)
       .attr('width', bar_space - 1)
       .attr('height', chart_height)
       .attr('opacity', 0);

    vis.selectAll('rect.brush')
       .data(idx)
       .enter().append('svg:rect')
       .attr('class', 'brush');

    vis.selectAll('rect.brush')
       .attr('x', x_scale)
       .attr('y', chart_height)
       .attr('width', bar_space - 1)
       .attr('height', 0);

    hist.labels();

    hist.selection().marks(marks).targets(targets).rollup(roll);
  };

  var BILLION = 1000000000, MILLION = 1000000, THOUSAND = 1000;

  hist.labels = function() {
    var x_ticks = tick_scale.ticks(10),
        y_ticks = y_scale_ticks.ticks(10), vis = hist.vis();


    var min_x = x_ticks[0];
    var max_x = x_ticks[x_ticks.length - 1];

    function pretify(val) {
      if (val >= BILLION) {
        val = Math.ceil(val / BILLION) + 'B';
      } else if (val >= MILLION) {
        val = Math.ceil(val / MILLION) + 'M';
      } else if (val >= THOUSAND) {
        val = Math.ceil(val / THOUSAND) + 'K';
      }
      return val;
    }
    min_x = dp.tick.pretify(min_x);
    max_x = dp.tick.pretify(max_x);
    var max_len_x = (max_x + '').length;
    var chart_width = hist.width(),
        chart_height = hist.chart_height();

    vis.selectAll('text.label')
        .data([0])
        .enter()
        .append('svg:text')
        .attr('x',1)
        .attr('y',chart_height +  config.xaxis_vertical_padding)
        .text(min_x + '');

    vis.selectAll('text.label')
        .data([0])
        .enter()
        .append('svg:text')
        .attr('x',chart_width - max_len_x * config.axis_character_offset)
        .attr('y',chart_height +  config.xaxis_vertical_padding)
        .text(max_x + '');


    var min_y = y_ticks[0];
    var max_y = y_ticks[y_ticks.length - 1];
    min_y = pretify(min_y)
    max_y = pretify(max_y)
    var min_len_y = (min_y + '').length;
    var max_len_y = (max_y + '').length;
    vis.selectAll('text.label')
        .data([0])
        .enter()
        .append('svg:text')
        .attr('x',chart_width + config.yaxis_gutter_width - config.yaxis_horizontal_padding - min_len_y * config.axis_character_offset)
        .attr('y',chart_height)
        .text(min_y + '');

    vis.selectAll('text.label')
        .data([0])
        .enter()
        .append('svg:text')
        .attr('x',chart_width + config.yaxis_gutter_width - config.yaxis_horizontal_padding - max_len_y * config.axis_character_offset)
        .attr('y',label_height)
        .text(max_y + '');
  }

  hist.select = function(e) {
    var vis = hist.vis(), chart_height = hist.height();
    if (e.data) {
      var roll = dv_profile_cache(e, hist.query()),
          partition_results = dv.partition_results(roll, fields, dims.length + 1);
      roll = partition_results.clean;
      vis.selectAll('rect.brush')
        .attr('y', function(d, i) { return bar_y(d, i, roll)})
        .attr('height', function(d, i) { return bar_height(d, i, roll)})
    } else {
      vis.selectAll('rect.brush')
         .attr('y', chart_height)
         .attr('height', 0);
    }
  };

  /** Computes bar y from data, index, and rollup
  */
  function bar_y(d, i, roll) {
    var val = roll[1][i], chart_height = hist.chart_height();
    if(val === 0) return chart_height;
    val = y_scale(val);
    return val;
    return Math.min(val, chart_height-min_bar_height);
  }

  /** Computes bar height from data, index, and rollup
  */
  function bar_height(d, i, roll) {
    var val = roll[1][i], chart_height = hist.chart_height();
    if(val === 0) return 0;
    val = y_scale(val);
    return chart_height-val;
    return Math.max(chart_height - val, min_bar_height);
  }

  hist.type = function() { return 'histogram'; };

  hist.initUI();
  hist.initBins();
  hist.update_rollup();
  return hist;
};
