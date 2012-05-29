dp.scroll.scatter = function(container, fields, opt) {
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
        .attr('transform', 'translate(180,10)')
        .attr('class', 'bordered');
  };

  bar.initBins = function() {
    bar.query({dims: bar.fields(), vals: [dv.count('*')], code:false});
  };

  bar.draw = function() {
    vis.selectAll("text").remove();
  	vis.selectAll("rect").remove();

    vis.append('svg:rect')
      .attr('width', 10)
      .attr('x', 10)
      .attr('height', bar.height())
      .classed('valid', true)








    return;
  };

  bar.contextmouseover = function(d, i, was_clicked) {
    if(!dp.selection.is_mouse_down && !was_clicked) { return; }
    chart_vis.start_row(d);
    chart_vis.end_row(d+60);
    chart_vis.update();

    bar.redraw(d, i);
  };

  bar.redraw = function(d, i) {
    var scroll_array = [], chart_height = bar.height(), scroll_total = chart_height, show_scroll = true;
    if(bar.rollup()[0].length < 24) show_scroll = false;
    for(var k = 0; k < scroll_total; k++) {
        scroll_array.push(k);
    }
    scrollbar_panel.selectAll("rect").remove();
    scrollbar = scrollbar_panel.selectAll('rect.base')
      .data(scroll_array)
      .enter().append('svg:rect')
      .attr('class', function(k) {
        if(show_scroll && i-5 <= k && k <= i+5) { return 'context_filled'; }
        return 'context';
      })
      .attr('y', function(k) { return (scroll_height + scroll_space) * k; })
      .attr('x', 0)
      .attr('height', scroll_height)
      .attr('width', bar.width())

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
