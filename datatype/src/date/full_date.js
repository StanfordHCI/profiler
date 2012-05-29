

dt.type.date.date = function(formats) {

  var datatype = dt.type.date(formats),
      formats = formats || dt.type.date.default_full_date_formats;

  datatype.formats(formats);
  datatype.name('full_date')
  return datatype;

};

dt.type.date.default_full_date_formats = ['%Y-%m-%d', '%m-%d-%Y', '%m/%d/%Y', '%Y-%m', '%m-%Y', '%m/%Y', '%d-%b-%Y'];