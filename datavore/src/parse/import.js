
csvToArray = function (strData, strDelimiter) {

  strDelimiter = (strDelimiter || ",");


  var objPattern = new RegExp(
    ("(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
      "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
      "([^\"\\" + strDelimiter + "\\r\\n]*))"
    ), "gi");


  var arrData = [[]];


  var arrMatches = null;



  while (arrMatches = objPattern.exec( strData )){
    var strMatchedDelimiter = arrMatches[ 1 ];
    if (strMatchedDelimiter.length && (strMatchedDelimiter != strDelimiter)){
      arrData.push( [] );
    }
    if (arrMatches[ 2 ]){
      var strMatchedValue = arrMatches[ 2 ].replace(
        new RegExp( "\"\"", "g" ),
        "\""
        );
    } else {
      var strMatchedValue = arrMatches[ 3 ];
    }

    arrData[ arrData.length - 1 ].push( strMatchedValue );
  }


  return( arrData );
};


isNumber = function (n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
};



parseField = function (inarray, i, numRows) {
  var type = "";
  var numNumeric = 0;
  for (var j = 1; j < numRows; j++) {
	if (isNumber(inarray[j][i])) {
	  numNumeric++;
	}
  }

  if (numNumeric / numRows > 0.7) {
	type = "numeric";
  }
  else {
	type = "nominal";
  }
  return type;
};



arrayToProfilerJSON = function (inarray) {
  var numFields = inarray[0].length;
  var numRows = inarray.length;



  var jsonData = new Array();
  for (var i = 0; i < numFields; i++) {
    jsonData.push(new Object());
    var fieldName = inarray[0][i];
    jsonData[i].name = fieldName;
    jsonData[i].values = new Array();
    for (var j = 1; j < numRows; j++) {
      jsonData[i].values.push(inarray[j][i]);
    }
    jsonData[i].type = parseField(inarray, i, numRows);
  }
  return jsonData;
};