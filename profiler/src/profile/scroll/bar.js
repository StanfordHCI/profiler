dp.scroll.bar = function(container, fields, opt) {
  var group = this,
      bar = dp.chart.chart(container, group, fields, opt),
      data = group.data, rollup, cleaned_rollup,
      chart_vis = opt.chart_vis,
      min_bar_width = 2,
      bar_space = 2,
      bar_height = 10,
      scroll_height = 1,
      scroll_space = 0,
      targets, marks,
      y_scale, sortidx, vis, brush, selection = dp.selection(group, bar, fields), query, scrollbar_panel, scrollbar, num_bars;

  bar.width(opt.width || 20);
  bar.height(opt.height || 594);

  bar.initUI = function() {
    container.attr('class', 'chart_area');
    vis = container.append('svg:g')
        .attr('width', bar.width())
        .attr('height', bar.height())
        .attr('class', 'bordered');

    vis.attr('transform', 'translate(180,10)')

  };

  bar.initBins = function() {
    bar.query({dims: bar.fields(), vals: [dv.count('*')], code:false});
  };

  bar.draw = function() {
    var roll = bar.update_rollup().rollup(),
        partition_results = dv.partition_results(roll, fields, 1);

    var oroll = roll = partition_results.clean;
    roll = dv.sort_multiple(roll, [fields.length], [dv.result_order.DESC]);
    sortidx = roll.idx;
    var onscreen_bars = Math.min(60, roll[0].length),
        idx = d3.range(roll[0].length),
        scroll_array = [],
        scroll_total = bar.height(),
        num_bars = idx.length;

    for(i = 0; i < scroll_total; i++) {
        scroll_array.push(i);
    }

    scrollbar_panel = vis.append("svg:g")
               .attr("width", bar.width())
               .attr("height", bar.height())
               .attr('class', 'profilerScrollBar');

    x_scale_scrollbar = d3.scale.linear()
          .domain([0, d3.max(roll[1])])
          .range([0, bar.width()]);

    bar.redraw(0, 0);
  };

  bar.contextmouseover = function(d, i, was_clicked) {
    if(!dp.selection.is_mouse_down && !was_clicked) { return; }
    chart_vis.start_row(d);
    chart_vis.end_row(d+60);
    chart_vis.update();

    bar.redraw(d, i);
  };

  bar.redraw = function(d, i) {
    var scroll_array = [], chart_height = bar.height() * 2, scroll_total = chart_height, show_scroll = true;
    var roll = bar.update_rollup().rollup(),
        partition_results = dv.partition_results(roll, fields, 1);

    var oroll = roll = partition_results.clean;
    roll = dv.sort_multiple(roll, [fields.length], [dv.result_order.DESC]);

    if(bar.rollup()[0].length < 24) show_scroll = false;
    for(var k = 0; k < scroll_total; k++) {
        scroll_array.push(k);
    }
    scrollbar_panel.selectAll("rect").remove();

    scrollbar = scrollbar_panel.append('svg:rect')
        .attr('class', 'context')
        .attr('y', function(k) { return 0 })
        .attr('x', 0)
        .attr('height', chart_height)
        .attr('width', bar.width())

        if (show_scroll) {
          var x_scale = d3.scale.linear()
                .domain([0, d3.max(roll[1])])
                .range([0, bar.width()]);
                       var y_scale = d3.scale.linear()
                              .domain([0, 2 *roll[1].length])
                              .range([0, chart_height]);


            scrollbar_panel.selectAll('rect.base')
                .data(bar.rollup()[1])
                .enter().append('svg:rect')
                .attr('class', 'base  ')
                .attr('y', function(d, i) { return y_scale(i); })
                .attr('x', 0)
                .attr('height', 1)
                .attr('width', function(d, i) {return x_scale(((i < 2 && i % 2 === 0) + 1))})
                .attr('opacity', .6)

                scrollbar = scrollbar_panel.selectAll('rect.context_filled')
                    .data(d3.range(i - 5, i + 19))
                    .enter().append('svg:rect')
                    .attr('class', 'context_filled')
                    .attr('y', function(k) { return ((scroll_height + scroll_space) * k) + 5; })
                    .attr('x', 0)
                    .attr('height', scroll_height)
                    .attr('width', bar.width())

        }


      if (show_scroll) {
        scrollbar.on("click", function(d, i) {
          bar.contextmouseover(d, i, true);
        })
        .on("mouseover", function(d, i) {
          bar.contextmouseover(d, i, false);
        })
        .on("mousedown", function(d, i) {
          bar.contextmouseover(d, i, false);
        });

      }
  };

  bar.type = function() { return 'bar'; };
  bar.initUI();
  return bar;
};
