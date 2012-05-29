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
dp.chart.date_histogram = function(container, fields, opt)
{
  var group = this,
      line = dp.chart.chart(container, group, fields, opt),
      field = fields[0],
      dims = opt.dims || [],
      label_height = (opt.label_height || 12),
      space = 2, x_scale, y_scale, tick_scale, brush, brush_area;

  line.width(opt.width || 200);
  line.height((opt.height || 194) - label_height);
  line.selection((opt.selection || dp.selection.range)(group, line, fields));

  line.initBins = function() {
    var query, data = line.data();
    if(opt.query) {
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
    var roll = line.rollup(),
        chart_width = line.width(),
        chart_height = line.height(), targets,
        marks, bar_space = Math.floor(chart_width / roll[0].length),
        idx, vis = line.vis(), partition_results;

    vis.selectAll('rect').remove();

    partition_results = dv.partition_results(roll, fields, dims.length + 1);
    roll = partition_results.clean;

    idx = d3.range(roll[0].length);

    tick_scale = d3.scale.linear()
        .domain([d3.min(roll[0]), d3.max(roll[0])+(roll[0][1]-roll[0][0])])
        .range([0, chart_width])

    x_scale = d3.scale.linear()
        .domain([d3.min(roll[0]), d3.max(roll[0])])
        .range([0, chart_width - bar_space])

    y_scale = d3.scale.linear()
        .domain([0, d3.max(roll[1])])
        .range([0, chart_height]);

    marks = vis.selectAll("rect.base")
       .data(idx)
       .enter().append("svg:rect")
       .attr('class', 'base')
       .attr("x", function(d) {return x_scale(roll[0][d]);})
       .attr("y", function(d) {return chart_height - y_scale(roll[1][d]);})
       .attr('width', function(d) {return bar_space - 1})
       .attr('height', function(d) {return y_scale(roll[1][d]);})


   targets = vis.selectAll('rect.pointer')
      .data(idx)
      .enter().append('svg:rect')
      .attr('class', 'pointer')
      .attr('x', function(d) {return x_scale(roll[0][d]);})
      .attr('y', 0)
      .attr('width', bar_space - 1)
      .attr('height', chart_height)
      .attr('opacity', 0);

   brush = vis.selectAll("rect.brush")
      .data(idx)
      .enter().append("svg:rect")
      .attr('class', 'brush')
      .attr("x", function(d) {return x_scale(roll[0][d]);})
      .attr("y", function(d) {return 0})
      .attr('width', function(d) {return bar_space - 1})
      .attr('height', function(d) {0})




    line.selection().marks(marks).targets(targets).rollup(roll);

    line.labels();
  };

  line.labels = function() {
    var vis = line.vis(),
        x_ticks = tick_scale.ticks(10),
        y_ticks = y_scale.ticks(10), roll = line.rollup();

    vis.selectAll('text').remove();




    var min_x = d3.min(roll[0]);
    var max_x = d3.max(roll[0]);

    var min_date = opt.tick_format(new Date(min_x), min_x);
    var max_date = opt.tick_format(new Date(max_x), max_x % 12);
    var max_len_x = (max_date + '').length;
    vis.selectAll('text.label')
        .data([0])
        .enter()
        .append('svg:text')
        .attr('x',1)
        .attr('y',192)
        .text(min_date + '');

    vis.selectAll('text.label')
        .data([0])
        .enter()
        .append('svg:text')
        .attr('x',178 - max_len_x*6)
        .attr('y',192)
        .text(max_date + '');


    var min_y = y_ticks[0];
    var max_y = y_ticks[y_ticks.length - 1];
    var min_len_y = (min_y + '').length;
    var max_len_y = (max_y + '').length;
    vis.selectAll('text.label')
        .data([0])
        .enter()
        .append('svg:text')
        .attr('x',198 - min_len_y*6)
        .attr('y',180)
        .text(min_y + '');

    vis.selectAll('text.label')
        .data([0])
        .enter()
        .append('svg:text')
        .attr('x',198 - max_len_y*6)
        .attr('y',10)
        .text(max_y + '');
  }

  line.select = function(e) {
    var vis = line.vis(), chart_height = line.height();
    if (e.data) {
      var roll = dv_profile_cache(e, line.query()),
          partition_results = dv.partition_results(roll, fields, dims.length + 1);
      roll = partition_results.clean;
      brush.attr('y', function(d, i) {return chart_height - y_scale(roll[1][d]);})
      .attr('height', function(d, i) {return y_scale(roll[1][d]);})
    } else {
      brush.attr('y', function(d, i) {return 0})
      .attr('height', function(d, i) {return 0})

    }
  };

  line.type = function() { return 'line'; };

  line.initUI();
  line.initBins();
  line.update_rollup();
  return line;
};
