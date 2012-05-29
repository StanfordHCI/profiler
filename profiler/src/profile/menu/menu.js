dp.menu = {};

dp.menu.menu = function(container, fields, menu_items, opt) {
  opt = opt || {};
  var group = this,
      menu = dp.chart.chart(container, group, fields, opt),
      menu_width = opt.width || 20,
      menu_height = opt.height || 10,
      quality_width = opt.quality_width || 180,
      chart_width = opt.chart_width || 200,
      graph_id = opt.graph_id,
      vis, menu_image, menu_div, menu_panel;

  menu.initUI = function() {
    container.attr('class', 'chart_area');
    vis = container.append('svg:g')
        .attr('width', menu_width)
        .attr('height', menu_height)
        .attr('transform', 'translate(' + quality_width + ',0)')
        .attr('class', 'bordered');
  };

  menu.draw = function() {
    $('#' + graph_id + ' .menu_toggler').remove();
    menu_panel = vis.append("svg:g")
               .attr("width", menu_width)
               .attr("height", menu_height)
               .attr('fill', '#EFEFEF')
               .attr('class', 'menu');

    menu_image = menu_panel.append('svg:image')
                           .attr('width', menu_width)
                           .attr('height', menu_height)
                           .attr('fill', '#EFEFEF')
                           .attr('class', 'menu_toggler')
                           .attr('xlink:href', '../../profiler/style/images/downArrow.png')
                           .on('mousedown', menu.show);

    menu_div = d3.select('#'+ graph_id)
          .append('div')
          .attr('class', 'chart_menu')
          .attr('id', 'chart_menu')
          .style('width', chart_width)
          .style('height', chart_width)
          .style('left', chart_width)
          .style('top', 0)
          .style('position', 'absolute')
          .style('visibility', 'hidden');

    menu_items.map(function(item) {
        dp.menu.menu_widget(jQuery(menu_div[0]), item.name, item.type, item.options)
    });
  };

  menu.show = function() {
    menu_div.style('visibility', 'visible');
    menu_image.attr('xlink:href', '../../profiler/style/images/rightArrow.png');
    menu_image.on('mousedown', menu.hide);
  };

  menu.chart = function() {
    return opt.chart_vis;
  }

  menu.hide = function() {
    menu_div.style('visibility', 'hidden');
    menu_image.attr('xlink:href', '../../profiler/style/images/downArrow.png');
    menu_image.on('mousedown', menu.show);
  };

  return menu;
};
