/*
 * Classic example grammar, which recognizes simple arithmetic expressions like
 * "2*(3+4)". The parser generated from this grammar then computes their value.
 */

start
  = additive

additive
  = left:multiplicative "+" right:additive { return dw.derive.add([left, right]); }
  / left:multiplicative "-" right:additive { return dw.derive.subtract([left, right]); }
  / multiplicative

multiplicative
  = left:primary "*" right:multiplicative { return dw.derive.multiply([left, right]); }
  / left:primary "/" right:multiplicative { return dw.derive.divide([left, right]); }
  / "-" primary:primary {return -1*primary}
  / primary

primary
  = integer
  / "(" additive:additive ")" { return additive; }

integer "integer"
  = digits:[0-9]+ { return parseInt(digits.join(""), 10); }
