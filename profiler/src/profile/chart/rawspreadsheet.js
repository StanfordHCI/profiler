dp.chart.spreadsheet = function(container, fields, opt)
{
  opt = opt || {};
  var group = opt.group || this,
      spread = dp.chart.chart(container, group, fields, opt),
      w = opt.width || 400,
      h = (opt.height || 194),
      interaction = opt.interaction,
      table_layout = opt.table_layout || dp.layout.table.uniform(),
	    limit = opt.limit || 15, timeout = opt.timeout || 200,
	    cell_double_click = false;

  spread.width(w);
  spread.height(h);


  spread.initUI = function() {
    jQuery(container[0]).empty();
    container.attr('class', 'chart_area');
    var vis = container.append('table')
        .attr('width', spread.width())
        .attr('height', spread.height())
        .attr('class', 'bordered');
    spread.vis(vis);
  };
  spread.initBins = function() {
    spread.query(undefined)
  };
  spread.fields = function() {
    var data = spread.data();
    if (fields && fields.length > 0) {
      return fields;
    }
    return d3.range(data.length);
  }
  spread.field_names = function() {
    var data = spread.data();
    return spread.fields().map(function(c) {
  		return data[c].name();
  	});
  }
  spread.draw = function() {
    var data = spread.rollup(),
        fields = spread.fields(),
        d, names, roll, vis = spread.vis(), rows, header;

    if (!fields || fields.length === 0) return;


    jQuery(vis[0]).empty();
    roll = fields.map(function(c) {
  		d = data[c];
  		return dv.range(limit).map(function(x) {return d.get_raw(x)});
  	});

    names = spread.field_names();

  	var idx = d3.range(limit),
  	    column_widths, header_width = 20;

  	column_widths = d3.range(roll.length).map(function(d, i) {
  	  return table_layout.column_width(data, data[d], d, {});
  	})

    var total_width = header_width + column_widths.reduce(function(a,b) {return a + b}, 0)

    var pivot_columns = names.map(function(n) {return {"sTitle":n}});

    var pivot_data = dv.range(roll[0].length).map(function(d, i) {
      var r = dv.range(fields.length);
      fields.map(function(f, c) {
        r[c] = roll[c][i];
      })
      return r;
    })

    jQuery(vis[0]).dataTable({"aaData":pivot_data,"aoColumns":pivot_columns, "bDestroy":true});


  };

  function add_interactions(header, rows) {
    var data;
    header.selectAll('th.base')
          .on('click', function(d, i) {
            data = spread.data();
            var e = d3.event;
          interaction({type:dw.engine.col, position:{row:d, col:data[i].name()}, table:data, shift:e.shiftKey, ctrl:e.metaKey})
          })
    rows.selectAll('td.row_header')
        .on('click', function(d, i) {
          var e = d3.event;
          data = spread.data();
          interaction({type:dw.engine.row, position:{row:d, col:-1}, table:data, shift:e.shiftKey, ctrl:e.metaKey})
    })

    rows.selectAll('td:not(.row_header)')
        .on('mouseup', function(d, i) {
          data = spread.data();
          var row_index = d,
              col_index = i,
              selection = getSelection(),
          		val = "" + (data[col_index].get_raw([row_index]));
  						if(selection && val && val.length > selection.startCursor){
								var position = {row:row_index, col:data[col_index].name()}
								var timeout = (selection.startCursor === selection.endCursor) ? timeout : 0;
								setTimeout(function(){
									if(!cell_double_click){

										if(selection.startCursor != selection.endCursor) {
										  interaction({type:dw.engine.highlight, position:position, selection:selection})
										}
									}
								}, timeout)
              }
            })
          .on('mousedown', function(d, i) {
            Highlight.removeHighlight(d3.event.currentTarget)
          })
  }

  function getSelection() {
		var selection = window.getSelection()
		if(!selection) return;
		try{
			var range = selection.getRangeAt(0),
			    startCursor = range.startOffset,
			    endCursor = range.endOffset,
			    split = {startCursor:startCursor, endCursor:endCursor};
			return split;
		}
		catch(e){
			return undefined;
		}
	}

  spread.select = function(e) {
    var fields = spread.fields(), vis = spread.vis();
    if (e.data) {
  		roll = fields.map(function(c) {
  			 var d = e.data[c];
  		return dv.range(limit).map(function(x) {return d.get_raw(x)});
  		});

		  var idx = d3.range(limit);
		  vis.selectAll('tr.base')
			    .selectAll('td.base')
			    .text(function(d, i) {return (roll[i][d] != undefined) ? roll[i][d] : ''});
	  } else {
			roll = fields.map(function(c) {
				 var d = data[c];
         return dv.range(limit).map(function(x) {return d.get(x)});
      });

			var idx = d3.range(limit);
			vis.selectAll('tr.base')
				.selectAll('td.base')
				.text(function(d, i) {
				  return (roll[i][d] != undefined) ? roll[i][d] : '';
				});
	    }
  };

  spread.cells = function(opt) {
    var vis = spread.vis(),
        data = spread.data(),
        rows = opt.rows, cols = opt.cols,
        cell_filter = opt.cell_filter,
        start_row = 0,
        end_row = 20,
        field_names = spread.field_names(), selection;

    selection = vis.select('tbody').selectAll('tr')
    if (rows) {
      selection = selection.filter(function(d, i) { return rows.indexOf(i) > -1 })
      if (opt.header) {
        selection = d3.selectAll(d3.merge(d3.merge([vis.select('thead').selectAll('tr'), selection])))
      }
    }
    if (cols) {
      selection = d3.merge([selection.selectAll('th'), selection.selectAll('td')])


      cols = cols.map(function(c) {

        return field_names.indexOf(c.name()) + 1;
      })

      selection = selection.map(function(row) {
        return row.filter(function(d, i) {return cols.indexOf(i) > -1})
        }
      )
      selection = d3.selectAll(d3.merge(selection))
    }
    return selection;
  }

  spread.type = function() { return 'spreadsheet'; };
  spread.initUI();
  spread.initBins();
  spread.update_rollup();

  spread.visible_rows = function() {

    return [0, 20]
  }

  return spread;
};