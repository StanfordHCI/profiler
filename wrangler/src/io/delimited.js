dw.io.delimited = function(opt) {
  opt = opt || {};
  var io = {},
      delimiter = opt.delimiter || /,/,
      row_delimiter = opt.row_delimiter || /\n/,
      quote_char = opt.quote_char || '"',
      header_row = opt.header_row || false;

  io.parse = function(text) {
    var wrangle = dw.wrangle(),
        split_rows, split_columns, cut_quotes, set_names,
        data_name = 'data',
        table = dv.table([{type:dv.type.nominal, name:data_name, values:[text]}]);

    split_rows = dw.split([data_name])
                   .on(row_delimiter)
                   .result(dw.ROW)
                   .max(0);

    split_columns = dw.split(["split"])
                      .on(delimiter)
                      .result(dw.COLUMN)
                      .max(0);

    wrangle.add(split_rows).add(split_columns);

    if(header_row) {
      set_names = dw.promote()
                    .header_row(0);

      wrangle.add(set_names);
    }


    wrangle.apply([table]);

    return table;

  }

  io.debug = function() {
    return JSON.stringify({delimiter:delimiter, row_delimiter:row_delimiter, quote_char:quote_char});
  }

  return io;
}