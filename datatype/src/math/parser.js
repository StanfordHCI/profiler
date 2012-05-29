dt.parser = PEG.buildParser(' \
start \
  = additive \
 \
additive \
  = left:multiplicative "+" right:additive { return dt.math.add([left, right]); } \
  / left:multiplicative "-" right:additive { return dt.math.subtract([left, right]); } \
  / multiplicative \
 \
multiplicative \
  = left:primary "*" right:multiplicative { return dt.math.multiply([left, right]); } \
  / left:primary "/" right:multiplicative { return dt.math.divide([left, right]); } \
  / "-" primary:primary {return dt.math.negate([primary])} \
  / primary \
 \
primary \
  = integer \
  / variable \
  / "(" additive:additive ")" { return additive; } \
 \
integer "integer" \
  = digits:[0-9]+ { return dt.math.constant(parseInt(digits.join(""), 10)); } \
variable "variable" \
  = chars:([a-zA-Z][a-zA-Z0-9]*) { return dt.math.variable(chars.join("")); } \
');
