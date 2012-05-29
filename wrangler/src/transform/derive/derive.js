dw.derive = function(){
	var t = dw.transform();
	dw.ivar(t, [{name:'result', initial:dw.COLUMN},{name:'formula', initial:undefined},{name:'insert_position', initial:dw.INSERT_RIGHT},{name:'row', initial:undefined}])
	t.apply = function(tables, options){

    var table = t.getTable(tables),
        result = dw.parser.parse(t.formula()).evaluate(table);
        table.addColumn('derived', result, result.type, {encoded:result.lut != undefined, lut:result.lut});
	}
	return t;
}
