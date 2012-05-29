dp.layout.naive = function(profiler, opt) {
  var naive = dp.layout.layout(profiler, opt),
      max_rows = 5,
      max_columns = 5,
      spaces_height = 72,
      spaces_width = 212,
      spaces_height_margin = 12,
      spaces_width_margin = 12,
      formula_box_margin = 0,
      bar_height = 12,
      spaces = [],
      chart_locations = naive.chart_locations(),
      plots = naive.plots();

  naive.init_layout = function() {
    spaces = d3.range(max_columns).map(function(col) {
      return dv.array(max_rows);
    });
  };

  naive.check_overlap = function(loc1, loc2) {
    if (loc1.left < loc2.left + loc2.width && loc1.left + loc1.width > loc2.left
        && loc1.top < loc2.top + loc2.height && loc1.top + loc1.height > loc2.top) {
      return true;
    }
    return false;
  };

  naive.update_spaces = function() {
    var i, j, k, temp;
    spaces = d3.range(max_columns).map(function(col) {
      return dv.array(max_rows);
    });
    for(i = 0; i < chart_locations.length; i++) {
      temp = chart_locations[i];
      for(j = temp.left_slot; j < temp.left_slot + temp.width_slot; j++) {
        for(k = temp.top_slot; k < temp.top_slot + temp.height_slot; k++) {
          spaces[j][k] = true;
        }
      }
    }
  }




  naive.refresh = function() {
    var i, j, k, l, m, n, this_column, to_move, to_stay, temp, vacancy, num_overlaps = 0;
    for(i = 0; i < chart_locations.length; i++) {
      for(j = i+1; j < chart_locations.length; j++) {
        if(i != j && naive.check_overlap(chart_locations[i], chart_locations[j])) {
          num_overlaps++;
          to_move = i;
          to_stay = j;
          if(chart_locations[i].top_slot < chart_locations[j].top_slot) {
            to_move = j;
            to_stay = i;
          }
          chart_locations[to_move].top_slot = chart_locations[to_stay].top_slot + chart_locations[to_stay].height_slot;
          chart_locations[to_move].top = chart_locations[to_move].top_slot * spaces_height;
          if(chart_locations[to_move].top_slot + chart_locations[to_move].height_slot > max_rows) {

            this_column = chart_locations[to_move].left_slot;
            for(l = 0; l < max_columns; l++) {
              for(k = 0; k < max_rows; k++) {
                if(l != this_column) {
                  vacancy = true;
                  for (m = l; m < l + chart_locations[to_move].width_slot; m++) {
                    for (n = k; n < k + chart_locations[to_move].height_slot; n++) {
                      if(spaces[m][n]) {
                        vacancy = false;
                        break;
                      }
                    }
                    if(!vacancy) {
                      break;
                    }
                  }
                  if (vacancy) {
                    chart_locations[to_move].left = l * spaces_width;
                    chart_locations[to_move].top = k * spaces_height;
                    chart_locations[to_move].left_slot = l;
                    chart_locations[to_move].top_slot = k;
                    break;
                  }
                }
              }
              if(vacancy) break;
            }
          }
          i = -1;
          break;
        }
      }
      if(num_overlaps > 50) {

        return false;
      }
    }
    naive.update_spaces();
    return true;
  };

  naive.get_vis_coordinates = function(vis, chart_id, drop_top, drop_left) {
    var top_dim = 0,
        left_dim = 0,
        height_dim, width_dim,
        hslots = 1,
        wslots = 1,
        left_slot = 0,
        top_slot = 0,
        located = false,
        newparams = {},
        i, j, k, l, vacancy, num_bars, max_rows_limited, temp_h, numIncrease;
    newparams.redraw = true;
    newparams.resize = false;
    newparams.chart_id = chart_id;

    if (vis.type == "numeric" || vis.type == "ordinal") {
      hslots = 1;
      wslots = 1;
    }
    else if (vis.type == "nominal") {
      hslots = 3;
      wslots = 1;
    }
    else if (vis.type == "scatter") {
      hslots = 3;
      wslots = 1;
    }
    else if (vis.type = "geo_world") {
      hslots = 3;
      wslots = 2;
      newparams.map_vis = true;
    }
    else {
      return false;
    }

    height_dim = hslots * spaces_height - spaces_height_margin;
    width_dim = wslots * spaces_width - spaces_width_margin;

    plots.push(vis);

    if(drop_top || drop_left || drop_top === 0) {
      top_slot = Math.round(drop_top / spaces_height);
      left_slot = Math.round(drop_left / spaces_width);
      if(top_slot + hslots > max_rows || left_slot + wslots > max_columns) {
        drop_top = undefined;
        drop_left = undefined;
        top_slot = left_slot = 0;
      }
    }
    if(drop_top || drop_left || drop_top === 0) {
      top_slot = Math.round(drop_top / spaces_height);
      left_slot = Math.round(drop_left / spaces_width);
      if(top_slot > max_rows - hslots) top_slot = max_rows - 1;
      if(left_slot > max_columns - wslots) left_slot = max_columns - 1;


      vacancy = true;
      for (i = left_slot; i < left_slot + wslots; i++) {
        for (j = top_slot; j < top_slot + hslots; j++) {
          if(spaces[i][j]) {
            vacancy = false;
            break;
          }
        }
        if(!vacancy) {
          break;
        }
      }

      if(vacancy) {
        newparams.redraw = false;
      }
      else if(wslots > 1) {

        return false;
      }
      top_dim = top_slot * spaces_height;
      left_dim = left_slot * spaces_width;
      newparams.top = top_dim;
      newparams.left = left_dim;
      newparams.height = height_dim;
      newparams.width = width_dim;
      newparams.top_slot = top_slot;
      newparams.left_slot = left_slot;
      newparams.height_slot = hslots;
      newparams.width_slot = wslots;
      chart_locations.push(newparams);
      naive.update_spaces();
      return newparams;
    }

    if (vis.type == "nominal") {
      num_bars = vis.plot.rollup()[0].length;
      height_dim = spaces_height * 2 - spaces_height_margin;
      max_rows_limited = max_rows;
      if (num_bars != undefined) {
        temp_h = 20 + bar_height * num_bars;
        temp_h = temp_h / spaces_height;
        if (max_rows_limited > temp_h) {
          max_rows_limited = Math.ceil(temp_h);
        }
      }
      hslots = 2;
      for (i = 0; i < max_columns; i++) {
        for (j = 0; j < max_rows - 2; j++) {
          if (!spaces[i][j] && !spaces[i][j + 1]) {
            left_dim = i * spaces_width;
            top_dim = j * spaces_height;
            left_slot = i;
            top_slot = j;
            located = true;
            spaces[i][j] = true;
            spaces[i][j + 1] = true;
            numIncrease = 0;
            for (k = j + 2; k < max_rows_limited; k++) {
              if (spaces[i][k]) {
                break;
              }
              spaces[i][k] = true;
              numIncrease++;
            }

            if (numIncrease > 0) {
              newparams.resize = true;
              height_dim = (numIncrease + 2) * spaces_height - spaces_height_margin;
              hslots += numIncrease;
            }
            break;
          }
        }
        if (located) break;
      }
    }
    else {
      for (i = 0; i < max_columns + 1 - wslots; i++) {
        for (j = 0; j < max_rows + 1 - hslots; j++) {

          vacancy = true;
          for (k = i; k < i + wslots; k++) {
            for (l = j; l < j + hslots; l++) {
              if(spaces[k][l]) {
                vacancy = false;
                break;
              }
            }
            if(!vacancy) {
              break;
            }
          }
          if (vacancy) {
            left_dim = i * spaces_width;
            top_dim = j * spaces_height;
            left_slot = i;
            top_slot = j;
            located = true;
            break;
          }
        }
        if (located) break;
      }
    }
    if (!located) {
      return false;
    }
    newparams.top = top_dim;
    newparams.left = left_dim;
    newparams.height = height_dim;
    newparams.width = width_dim;
    newparams.top_slot = top_slot;
    newparams.left_slot = left_slot;
    newparams.height_slot = hslots;
    newparams.width_slot = wslots;
    newparams.redraw = false;
    chart_locations.push(newparams);
    naive.update_spaces();
    return newparams;
  };

  naive.init_ui = function() {
    jQuery('#app_container').droppable({
      drop: function(event, ui) {
        var index = jQuery(ui.helper).data('index');
        if (index != undefined) {
          naive.profiler().add_vis(index, event.pageY - this.offsetTop - formula_box_margin, event.pageX - this.offsetLeft);
        }
      }
    });

    jQuery('div.data_label').draggable({
      zIndex: 3,
      helper: function(e) {
        var index, temp, type,
            width_dim = spaces_width - spaces_width_margin,
            height_dim = spaces_height - spaces_height_margin,
            animation_time = 300;
        index = jQuery(e.currentTarget).index();
        temp = jQuery(this).clone().appendTo('body').addClass('dragged').data('index', index);
        jQuery(".data_menu", temp).remove();
        jQuery(".chart_menu", temp).remove();

        type = data[index].type.type();
        if(type == "nominal" || type == "ordinal") {
          height_dim = spaces_height * 3 - spaces_height_margin;
        }
        else if(type == "numeric") {
        }
        else {
          height_dim = spaces_height * 5 - spaces_height_margin;
          width_dim = spaces_width * 2 - spaces_width_margin;
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
  };

  naive.init_layout();
  return naive;
};
