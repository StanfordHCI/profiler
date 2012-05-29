dw.parser = PEG.buildParser(' \
start \
  = additive \
 \
additive \
  = left:multiplicative [ ]*"+"[ ]* right:additive { return dw.derive.add([left, right]); } \
  / left:multiplicative [ ]*"-"[ ]* right:additive { return dw.derive.subtract([left, right]); } \
  / left:multiplicative [ ]*"or"[ ]* right:additive { return dw.derive.or([left, right]); } \
  / left:multiplicative [ ]*"||"[ ]* right:additive { return dw.derive.or([left, right]); } \
  / left:multiplicative [ ]*"and"[ ]* right:additive { return dw.derive.and([left, right]); } \
  / left:multiplicative [ ]*"&&"[ ]* right:additive { return dw.derive.and([left, right]); } \
  / multiplicative \
 \
multiplicative \
  = left:primary [ ]*"*"[ ]* right:multiplicative { return dw.derive.multiply([left, right]); } \
  / left:primary [ ]*"/"[ ]* right:multiplicative { return dw.derive.divide([left, right]); } \
  / left:primary [ ]*"<"[ ]* right:multiplicative { return dw.derive.lt([left, right]); } \
  / left:primary [ ]*"<="[ ]* right:multiplicative { return dw.derive.lte([left, right]); } \
  / left:primary [ ]*">"[ ]* right:multiplicative { return dw.derive.gt([left, right]); } \
  / left:primary [ ]*">="[ ]* right:multiplicative { return dw.derive.gte([left, right]); } \
  / left:primary [ ]*"is missing"[ ]* { return dw.derive.is([left], dt.MISSING); } \
  / left:primary [ ]*"is not missing"[ ]* { return dw.derive.is([left], dt.MISSING, false); } \
  / left:primary [ ]*"is error"[ ]* { return dw.derive.is([left], dt.ERROR); } \
  / left:primary [ ]*"is not error"[ ]* { return dw.derive.is([left], dt.ERROR, false); } \
  / left:primary [ ]*"is valid"[ ]* { return dw.derive.is([left], dt.VALID); } \
  / left:primary [ ]*"is not valid"[ ]* { return dw.derive.is([left], dt.VALID, false); } \
  / left:primary [ ]*"="[ ]* right:multiplicative { return dw.derive.eq([left, right]); } \
  / left:primary [ ]*"!="[ ]* right:multiplicative { return dw.derive.neq([left, right]); } \
  / "not " primary:primary {return dw.derive.not([primary])} \
  / "!" primary:primary {return dw.derive.not([primary])} \
  / "-" primary:primary {return dw.derive.negate([primary])} \
  / primary \
 \
primary \
  = float \
  / integer \
  / string \
  / function \
  / variable \
  / "(" additive:additive ")" { return additive; } \
 \
float "float" \
 = digits:[0-9]+ "." decimal:[0-9]+ { return dw.derive.constant(parseFloat(digits.join("")+"."+decimal.join("")), dt.type.number()); } \
\
integer "integer" \
  = digits:[0-9]+ { return dw.derive.constant(parseInt(digits.join(""), 10), dt.type.number()); } \
 \
string "string" \
 = quote:[\'\""] chars:[^\'^"]+ otherquote:[\'\""] { return dw.derive.constant(chars.join(""), dt.type.string()); } \
\
function "function" \
  = identifier:identifier "()" {return dw.derive[identifier].apply(null)} \
  / identifier:identifier "(" argumentList:argumentList ")"{ return dw.derive[identifier].apply(null, argumentList); } \
\
variable "variable" \
  = identifier:identifier { return dw.derive.variable(identifier); } \
 \
argumentList \
  =	firstArgument:additive arguments:( [ ]*","[ ]* additive )* { if(arguments) {arguments = arguments.map(function(arg) {return arg[3]}) }; arguments.unshift(firstArgument); return arguments;} \
identifier "identifier" \
  = firstChar:([a-zA-Z]) chars:([a-zA-Z0-9_\.]*) { return firstChar+chars.join(""); } \
');
