
dw.metadata = (function() {

  var metadata = {},
      transform_parameters, map_parameters, text_pattern_parameters, fold_parameters, unfold_parameters, merge_parameters, fill_parameters, row_parameter,
      always_show = ['column', 'on', 'measure'], never_show = ['table', 'status', 'insert_position', 'ignore_between'];

  row_parameter = {
    name: 'row',
    description: 'Specifies which rows the transform should operate on.  Defaults to all rows.  See documentation for how to create filters.',
    default_value: undefined,
    helper_message: 'See documentation for how to create filters.',
    type: 'row',
    possible_values: 'See documentation on filters.'
  }

  transform_parameters = [
    {
			name: 'column',
      description: 'The columns to transform.',
      default_value: [],
      helper_message: '',
      type: 'columns',
      possible_values: 'Column in the table.'
    },
    {
			name: 'drop',
      description: 'Whether or not to drop input columns from the table.',
      default_value: function(t) {return ['drop', 'split', 'promote', 'filter', 'cut'].indexOf(t.name) > -1},
      helper_message: '',
      type: 'boolean',
      possible_values: [true, false]
    },
    {
			name: 'table',
      description: 'The table to transform.',
      default_value: 0,
      helper_message: 'Which table to transform.  Should not need to use this currently.',
      type: 'integer',
      possible_values: 'Value between 0 and number of tables - 1'
    },
    {
			name: 'status',
      description: 'Whether transform is currently active',
      default_value: dw.status.active,
      helper_message: 'Used internally to activate/inactive transforms.',
      type: 'enumerable',
      possible_values: [dw.status.active, dw.status.inactive, dw.status.deleted, dw.status.invalid]
    }
  ];


  map_parameters = [
    {
			name: 'result',
      description: 'Whether generated values should appear in new columns or should generate new rows.',
      default_value: dw.COLUMN,
      helper_message: '',
      type: 'enumerable',
      possible_values: [dw.COLUMN, dw.ROW]
    },
    {
			name: 'insert_position',
      description: 'Start position of new columns within the table.',
      default_value: dw.INSERT_RIGHT,
      helper_message: 'Where to place new columns in the table.  This is used internally for now.',
      type: 'enumerable',
      possible_values: [dw.INSERT_RIGHT, dw.INSERT_END]
    },
    row_parameter
  ]

  filter_parameters = [
      row_parameter
  ]

  row_parameters = [
    {
  	 name: 'formula',
     description: 'The conditions to filter',
     default_value: '',
     helper_message: 'Type in a filter condition',
     type: 'filter_condition',
     possible_values: 'A valid filter'
    }
  ]

  promote_parameters = [
    {
 			name: 'header_row',
     description: 'The row to convert to a header.',
     default_value: 0,
     helper_message: 'The row to convert to a header',
     type: 'row_index',
     possible_values: 'Any row index'
    }
  ]

  text_pattern_parameters = [
    {
			name: 'on',
      description: 'A string or regular expression to match against.',
      default_value: undefined,
      helper_message: 'Which regular expression to use.',
      type: 'regex',
      possible_values: 'Any string or regular expression.'
    },
    {
			name: 'before',
      description: 'A string or regular expression to match against.',
      default_value: undefined,
      helper_message: 'Which regular expression to use.',
      type: 'regex',
      possible_values: 'Any string or regular expression.'
    },
    {
			name: 'after',
      description: 'A string or regular expression to match against.',
      default_value: undefined,
      helper_message: 'Which regular expression to use.',
      type: 'regex',
      possible_values: 'Any string or regular expression.'
    },
    {
			name: 'ignore_between',
      description: 'A string or regular expression used to ingore text.',
      default_value: undefined,
      helper_message: 'Which regular expression to use.',
      type: 'regex',
      possible_values: 'Any string or regular expression.'
    },
    {
			name: 'quote_character',
      description: 'A quote character.',
      default_value: undefined,
      helper_message: 'Used to ignore matches between occurrences of the character.',
      type: 'character',
      possible_values: 'Any character.'
    },
    {
			name: 'which',
      description: 'Which occurrence of the pattern to match against.',
      default_value: 1,
      helper_message: 'Used to select the nth occurrence of a pattern.',
      type: 'integer',
      possible_values: 'Any non-negative integer.'
    },
    {
			name: 'max',
      description: 'How many occurrences to match.',
      default_value: 1,
      helper_message: 'Use 0 to indicate as many times as possible.',
      type: 'integer',
      possible_values: 'Any non-negative integer.'
    },
    {
			name: 'positions',
      description: 'Index positions of text to match.',
      default_value: undefined,
      helper_message: 'Use to split text positionally',
      type: 'ints',
      possible_values: 'Any array of 2 non-negative integers.'
    }
  ]

  fill_parameters = [
    {
			name: 'direction',
      description: 'The direction of the fill.',
      default_value: dw.DOWN,
      helper_message: 'Use to indicate which direction to fill.',
      type: 'enumerable',
      possible_values: [dw.DOWN, dw.UP, dw.LEFT, dw.RIGHT]
    },
    row_parameter
  ]

  fold_parameters = [
    {
			name: 'keys',
      description: 'The direction of the fill.',
      default_value: [-1],
      helper_message: 'Use -1 to indicate header row',
      type: 'row_indices',
      possible_values: 'Array of ints >= -1'
    }
  ]

  unfold_parameters = [
    {
			name: 'measure',
      description: 'The attribute to unfold on.',
      default_value: undefined,
      helper_message: '',
      type: 'column',
      possible_values: 'A column name'
    }
  ]

  merge_parameters = [
    {
			name: 'glue',
      description: 'The text to use between cells.',
      default_value: '',
      helper_message: '',
      type: 'string',
      possible_values: 'Any string.'
    }
  ]

  var transforms = {
    'cut': {
      parameters: transform_parameters.concat(map_parameters).concat(text_pattern_parameters),
      constructor_parameters: ['column']
    },
    'copy': {
      parameters: transform_parameters.concat(map_parameters),
      constructor_parameters: ['column']
    },
    'drop':{
      parameters: transform_parameters,
      constructor_parameters: ['column']
    },
    'extract':{
      parameters: transform_parameters.concat(map_parameters).concat(text_pattern_parameters),
      constructor_parameters: ['column']
    },
    'fill':{
      parameters: transform_parameters.concat(fill_parameters),
      constructor_parameters: ['column']
    },
    'filter':{
      parameters: transform_parameters.concat(filter_parameters),
      constructor_parameters: [],
      ignored_parameters: ['column']
    },
    'fold':{
      parameters: transform_parameters.concat(fold_parameters),
      constructor_parameters: ['column']
    },
    'merge':{
      parameters: transform_parameters.concat(map_parameters).concat(merge_parameters),
      constructor_parameters: ['column']
    },
    'promote':{
      parameters: transform_parameters.concat(promote_parameters),
      constructor_parameters: ['column']
    },
    'row':{
      parameters: transform_parameters.concat(row_parameters),
      constructor_parameters: ['formula'],
      ignored_parameters: ['column']
    },
    'split':{
      parameters: transform_parameters.concat(map_parameters).concat(text_pattern_parameters),
      constructor_parameters: ['column']
    },
    'unfold':{
      parameters: transform_parameters.concat(unfold_parameters),
      constructor_parameters: ['column']
    }
  }


  for(var t in transforms) {
    transforms[t].parameters.forEach(function(p) {
      if(typeOf(p.default_value) != 'function') {
        p.default_value = dw.functor(p.default_value);
      }
    })
  }

  return {
    transforms: transforms,
    constructor_parameters: function(t) {
      return transforms[t.name].constructor_parameters;
    },
    displayed_parameters: function(t) {
      var transform = transforms[t.name];
      return transform.parameters.filter(function(p) {
        if (transform.constructor_parameters.indexOf(p.name) != -1 ) {
          return false;
        }
        if (transform.ignored_parameters && transform.ignored_parameters.indexOf(p.name) != -1) {
          return false;
        }
        return (always_show.indexOf(p.name) !== -1) || (never_show.indexOf(p.name) === -1 && t["_"+p.name] != p.default_value(t));
      })
    }

  };
})();

