dp.factory.bin = function() {
  var factory = {},
      date_factory = dp.factory.date();

  factory.default_bin = function(data, col, opt) {
    var type = col.type.type();
    switch (type) {
      case 'number':
      case 'int':
      case 'numeric':
        return dp.query.bin(data, [col.name()]).dims[0].array(col);
      case 'datetime':
      case 'ordinal':
        return date_factory.query(date_factory.default_type(col))(data, [col.name()]).dims[0].array(col);
      case 'geo':
        return col;
      case 'geolocation':
        return col;
      case 'geo_world':
        return col;
      case 'string':
      case 'nominal':
        return dv.categorical_bin(col.name()).array(col, col.lut)
    }
  }

  factory.all_bins = function(data, col, opt) {
    var type = col.type.type(),
        binOptions;
    switch (type) {
      case 'number':
      case 'int':
      case 'numeric':


        binOptions = [10];
        return binOptions.map(function(b) {
          var x = dp.query.bin(data, [col.name()], {bins:b});
          x.bin = function() {
            return x.dims[0].array(col)
          }
          return x;
        })
      case 'datetime':
      case 'ordinal':
        binOptions = ['year', 'month', 'quarter']
        return binOptions.map(function(b) {
          var x = date_factory.query(b)(data, [col.name()]);
          x.bin = function() {
            return x.dims[0].array(col)
          }
          x.type = b;
          return x;
        })
      case 'geolocation':
        return [{bin:function(){return col}}];
      case 'geo_world':
        return [{bin:function(){return col}}];
      case 'string':
      case 'nominal':
        var x = dv.categorical_bin(col.name());
        x.bin = function() {
          return x.array(col, col.lut);
        }
        return [x];
    }
  }



  return factory;
};
