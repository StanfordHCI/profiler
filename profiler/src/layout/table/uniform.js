dp.layout.table.uniform = function(opt) {
  opt = opt || {};
  var layout = {},
      max_table_width = opt.max_table_width || 800,
      min_column_width = opt.min_column_width || 100;
  layout.column_width = function(data, column, view_index, opt) {
    opt = opt || {}
    var fields = opt.fields || data;
    return Math.max(min_column_width, max_table_width / fields.length);
  }
  return layout;
};
