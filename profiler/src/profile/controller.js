/* Controls logic of a wrangler app
* Options
* initial_transforms: transforms to run immediately when controller starts.
* backend: the backend to use ('pg' for postgres, 'js' for javascript.)
*/
dp.controller = function(options){
		options = options || {};
		var controller = {},
		    table = options.data,
        selected_suggestion_index,
        backend = options.backend || 'js';

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
      selected_suggestion_index = undefined;
    } else {
      selected_suggestion_index = selected_suggestion_index - 1;
    }
    return controller;
  }

	controller.table = function() {
	  return table;
	}

	controller.interaction = function(params){
    var related;
    suggestions = [];
    suggestions = suggestions.concat(dp.suggestion.missing(table));
    suggestions = suggestions.concat(dp.suggestion.error(table));

    suggestions = suggestions.concat(dp.suggestion.extreme(table));
    suggestions = suggestions.concat(dp.suggestion.duplicate(table));

    suggestions.map(function(s) {
      binner = function() {
       return dp.suggestion.entropy.bin(table, table[s.col], s.bin()).binner;
      }
      s.binner = binner;
      related = function() {
        if (!s.bin) return [];
        return dp.suggestion.entropy(table, dp.factory.bin().default_bin(table, table[s.col]), {ignored_columns:[s.col]})
      }
      s.related = related;
      reason = function() {
        if (!s.bin) return [];
        return dp.suggestion.entropy(table, s.bin(), {ignored_columns:[s.col]})
      }
      s.reason = reason;
    })


		selected_suggestion_index = undefined;
		return controller;
	}

	return controller;
}
