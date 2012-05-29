dw.derive.parse = function(formula) {
	return new MathProcessor().parse(formula);
}




MathProcessor = function(){
    var o = this;
	if(true){
		o.o = {
	        "+": function(a, b){ return dw.derive.add().children([a, b]); },
			"-": function(a, b){ return dw.derive.subtract().children([a, b]); },
			"/": function(a, b){ return dw.derive.divide().children([a, b]); },
	        "*": function(a, b){ return dw.derive.multiply().children([a, b]); }
	    };

	}
	else {
		o.o = {
			        "+": function(a, b){ return +a + b; },
			        "-": function(a, b){ return a - b; },
			        "%": function(a, b){ return a % b; },
			        "/": function(a, b){ return a / b; },
			        "*": function(a, b){ return a * b; },
			        "^": function(a, b){ return Math.pow(a, b); },
			        "~": function(a, b){ return Math.sqrt(a, b); }
			    };

	}
    o.s = { "^": 3, "~": 3, "*": 2, "/": 2, "%": 1, "+": 0, "-": 0 };
    o.u = {"+": 1, "-": -1}, o.p = {"(": 1, ")": -1};
};

MathProcessor.prototype.parse = function(e){
    for(var n, x, o = [], s = [x = this.RPN(e.replace(/ /g, "").split(""))]; s.length;)
        for((n = s[s.length-1], --s.length); n[2]; o[o.length] = n, s[s.length] = n[3], n = n[2]);
    for(; (n = o.pop()) != undefined; n[0] = this.o[n[0]](n[2][0], n[3][0]));

    return x[0];
};

MathProcessor.prototype.methods = {
    "div": function(a, b){ return parseInt(a / b); },
    "frac": function(a){ return a - parseInt(a); },
    "sum": function(n1, n2, n3, n){ for(var r = 0, a, l = (a = arguments).length; l; r += a[--l]); return r; },
    "medium": function(a, b){ return (a + b) / 2; }
};

MathProcessor.prototype.error = function(s){
    throw new Error("MathProcessor: " + (s || "Erro na expressão"));
}

MathProcessor.prototype.RPN = function(e){
    var _, r, c = r = [, , , 0];
    if(e[0] in this.u || !e.unshift("+"))
        for(; e[1] in this.u; e[0] = this.u[e.shift()] * this.u[e[0]] + 1 ? "+" : "-");
    (c[3] = [this.u[e.shift()], c, , 0])[1][0] = "*", (r = [, , c, 0])[2][1] = r;
    (c[2] = this.v(e))[1] = c;
    (!e.length && (r = c)) || (e[0] in this.s && ((c = r)[0] = e.shift(), !e.length && this.error()));
     while(e.length){
        if(e[0] in this.u){
            for(; e[1] in this.u; e[0] = this.u[e.shift()] * this.u[e[0]] + 1 ? "+" : "-");
            (c = c[3] = ["*", c, , 0])[2] = [-1, c, , 0];
        }
        (c[3] = this.v(e))[1] = c;
        e[0] in this.s && (c = this.s[e[0]] > this.s[c[0]] ?
            ((c[3] = (_ = c[3], c[2]))[1][2] = [e.shift(), c, _, 0])[2][1] = c[2]
            : r == c ? (r = [e.shift(), , c, 0])[2][1] = r
            : ((r[2] = (_ = r[2], [e.shift(), r, ,0]))[2] = _)[1] = r[2]);
    }
    return r;
};

MathProcessor.prototype.v = function(e){
    if("0123456789.".indexOf(e[0]) + 1){
        for(var i = -1, l = e.length; ++i < l && "0123456789.".indexOf(e[i]) + 1;);
        return [+e.splice(0,i).join(""), , , 0];
    }
    else if(e[0] == "("){
        for(var i = 0, l = e.length, j = 1; ++i < l && (e[i] in this.p && (j += this.p[e[i]]), j););
        return this.RPN(l = e.splice(0,i), l.shift(), !j && e.shift());
    }
    else{
        var i = 0, c = e[0].toLowerCase();
        if((c >= "a" && c <= "z") || c == "_"){
			while((c = e[++i])&&((c.toLowerCase() >= "a" && c <= "z") || c == "_" || (c >= 0 && c <= 9)));
            if(c == "("){
                for(var l = e.length, j = 1; ++i < l && (e[i] in this.p && (j += this.p[e[i]]), j););
                return [e.splice(0,i+1).join(""), , , 0];
            }
        }
		return [e.splice(0,i).join(""), , , 0]
    }
    this.error();
}

MathProcessor.prototype.f = function(e){
    var i = 0, n;
    if(((e = e.split(""))[i] >= "a" && e[i] <= "z") || e[i] == "_"){
        while((e[++i] >= "a" && e[i] <= "z") || e[i] == "_" || (e[i] >= 0 && e[i] <= 9));
        if(e[i] == "("){
            !this.methods[n = e.splice(0, i).join("")] && this.error("Função \"" + n + "\" não encontrada"), e.shift();
            for(var a = [], i = -1, j = 1; e[++i] && (e[i] in this.p && (j += this.p[e[i]]), j);)
                j == 1 && e[i] == "," && (a.push(this.parse(e.splice(0, i).join(""))), e.shift(), i = -1);
            a.push(this.parse(e.splice(0,i).join(""))), !j && e.shift();
        }
        return this.methods[n].apply(this, a);
    }
};