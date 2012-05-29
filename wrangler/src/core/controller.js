/* Controls logic of a wrangler app
* Options
* initial_transforms: transforms to run immediately when controller starts.
* backend: the backend to use ('pg' for postgres, 'js' for javascript.)
*/
dw.controller = function(options){
		options = options || {};
		var controller = {},
		    table = options.data,
		    originalTable = table.slice(),
		    wrangler = dw.wrangle(), script,
		    engine = dw.engine().table(table), selected_suggestion_index,
		    tableSelection, backend = options.backend || 'js';

	if(options.initial_transforms){
		options.initial_transforms.forEach(function(t){
			wrangler.add(t);
		})
		wrangler.apply([table], {backend:backend, success:on_transform_complete});
	}

  controller.execute_transform = function(transform) {




		wrangler.add(transform)
    transform.apply([table]);


	  var after_execute = function() {
      infer_schema()
  		tableSelection.clear()
  		interaction({type:dw.engine.execute, transform:transform})
    }
    clear_suggestions();
  }

  function clear_suggestions() {
    suggestions = [];
    selected_suggestion_index = undefined;
  }

	controller.suggestions = function() {
	  return suggestions;
	}

  controller.selected_suggestion_index = function(x) {
    if (!arguments.length) return selected_suggestion_index;
    selected_suggestion_index = x;
    return controller;
  }

  controller.increment_selected_suggestion_index = function() {
    if (!suggestions.length) return controller;
    if (selected_suggestion_index === undefined) {
      selected_suggestion_index = 0;
    }
    else if (selected_suggestion_index === suggestions.length - 1) {
      selected_suggestion_index = 0;
    } else {
      selected_suggestion_index = selected_suggestion_index + 1;
    }
    return controller;
  }

  controller.decrement_selected_suggestion_index = function() {
    if (!suggestions.length) return controller;
    if (selected_suggestion_index === undefined) {
      selected_suggestion_index = suggestions.length - 1;
    }
    else if (selected_suggestion_index === 0) {
      selected_suggestion_index = suggestions.length - 1;
    } else {
      selected_suggestion_index = selected_suggestion_index - 1;
    }
    return controller;
  }

	controller.table = function() {
	  return table;
	}

	controller.wrangler = function() {
	  return wrangler;
	}

	controller.interaction = function(params){
		var selection = tableSelection.add(params);
		params.rows = selection.rows();
		params.cols = selection.cols();
		suggestions = engine.table(table).input(params).run(13);
		selected_suggestion_index = suggestions.length ? 0 : undefined;
		return controller;
	}

	function infer_schema(){





	}

	var warned = false;
	function confirmation(options){
		if(!warned){
			warned = true;
			alert('Wrangler only supports up to 40 columns and 1000 rows.  We will preview only the first 40 columns and 1000 rows of data.')
		}
	}

	function clear_editor(){
		tableSelection.clear()
		interaction({type:dw.engine.clear})
	}

	function promote_transform(transform, params){
		tableSelection.clear()
		interaction({type:dw.engine.promote, transform:transform})
	}

	tableSelection = dw.table_selection();

	jQuery(document).bind('keydown', function(event){
		var type = event && event.srcElement && event.srcElement.type
		if(type!='text'){
			switch(event.which){
		          	case 8:
		 				/*Backspace*/
		           	break
		        case 9:
					editor.promote()


					if(type!='textarea'){
		                event.preventDefault()
		            }
		            break
      case 27:

					break
		    }

		}
	})
	infer_schema();
	return controller;
}
