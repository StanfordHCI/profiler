dp.chart = {};

dp.chart.chart = function(container, group, fields, opt) {
  var chart = {}, vis,
      data = opt.data || group.data, rollup,
      chart_width = opt.width || 200,
      chart_height = (opt.height || 194),
      targets, marks, selection,
      query, start_row, end_row, options = opt;

  if(typeOf(container) === 'string') {
    container = d3.select('#'+ container)
      .append('svg:svg')
      .attr('width', chart_width)
      .attr('height', chart_height);
  }

  chart.initBins = function(){};

  chart.initUI = function() {
    jQuery(container[0]).empty();
    container.attr('class', 'chart_area');
    vis = container.append('svg:g')
        .attr('width', chart_width)
        .attr('height', chart_height)
        .attr('class', 'bordered');
  };

  chart.container = function(x) {
    if (!arguments.length) return container;
    container = x;
    return chart;
  }

  chart.vis = function(x) {
    if (!arguments.length) return vis;
    vis = x;
    return chart;
  }

  chart.width = function(x) {
    if (!arguments.length) return chart_width;
    chart_width = x;
    return chart;
  }

  chart.height = function(x) {
    if (!arguments.length) return chart_height;
    chart_height = x;
    return chart;
  }

  chart.update = function() {
    chart.initBins();
    chart.draw();
  }

  chart.option = function(key, value) {
    if (arguments.length === 1) {
      return options[key];
    }
    options[key] = value;
    return chart;
  }

  chart.data = function(x) {
    if (!arguments.length) return data;
    data = x;
    return chart;
  }

  chart.group = function() {
    return group;
  }

  chart.update_rollup = function(x) {
    if (query) {
      rollup = data.query(query);
    } else {
      rollup = data;
    }
    return chart;
  }

  chart.rollup = function(x) {
    if (!arguments.length) return rollup;
    rollup = x;
    return chart;
  }

  chart.query = function(x) {
    if (!arguments.length) return query;
    query = x;
    return chart;
  }

  chart.marks = function(x) {
    if (!arguments.length) return marks;
    marks = x;
    return chart;
  }

  chart.start_row = function(x) {
    if (!arguments.length) return start_row;
    start_row = x;
    return chart;
  }

  chart.end_row = function(x) {
    if (!arguments.length) return end_row;
    end_row = x;
    return chart;
  }

  chart.targets = function(x) {
    if (!arguments.length) return targets;
    targets = x;
    return chart;
  }

  chart.selection = function(x) {
    if (!arguments.length) return selection;

    var selection_manager = chart.group().selection_manager();
    if (selection) {
      selection_manager.remove(selection)
    }
    selection = x;
    selection_manager.add(selection);
    return chart;
  }

  chart.fields = function(x) {
    if(!arguments.length) return fields;
    fields = x;
    return chart;
  }

  return chart;
};
