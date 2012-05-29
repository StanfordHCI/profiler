dp.layout.naive = function(container, opt) {
  opt = opt || {};
  var naive = {},
      config = dp.config.vis,
      max_rows = config.max_rows,
      max_cols = config.max_cols,
      cell_height = config.cell_height,
      cell_width = config.cell_width,
      cell_vertical_margin = config.cell_vertical_margin,
      cell_horizontal_margin = config.cell_horizontal_margin,
      formula_box_margin = 0,
      bar_height = config.bar_height,
      cells;

  naive.cellHeight = function() {
    return cell_height;
  }

  naive.cellWidth = function() {
    return cell_width;
  }

  naive.horizontalMargin = function() {
    return cell_horizontal_margin;
  }

  naive.verticalMargin = function() {
    return cell_vertical_margin;
  }

  cells = d3.range(0, max_cols).map(function() {
    return dv.array(max_rows)
  })

  naive.add = function(vis) {
    var chart_type,
        dimensions = get_chart_dimensions(vis),
        vertical_cells = dimensions.vertical_cells,
        horizontal_cells = dimensions.horizontal_cells,
        free_location = find_free_location(vertical_cells, horizontal_cells);

    if (free_location) {
      add_at_location(vis, free_location.left, free_location.top, vertical_cells, horizontal_cells)
    } else {
      vis_container(vis).empty();
    }

  }

  naive.remove = function(vis) {
    var r, c;
    for (c = 0; c < max_cols; c++) {
      for (r = 0; r < max_rows; r++) {
        if (vis === cells[c][r]) {
          cells[c][r] = 0;
        }
      }
    }
  }

  function add_at_location(vis, left, top, vertical_cells, horizontal_cells) {
    var chart_container = vis_container(vis);
    fill_space(top, left, vertical_cells, horizontal_cells, vis);
    chart_container.css('top', pixels_top(top, left) + 'px');
    chart_container.css('left', pixels_left(top, left) + 'px');
    if (vertical_cells > 0) {
      vis.plot.height(vertical_cells_to_pixels(vertical_cells));
    }
  }

  function vertical_cells_to_pixels(num_cells) {
    if (!num_cells) return 0;
    return cells_to_pixels(num_cells, cell_height, cell_vertical_margin);
  }

  function horizontal_cells_to_pixels(num_cells) {
    if (!num_cells) return 0;
    return cells_to_pixels(num_cells, cell_width, cell_horizontal_margin);
  }

  function cells_to_pixels(num_cells, cell_size, margin_size) {
    if (!num_cells) return 0;
    return (cell_size + margin_size) * num_cells - margin_size;
  }

  function pixels_left(row, col) {
    var parent_left = container.position().left - 20, left;
    left = horizontal_cells_to_pixels(col) + parent_left;
    if (col) top += cell_horizontal_margin;
    return left;
  }

  function pixels_top(row, col) {
    var parent_top = container.position().top, top;
    top = vertical_cells_to_pixels(row) + parent_top;
    if (row) top += cell_vertical_margin;
    return top;
  }

  function vis_container(vis) {
    return vis.plot.parent();
  }

  function cell(row, col, chart) {
    if (arguments.length < 3) {
      return cells[col][row];
    } else {
      cells[col][row] = chart;
    }
  }

  function fill_space(row, col, vertical_cells, horizontal_cells, chart) {
    var end_row = row + vertical_cells,
        end_col = col + horizontal_cells;
    for (c = col; c < end_col; c++) {
      for (r = row; r < end_row; r++) {
        cell(r, c, chart);
      }
    }
    return true;
  }

  function has_space(row, col, vertical_cells, horizontal_cells) {
    var end_row = row + vertical_cells,
        end_col = col + horizontal_cells;
    if (end_row > max_rows ||
        end_col > max_cols) {
      return false;
    }
    for (c = col; c < end_col; c++) {
      for (r = row; r < end_row; r++) {
        if (cell(r, c)) {
          return false;
        }
      }
    }
    return true;
  }

  function find_free_location(vertical_cells, horizontal_cells) {
    var r, c;
    for (c = 0; c < max_cols; c++) {
      for (r = 0; r < max_rows; r++) {
        if (has_space(r, c, vertical_cells, horizontal_cells)) {
          return {top:r, left:c};
        }
      }
    }
    return undefined;
  }

  function get_chart_dimensions(vis) {
    var vertical_cells = 1, horizontal_cells = 1;
    switch (vis.type) {
      case 'numeric':
      case 'ordinal':
      break
      case 'nominal':

      var num_bars = vis.plot.rollup()[0].length - 2;
      vertical_cells = Math.min(3, Math.ceil((num_bars * bar_height) / cell_height));
      break
      case 'scatter':
      vertical_cells = 2;
      break
      case 'geo_world':
      horizontal_cells = 2;
      vertical_cells = 3;
      break
    }
    return {
      vertical_cells:vertical_cells,
      horizontal_cells:horizontal_cells
    };

  }

  function init() {
    jQuery('#app_container').droppable({
      drop: function(event, ui) {
        var index = jQuery(ui.helper).data('index');
        if (index != undefined) {
          opt.add(index)
        }
      }
    });

    jQuery('div.data_label').draggable({
      zIndex: 3,
      helper: function(e) {
        var index, temp, type,
            width_dim = cell_width - cell_horizontal_margin,
            height_dim = cell_height - cell_vertical_margin,
            animation_time = 300;
        index = jQuery(e.currentTarget).index();
        temp = jQuery(this).clone().appendTo('body').addClass('dragged').data('index', index);
        jQuery(".data_menu", temp).remove();
        jQuery(".chart_menu", temp).remove();

        type = data[index].type.type();
        if(type == "nominal" || type == "ordinal") {
          height_dim = cell_height * 3 - cell_vertical_margin;
        }
        else if(type == "numeric") {
        }
        else {
          height_dim = cell_height * 5 - cell_vertical_margin;
          width_dim = cell_width * 2 - cell_horizontal_margin;
        }
        $('.dragged').animate({
          width: width_dim + 'px',
          height: height_dim + 'px'
        }, animation_time);
          return temp;
        },
      start: function() {
        jQuery('#app_container').addClass('drag_target');
      },
      stop: function() {
        jQuery('#app_container').removeClass('drag_target');
      }
    });
  }
  init();
  return naive;
};
