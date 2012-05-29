/*
* spreadsheet: the spreadsheet to draw the preview on
*
* transform: the transform to preview
* after_table_container: the container display an after table in
* table_selection: object that controls spreadsheets table selections
*/
/*
 *
 *
 */
dw.view.preview = function(spreadsheet, transform, after_spreadsheet, table_selection){
	var chart = spreadsheet.chart(),
	    data = chart.data(),
	    after_chart = after_spreadsheet.chart(),
	    visible_rows = chart.visible_rows(),
	    start_row = Math.max(0, visible_rows[0]), end_row = Math.max(0, visible_rows[1]),
	    sample = data.slice(),
	    wrangler = dw.wrangle(),
	    tableNames = data.schema(),
	    inputColumn,
	    original, updated, colIndex,
	    old_drop, spreadsheet_container = jQuery(chart.container()[0]),
	    after_spreadsheet_container = jQuery(after_chart.container()[0]);

  function cells(x) {

    var cell_chart = x.chart || chart;
    if ((x.rows && x.rows.length) || (x.cols && x.cols.length)) {
      if (x.rows && x.rows.indexOf(-1) > -1) x.header = true;
      return cell_chart.cells(x)
    }
    return d3.select();
  }

  reset_tables();


  function reset_tables() {
    jQuery("#playground_after_table_container").addClass('hidden')
    spreadsheet_container.removeClass('previewBeforeTable').removeClass('updatedTable')
  	after_spreadsheet_container.removeClass('previewAfterTable')
  }

	if(transform){
    old_drop = transform.drop();
		transform.drop(false);
		if(transform.name===dw.transform.CUT) transform.update(false)
		var tstats = transform.apply([sample], {max_rows:1000, start_row:start_row, end_row:end_row}),
			newCols = tstats.newCols || [],
			updatedCols = tstats.updatedCols || [],
			droppedCols = tstats.droppedCols || [],
			toValueCols = tstats.toValueCols || [],
			toHeaderCols = tstats.toHeaderCols || [],
			toKeyRows = tstats.toKeyRows || [],
			keyRows = tstats.keyRows || [],
			valueCols = tstats.valueCols || [],
			keyCols = tstats.keyCols || [],
			newTables = tstats.newTables || [],
			valueStats = tstats.valueStats || [],
			promoteRows = tstats.promoteRows || [],
			splits = valueStats.map(function(v){if(v) return v[0] && v[0].splits})
			filteredRows = tstats.effectedRows || [], columnTable = sample;

		if(transform.name===dw.transform.CUT) transform.update(true)
		switch(transform.name){
			case dw.transform.FOLD:
			case dw.transform.UNFOLD:
			case dw.transform.WRAP:
			case dw.transform.TRANSPOSE:
				spreadsheet_container.addClass('previewBeforeTable')
				spreadsheet.data(data).update_rollup().update();
				after_spreadsheet.data(sample).update_rollup().update();
        after_spreadsheet_container.addClass('previewAfterTable')
        jQuery("#playground_after_table_container").removeClass('hidden')
			break
			case dw.transform.FILTER:
				spreadsheet_container.addClass('updatedTable')
				spreadsheet.data(sample).update_rollup().update();
			break

			case dw.transform.SPLIT:
			case dw.transform.CUT:
			case dw.transform.EXTRACT:
				highlightClass = transform.name+'Highlight'
			default:
				spreadsheet_container.addClass('updatedTable')
				spreadsheet.data(sample).update_rollup().update()
		}


		var colIndex, original, updated, children, node, val, split, rows;


		if (splits && splits.length) {
		  transform.column().forEach(function(col){
  			original = columnTable[col];
  			var children = cells({cols:[original]})[0];
  			for(var index = 0; index < splits.length; ++index){
  				split = splits[index];
  				if (split) {
  					node = children[index];
  					if (node) {
  						node = node.firstChild
  					}
  					else {
  						break;
  					}
  					val = original.get_raw(index+start_row);
  					if(node && val != undefined && split[0] && val.length >= split[0].end) {
  						Highlight.highlight(node, split[0].start, split[0].end, {highlightClass:highlightClass})
  					}
  				}
  			}
  		})
		}


    cells({cols:newCols}).classed('previewNew', true).classed('unclickable', true)


    cells({cols:droppedCols}).classed("previewDeleted", true)


    cells({cols:toHeaderCols}).classed("previewSchema", true)


		cells({rows:filteredRows}).classed('previewDeleted', true)


		cells({rows:promoteRows}).classed('previewKey', true)


		updatedCols.forEach(function(col){
			original = data[col.name()];
			updated = sample[col.name()];
			colIndex = original.index;
			var updated_rows = dv.range(0, data.rows()).filter(function(r, i) {
			  return (updated[i] !== undefined && original[i] !== updated[i])
			})
			cells({cols:[col], rows:updated_rows}).classed('previewNew', true)
		})


    cells({cols:toValueCols}).classed('previewNew', true)


    cells({cols:toValueCols, rows:keyRows}).classed('previewKey', true)


    cells({cols:valueCols, chart:after_chart}).classed('previewNew', true)


    cells({cols:valueCols, chart:after_chart, rows:toKeyRows}).classed('previewKey', true)


    cells({cols:keyCols, chart:after_chart}).classed('previewKey', true)


		transform.drop(old_drop);
	}
	else{
		spreadsheet.update();
	}

	jQuery('.unclickable').unbind('mouseup').unbind('mousedown')
	spreadsheet.data(data).update_rollup()
}
