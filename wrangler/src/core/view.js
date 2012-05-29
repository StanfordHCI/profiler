/*
 * Options
 * table_container: container to draw table
 * after_table_container: container to draw the after table in before-after previews
 * suggestion_container: container to draw suggestions
*/
dw.view = function(opt) {
  var view= {},
      table_container = opt.table_container,
      after_table_container = opt.after_table_container,
      suggestion_container = opt.suggestion_container,
      table_interaction = opt.table_interaction,
      table, after_table, db = opt.db, suggestions,
      onsuggest = opt.onsuggest;

  view.initUI = function() {
    after_table_container.empty();
    table_container.empty();
    suggestion_container.empty();
    var fields = db.fields();
    table = db.plot('spreadsheet', table_container.attr('id'), fields, {interaction:table_interaction, header_vis:true})

    after_table = db.plot('spreadsheet', after_table_container.attr('id'), fields, {interaction:undefined})
    table.update();
    dw.view.preview(table, undefined, after_table, undefined)
  }

  view.update = function(wrangler_state) {
    suggestions = dw.view.suggestions(suggestion_container);
    suggestions.suggestions(wrangler_state.suggestions())
    suggestions.initUI();
    suggestions.update();

    var preview_suggestion = function() {
      var suggestion_index = wrangler_state.selected_suggestion_index(),
          suggestion = undefined;
      if (suggestion_index != undefined) {
        suggestion = wrangler_state.suggestions()[suggestion_index];
      }
      suggestions.highlight_suggestion(suggestion_index)
      dw.view.preview(table, suggestion, after_table, undefined)
      if (onsuggest) {
        onsuggest(suggestion);
      }
    }

    preview_suggestion();

    jQuery(document).unbind('keydown.wrangler_view');
    jQuery(document).bind('keydown.wrangler_view', function(event) {
      var type = event && event.srcElement && event.srcElement.type
    	if(type!='text'){
    	  switch(event.which){
          case 38:
            /*Up*/
      	    wrangler_state.decrement_selected_suggestion_index();
      	    preview_suggestion();
      	    event.preventDefault()
            break
          case 40:
      		  /*Down*/
      	    wrangler_state.increment_selected_suggestion_index();
      	    preview_suggestion();
            event.preventDefault()
            break
        }
      }
    })


  }

  return view;
};
