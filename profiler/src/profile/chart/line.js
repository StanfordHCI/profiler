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
dp.chart.line = function(container, fields, opt)
{
  var group = this,
      config = dp.config.vis,
      line = dp.chart.chart(container, group, fields, opt),
      field = fields[0],
      dims = opt.dims || [],
      label_height = (opt.label_height || config.xaxis_gutter_height),
      space = 2, x_scale, y_scale, tick_scale, brush, brush_area;

  line.width(opt.width || 200);
  line.height((opt.height || 194));
  line.selection((opt.selection || dp.selection.range)(group, line, fields));

  line.chart_height = function() {
    return line.height() - label_height;
  }

  line.initBins = function() {
    var query, data = line.data();
    if(line.query()) {
      query = line.query()
    } else if(opt.query) {
      query = opt.query(data, fields, opt);
    } else {
      query = dp.query.month(data, fields, opt);
    }
    line.query(query);
    if(query.parameters) {
      line.selection().query_parameters(query.parameters)
    }
  };

  line.draw = function() {
    var roll = (line.update_rollup(), line.rollup()),
        chart_width = line.width(),
        chart_height = line.chart_height(),
        marks,
        idx, vis = line.vis(), partition_results;

    vis.selectAll('path').remove();

    partition_results = dv.partition_results(roll, fields, dims.length + 1);
    roll = partition_results.clean;

    idx = d3.range(roll[0].length);

    tick_scale = d3.scale.linear()
        .domain([d3.min(roll[0]), d3.max(roll[0])+(roll[0][1]-roll[0][0])])
        .range([0, chart_width])

    x_scale = d3.scale.linear()
        .domain([d3.min(roll[0]), d3.max(roll[0])])
        .range([0, chart_width])

    y_scale = d3.scale.linear()
        .domain([0, d3.max(roll[1])])
        .range([chart_height-1, 0]);

    marks = vis.attr("class", "base")
       .selectAll("path.base")
       .data([idx])
       .enter().append("svg:path")
       .attr('class', 'base')
       .attr("d", d3.svg.area()
        .x(function(d) { return x_scale(roll[0][d]); })
        .y0(function(d) { return chart_height; })
        .y1(function(d) { return area_y(roll[1][d]); }))


    brush_area = d3.svg.area()
      .x(function(d) { return x_scale(roll[0][d]); })
      .y0(function(d) { return chart_height; })
      .y1(function(d) { return chart_height; })

     brush = vis.selectAll("path.brush")
         .data([idx])
         .enter().append("svg:path")
         .attr('class', 'brush')
         .attr("d", brush_area);

    line.selection().marks(marks);

    line.labels();
  };

  line.labels = function() {
    var vis = line.vis(),
        x_ticks = tick_scale.ticks(10),
        y_ticks = y_scale.ticks(10), roll = line.rollup(),
        chart_height = line.chart_height(), chart_width = line.width();

    vis.selectAll('text').remove();




    var min_x = d3.min(roll[0]);
    var max_x = d3.max(roll[0]);

    var type = line.query().type;
    var tick_format = type ? dp.tick[type] : opt.tick_format;

    var min_date = tick_format(new Date(min_x), min_x);
    var max_date = tick_format(new Date(max_x), max_x % 12);
    var max_len_x = (max_date + '').length;
    vis.selectAll('text.label')
        .data([0])
        .enter()
        .append('svg:text')
        .attr('x',1)
        .attr('y',chart_height + config.xaxis_vertical_padding)
        .text(min_date + '');

    vis.selectAll('text.label')
        .data([0])
        .enter()
        .append('svg:text')
        .attr('x',chart_width - max_len_x * config.axis_character_offset)
        .attr('y',chart_height + config.xaxis_vertical_padding)
        .text(max_date + '');


    var min_y = y_ticks[0];
    var max_y = y_ticks[y_ticks.length - 1];
    var min_len_y = (min_y + '').length;
    var max_len_y = (max_y + '').length;
    var textx = chart_width + 10 - min_len_y*6;
    vis.selectAll('text.label')
        .data([0])
        .enter()
        .append('svg:text')
        .attr('x', chart_width + config.yaxis_gutter_width - config.yaxis_horizontal_padding - min_len_y * config.axis_character_offset)
        .attr('y',chart_height)
        .text(min_y + '');

    vis.selectAll('text.label')
        .data([0])
        .enter()
        .append('svg:text')
        .attr('x', chart_width + config.yaxis_gutter_width - config.yaxis_horizontal_padding - max_len_y * config.axis_character_offset)
        .attr('y', label_height)
        .text(max_y + '');
  }

  function area_y(val) {
    if(val === 0) return line.chart_height();
    val = y_scale(val);
    return val;
  }

  /** Computes bar height from data, index, and rollup
  */
  function area_height(d, i, roll) {
    var val = roll[1][i], chart_height = hist.height();
    if(val === 0) return 0;
    val = y_scale(val);
    return chart_height-val;
    return Math.max(chart_height - val, min_bar_height);
  }


  line.select = function(e) {
    var vis = line.vis(), chart_height = line.chart_height();
    if (e.data) {
      var roll = dv_profile_cache(e, line.query()),
          partition_results = dv.partition_results(roll, fields, dims.length + 1);
      roll = partition_results.clean;
      brush.attr("d", brush_area
         .y1(function(d) { return area_y(roll[1][d]); }))
         .classed('selected', true)
    } else {
      brush.attr("d", brush_area.y1(chart_height))
               .classed('selected', false)
    }
  };

  line.type = function() { return 'line'; };

  line.initUI();
  line.initBins();
  line.update_rollup();
  return line;
};
