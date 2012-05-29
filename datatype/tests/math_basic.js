x = new MathProcessor;

if(x.parse("1+2+(3*4)").evaluate() != 15) console.error("Math failed");