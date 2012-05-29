

dv.view = function (table, options)
{
  var view = [],
      table = table, idx = options.indices, i, dims = options.dims;

  table.map(function(c, i) {
    column_view = idx.map(function(index) {
      return c[index];
    })
    view[i] =  column_view;
    view[c.name] = column_view;
  })

  view.index = function() {
    if(!arguments.length) return idx;
  }

  view.dims = function() {
    if(!arguments.length) return dims;
  }

  view.materialize = function() {
    var mat = dv.table();
    var cols = table.map(function(c, i) {
      var col = [];
      idx.map(function(index) {
        col.push(c.get_raw(index))
      })
      mat.addColumn(c.name(), col, c.type)
    })
    return mat;
  }

  view.query = function(q) {

    var query_table = q.table || table;
    q.filter_index = idx;
    return table.query(q);
  }
  return view;
};

dv.partition = function (table, dims)
{
  var partition = {},
      partition_query = {dims:dims||[], vals:[dv.list("*")]},
      query_result = table.query(partition_query),
      views = [];


  query_result[dims.length].map(function(d, i) {

    views.push(dv.view(table, {indices:d,
      dims:query_result.slice(0, dims.length).map(function(x) {
        return x[i];
      })}));
  })

  partition.views = function() {
    return views;
  }

  partition.query = function(q) {
    var query_table = q.table || table, view_result,
        dims_length = dims.length,
        query_cols = dims_length + (q.bins ? q.bins.length : 0) + (q.vals ? q.vals.length : 0),
        query_rows = query_table.rows(),
        view_row, col, idx, original_row, view_dims,
        query_result = dv.array_with_init(query_cols, undefined);

    query_result.map(function(c, i) {
      query_result[i] = dv.array_with_init(query_rows, undefined);
    })

    views.forEach(function(view) {
        view_result = view.query(q);
        view_dims = view.dims();
        idx = view.index();
        for (view_row = 0; view_row < idx.length; ++view_row) {
          original_row = idx[view_row];
          for (col = 0; col < dims_length; ++col) {
            query_result[col][original_row] = view_dims[col];
          }
          for (col = 0; col < view_result.length; ++col) {
            query_result[dims_length+col][original_row] = view_result[col][0];
          }
        }
      })
      return query_result;
    }

    return partition;
};