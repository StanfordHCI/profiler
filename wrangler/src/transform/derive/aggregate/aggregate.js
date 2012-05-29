dw.derive.aggregate = function(children, group) {

	var agg = dw.derive.expression(children);

  group = group || [];

  agg.group = function (x) {
    if(!arguments.length) return group;
    group = x;
    if (typeOf(group) !== 'array') {
      group = [group];
    }
    return agg;
  }

  agg.transform = function(values, table) {



  	var x = values[0], length = x.length, i,
  	    result = dv.array(length), query, query_result,
        table_wrapper = table.copy_shallow(), x_name = (x.name && x.name()) || 'x',
        x = table_wrapper.addColumn(x_name, x, dv.type.numeric), partition, partition_bins;

    query = agg.query([x.name()]);



    partition_bins = [];
    agg.group().map(function(g) {
      var temp_col = g.evaluate(table);
      temp_col = table_wrapper.addColumn('bin', temp_col, dv.type.nominal);
      partition_bins.push(temp_col.name());
    })
    partition = dv.partition(table_wrapper, partition_bins);
    query_result = partition.query(query);
    result = query_result[partition_bins.length];


    result.type = dt.type.number();
    return result;
  }

  agg.group(group)

	return agg;

};
