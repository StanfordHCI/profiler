dp.chart.scatter = function(container, fields, opt)
{
  var group = this,
      scatter = dp.chart.chart(container, group, fields, opt),
      num_bins = 20,
      dims = opt.dims || [],
      num_xbins, num_ybins,
      min_opacity = global_scatter_visible === true ? .2 : 0, opacity_scale,
      space = 2, min, max,
      y_scale;

  scatter.width(opt.width || 200);
  scatter.height(opt.height || 200);
  scatter.selection(dp.selection.range(group, scatter, fields));

  scatter.initBins = function() {
    opt.bins = 20
    var query, query_fields = fields, query_data = scatter.data();

    if (opt.transform) {
      var field = query_fields[0]

      var transform = opt.transform(dw.derive.variable(field)),
          new_col_name = "*" + transform.name + "_" + field, transformed_field = query_data[new_col_name];
      if (!transformed_field) {
        transformed_field = transform.evaluate(query_data);
      }
      transformed_field = query_data.addColumn(new_col_name, transformed_field, transformed_field.type, {system:true, encoded:transformed_field.lut != undefined, lut:transformed_field.lut});
      query_fields = [transformed_field.name(), query_fields[1]]
      scatter.selection().fields(query_fields)
    }
    if(opt.query) {
      query = opt.query(query_data, query_fields, opt);
    } else {
      query = dp.query.bin(query_data, query_fields, opt);
    }
    scatter.query(query);
    if(query.parameters) {
      num_bins = query.parameters.num_bins || num_bins;
      scatter.selection().query_parameters(query.parameters);
      scatter.selection().step(query.parameters.step);
      scatter.selection().num_bins(num_bins);
      num_xbins = num_bins[0];
      num_ybins = num_bins[1];
    }
  };

  function opacity(i, rollup) {
    var v = rollup[2][i];
    return v == 0 ? 0 : opacity_scale(v);
  }

  scatter.draw = function() {
    var roll = (scatter.update_rollup(), scatter.rollup()), vis = scatter.vis(),
        chart_width = scatter.width(),
        chart_height = scatter.height(),
        box_width = Math.floor(chart_width / num_xbins),
        box_height = Math.floor((chart_height) / num_ybins),
        partition_results = dv.partition_results(roll, fields, dims.length + 1),
        xbmax, xbmin, ybmax, ybmin, x_scale, y_scale, marks, targets;

    roll = partition_results.clean;
    xbmax = d3.max(roll[0]);
    xbmin = d3.min(roll[0]);
    ybmin = d3.min(roll[1]);
    ybmax = d3.max(roll[1]);

    x_scale = d3.scale.linear().domain([xbmin, xbmax]).range([0, box_width * (num_xbins - 1)]);
    y_scale = d3.scale.linear().domain([ybmin, ybmax]).range([box_height * (num_ybins - 1), 0]);
    opacity_scale = d3.scale.linear().domain([0, d3.max(roll[2])]).range([min_opacity, 1]);

    vis.selectAll("text").remove();
  	vis.selectAll("rect").remove();

    var non_zero_indices = indices(roll);


    targets = marks = vis.selectAll('rect.base')
        .data(non_zero_indices)
        .enter().append('svg:rect')
        .attr('class', 'base')
        .classed('scatter_base', 'true')
        .attr('x', function(i) { return x_scale(roll[0][i]); })
        .attr('y', function(i) { return y_scale(roll[1][i]) - 1.5; })
        .attr('width', box_width)
        .attr('height', box_height)
        .attr('opacity', function(d){return opacity(d, roll)});

    vis.selectAll('rect.brush')
        .data(non_zero_indices)
        .enter().append('svg:rect')
        .attr('class', 'brush')
        .attr('pointer-events', 'none')
        .attr('width', box_width)
        .attr('height', box_height)
        .attr('x', function(i) { return x_scale(roll[0][i]); })
        .attr('y', function(i) { return y_scale(roll[1][i]) - 1.5; })
        .style('opacity', 0);


    var xmin = roll[0][0], xmax = xbmax + roll[0][1] - roll[0][0], ymax = ybmax + roll[1][1] - roll[1][0];

    roll = roll.map(function(c) {
      return non_zero_indices.map(function(i) {
        return c[i];
      })
    })

    vis.append('svg:text')
        .text(dp.tick.pretify(xmax))

        .attr('y', chart_height-1)
        .attr('x',chart_width-15)





    vis.append('svg:text')
          .text(xmin)
          .attr('x', 1)
          .attr('y', chart_height-1)

            vis.append('svg:text')
              .text(dp.tick.pretify(ymax))

              .attr('y', '10')

              .attr('x', chart_width)
              .attr('dx', -3)


          vis.append('svg:text')
              .text(dp.tick.pretify(ybmin))
              .attr('x', chart_width)
                .attr('dx', -3)
                .attr('y', chart_height - 20)


    scatter.selection().marks(marks).targets(targets).rollup(roll);
  };

  scatter.select = function(e) {
    var vis = scatter.vis();
    if (e.data) {
      var roll = e.data.query(scatter.query());

      partition_results = dv.partition_results(roll, fields, dims.length + 1);
      roll = partition_results.clean;
      vis.selectAll('rect.brush')
         .style('opacity', function(d){return opacity(d, roll)});
    } else {
      vis.selectAll('rect.brush')
         .style('opacity', 0);
    }
  };

  function bar_y(d, i, roll) {
    var val = roll[1][i], chart_height = scatter.height();
    if(val === 0) return chart_height;
    val = y_scale(val);
    return Math.min(val, chart_height-min_bar_height);
  }

  function bar_height(d, i, roll) {
    var val = roll[1][i], chart_height = scatter.height();;
    if(val === 0) return 0;
    val = y_scale(val);
    return Math.max(chart_height - val, min_bar_height);
  }

  scatter.type = function() { return 'scatter'; };

  function indices(t) {
    var idx = [], len = t[2].length;
    for (var i = 0; i < len; ++i) {
      if (t[2][i] > 0) idx.push(i);
    }
    return idx;
  }

  scatter.initUI();
  scatter.initBins();
  scatter.update_rollup();
  return scatter;
};
