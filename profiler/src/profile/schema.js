dp.schema = function(id, profiler, opt) {
  opt = opt || {};
  var schema = {}, vis, data = profiler.data;

  schema.initUI = function() {
    d3.select('#'+ id + ' div').remove();
    vis = d3.select('#'+ id)
            .append('div').attr('id', 'schema');
   };

  schema.data = function(x) {
    data = x;
    return schema;
  }

  schema.update = function() {
    var idx, sorted, label, data_menu, menu_div, rename_item, num_data_labels, menu_items, j, menu_out, toggle_menu, col_id, data_div;

    function mouseover(d, i) {

    }

    function mouseout(d, i) {

    }

    function dblclick(d, i) {
      profiler.add_vis(d);
      if (opt.on_add) {
        opt.on_add();
      }
    }

    jQuery(vis[0]).empty();
    idx = d3.range(data.length);
    sorted = idx.filter(function(d) {return data[d].type === 'nominal'}).concat(idx.filter(function(d) {return data[d].type === 'numeric'}));
    label = vis.selectAll('div.data_label')
                   .data(idx)
                   .enter().append('div')
                   .attr('class', 'data_label')
                   .classed('system_col', function(d) {return data[d].system})
                   .attr('id', function(d) {return 'data_label' + d})
                   .on('mouseover', mouseover)
                   .on('mouseout', mouseout)
                   .on('dblclick', dblclick);

    label.append('div')
         .attr('class', function(d) {return 'type_icon ' + data[d].type.type()});

    label.append('div')
         .attr('class', 'data_name')
         .text(function(d) {return data[d].name()});

    label.append('div')
         .attr('class', 'data_menu');

    data_menu = vis.selectAll('div.data_menu');
    data_menu.append('div')
         .attr('class', 'data_menu_text')
         .text('options');
    data_menu.append('div')
         .attr('class', 'data_menu_icon right');




    menu_div = vis.selectAll('div.data_label')
         .append('div')
         .attr('class', 'chart_menu')
         .attr('id', function(i) {
           return 'chart_data_menu' +  i;
         })
         .style('width', 100)
         .style('height', 80)
         .style('left', 160)
         .style('top', function(i) {
           return i * 24 + 25;
         })
         .style('position', 'absolute')
         .style('display', 'none');

    rename_item = {};
    rename_item.name = "Rename";
    rename_item.type = "input";
    rename_item.options = {};

    num_data_labels = $('.data_label').size();

    toggle_menu = function(col_id) {
      data_div = this;
      if(typeOf(col_id) == "number") {
        data_div = $('#data_label' + col_id + ' .data_menu')[0];
      }
      jQuery('.data_menu_icon', data_div).toggleClass('right');
      jQuery('.data_menu_icon', data_div).toggleClass('down');
      jQuery('.chart_menu', data_div.parentElement).toggle();
      menu_out = !menu_out;
    }

    for(j = 0; j < num_data_labels; j++) {
      rename_item.options.onenter = function(newval, editor_id) {
        col_id = parseInt(editor_id.substring(6));
        toggle_menu(col_id);
        schema.change_name(col_id, newval);
      };
      rename_item.options.default_value = data[j].name();
      rename_item.options.editor_id = 'rename' + j;
      menu_items = [rename_item];
      menu_items.map(function(item) {
        dp.menu.menu_widget(jQuery('#chart_data_menu' + j), item.name, item.type, item.options)
      });
    }



    menu_out = false;
    jQuery('div.data_label').mouseenter(function() {
      if(!menu_out) {

      }
    });

    jQuery('div.data_label').mouseleave(function() {
      if(!menu_out) {

      }
    });

    jQuery('div.data_menu').click(toggle_menu);



  }

  schema.change_name = function(column, new_name) {

    alert(column + ": " + new_name);
  };

  schema.initUI();
  schema.update();

  return schema;
};
