

dt.type.date.year = function(formats) {

  var datatype = dt.type.date(formats),
      formats = formats || dt.type.date.default_year_formats;

  datatype.formats(formats);
  datatype.name('year')
  return datatype;

};

dt.type.date.default_month_formats = ['%y', '%Y'];