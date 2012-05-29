/*
 * Options
 * suggestion_container: container to draw suggestions
*/
dp.view = function(opt) {
  var view= {},
      suggestion_container = opt.suggestion_container,
      db = opt.db, suggestions,
      onsuggest = opt.onsuggest;

  view.initUI = function() {

    draw_related_options();

    suggestion_container.empty();


  }



  function draw_suggested_view(profiler_state, suggestion, opt) {
    opt = opt || {};
    var suggestion_type = opt.suggestion_type || dw.view.related_view_type;
    db.clear();
    if (!suggestion) {
      return;
    }
    var col = suggestion.col,
        related_cols;
    if (suggestion_type === 'anomalies') {
      related_cols = suggestion.reason().slice(0, 10);
    } else if (suggestion_type === 'data values') {
      related_cols = suggestion.related().slice(0, 10);
    } else {
      related_cols = [];
    }
    var table = profiler_state.table(), type = function(sug) {
      return type_hash[table[sug.col].type.type()] || 4;
    };
    var type_hash = {"numeric":1, "ordinal":2, "nominal":3}






    var seen_cols = [];
    seen_cols[suggestion.col] = 1;
    related_cols = related_cols.filter(function(s) {
      if (!s || !s.col) return false;
      var col_name = s.col;
      if (col_name[3]==='(') col_name = col_name.substring(4, col_name.length-1);
      if (seen_cols[col_name]) {
        return false;
      }
      seen_cols[col_name] = 1;
      return true;
    })

    db.add_vis(suggestion.col, undefined, undefined, {vis_type:suggestion.vis_type, query:suggestion.binner()})

    related_cols.slice(0, 6).map(function(c) {
      db.add_vis(c.col, undefined, undefined, {query:c.binner});
    })

    if (suggestion.bin) {
      var bin = suggestion.bin();
      var f = function(table, r) {
        return bin[r] !== 0;
      }

    }
  }

  view.update = function(profiler_state) {
    function suggestion_clicked(d) {
      profiler_state.selected_suggestion_index(d);
	    preview_suggestion();
	    event.preventDefault()
    }
    function suggestion_type_switch(d) {
      var suggestion_index = profiler_state.selected_suggestion_index(),
          suggestion = undefined;
      if (suggestion_index != undefined) {
        suggestion = profiler_state.suggestions()[suggestion_index];
      }
      draw_suggested_view(profiler_state, suggestion, {suggestion_type:d.toLowerCase()})
    }

    jQuery('#suggested_view_selector').unbind('onselect')
        .bind('onselect', function(event, d) {suggestion_type_switch(d)});

    var related_container = suggestion_container.append(dv.jq('div'))
    suggestions = dw.view.grouped_suggestions(suggestion_container, {type:dp.view.suggestion.text, onswitchtype: suggestion_type_switch, onclick:suggestion_clicked});
    suggestions.suggestions(profiler_state.suggestions())
    suggestions.initUI();
    suggestions.update();

    var preview_suggestion = function() {
      var suggestion_index = profiler_state.selected_suggestion_index(),
          suggestion = undefined;
      if (suggestion_index != undefined) {
        suggestion = profiler_state.suggestions()[suggestion_index];
      }
      suggestions.highlight_suggestion(suggestion_index)

      draw_suggested_view(profiler_state, suggestion);
      if (onsuggest) {
        onsuggest(suggestion);
      }
    }

    preview_suggestion();

    jQuery(document).unbind('keydown.profiler_view');
    jQuery(document).bind('keydown.profiler_view', function(event) {
      var type = event && event.srcElement && event.srcElement.type
    	if(type!='text'){
    	  switch(event.which){
          case 38:
            /*Up*/
      	    profiler_state.decrement_selected_suggestion_index();
      	    preview_suggestion();
      	    event.preventDefault()
            break
          case 40:
      		  /*Down*/
      	    profiler_state.increment_selected_suggestion_index();
      	    preview_suggestion();
            event.preventDefault()
            break
          case 27:
            profiler_state.selected_suggestion_index(undefined);
      	    preview_suggestion();
            event.preventDefault()
            break
        }
      }
    })


  }

  return view;
};
