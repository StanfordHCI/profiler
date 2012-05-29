dv.array = function (n) {
  var a = Array(n);
  for (var i=n; --i >= 0;) { a[i] = 0; }
  return a;
};

dv.array_with_init = function (n, init) {
  var a = Array(n);
  for (var i=n; --i >= 0;) { a[i] = init; }
  return a;
};

dv.minv = function (x) {
  var m = Infinity,i = 0,l=x.length;
  for (;i < l;++i){
    v = x[i];
    if (v < m) m = v;
  }
  return m;
};

dv.maxv = function (x) {
  var m = -Infinity,i = 0,l=x.length;
  for (;i < l;++i){
    v = x[i];
    if (v > m) m = v;
  }
  return m;
};

dv.span = function (x) {
  var min = Infinity, max = -Infinity, v;
  for (var i = 0; i < x.length;++i){
    v = x[i];
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return [min, max];
};



dv.rand = {};

dv.rand.uniform = function (min, max) {
  min = min || 0;
  max = max || 1;
  var delta = max - min;
  return function () {
    return min + delta * Math.random();
  }
};

dv.rand.integer = function (a, b) {
  if (b === undefined) {
    b = a;
    a = 0;
  }
  return function () {
    return a + Math.max(0, Math.floor(b*(Math.random()-0.001)));
  }
};

dv.rand.normal = function (mean, stdev) {
  mean = mean || 0;
  stdev = stdev || 1;
  var next = undefined;
  return function () {
    var x = 0, y = 0, rds, c;
    if (next !== undefined) {
      x = next;
      next = undefined;
      return x;
    }
    do {
      x = Math.random()*2-1;
      y = Math.random()*2-1;
      rds = x*x + y*y;
    } while (rds == 0 || rds > 1);
    c = Math.sqrt(-2*Math.log(rds)/rds);
    next = mean + y*c*stdev;
    return mean + x*c*stdev;
  }
};

/*** Sorting ****/

/*** Sorting ****/

dv.merge_sort =  function (array,comparison) {

  comparison = comparison || dv.merge_sort.stringCompare;

  if (array.length < 2)
    return array;
  var middle = Math.ceil(array.length/2);
  return dv.merge_sort.merge(dv.merge_sort(array.slice(0,middle),comparison),
      dv.merge_sort(array.slice(middle),comparison),
      comparison);
};


dv.merge_sort.merge = function (left,right,comparison) {
  var result = new Array();
  while((left.length > 0) && (right.length > 0))
  {
    if (comparison(left[0],right[0]) < 0)
      result.push(left.shift());
    else
      result.push(right.shift());
  }
  while(left.length > 0)
    result.push(left.shift());
  while(right.length > 0)
    result.push(right.shift());
  return result;
};


dv.merge_sort.stringCompare = function (left, right) {
  left = ""+left
  right = "" + right

  return dv.merge_sort.compare(left,right)
};

dv.merge_sort.compare = function (left, right) {
  if (left == right)
    return 0;
  else if (left < right)
    return -1;
  else
    return 1;
};

dv.merge_sort.numberCompare = function (left, right) {
  if (left===undefined&&right===undefined) return 0;
  if (left===undefined) return -1;
  if (right===undefined) return 1;

  leftNo = Number(left)
  rightNo = Number(right)
  if (isNaN(leftNo)&&isNaN(rightNo)) return dv.merge_sort.compare(left, right)
  else if (isNaN(leftNo)) return -1
  else if (isNaN(rightNo)) return 1
  return dv.merge_sort.compare(leftNo, rightNo)
};

dv.merge_sort.dateCompare = function (left, right) {
  leftNo = Number(left)
  rightNo = Number(right)
  if (isNaN(leftNo)&&isNaN(rightNo)) return dv.merge_sort.compare(left, right);
  else if (isNaN(leftNo)) return rightNo;
  else if (isNaN(rightNo)) return leftNo;
  return dv.merge_sort.compare(leftNo, rightNo);
};

dv.jq = function (e, opt) {
  opt = opt || {};
  var x = jQuery(document.createElement(e)), select_options = opt.select_options || [];

  d3.keys(select_options).forEach(function (o){
    var option = document.createElement("option");
    option.value = o;
    option.text = select_options[o];
    x[0].options.add(option)
  });

  return x;
};

dv.add_select_option = function(select, key, value){
	if(arguments.length < 3) value = key;
	var option = document.createElement("option");
	option.value = value;
	option.text = key;
	select[0].options.add(option);
};

dv.sort_multiple = function (a, fields, directions) {
  var idx = d3.range(a[0].length), l, r, i, fl = fields.length, directions = directions || [];
  idx.sort(function (x, y){
    for (i = 0; i < fl; ++i){
      l = a[fields[i]][x];
      r = a[fields[i]][y];
      if (l < r) return directions[i] === 1 ? 1 : -1;
      if (l > r) return directions[i] === 1 ? -1 : 1;
    }
    return 0;
  });

  var result = a.map(function (v, j){
    var col = dv.array(idx.length), f = a[j];
    for (i = 0; i < idx.length; ++i){
      col[i] = f[idx[i]]
    }
    return col;
  })
  result.idx = idx;
  return result;
};

dv.time = function (f, numreps) {
  numreps = numreps || 1000;
  var start = Date.now(), end, a = dv.array(numreps);
  a.push(f());
  console.log(Date.now()-start)
};


/**
 * @param {number} start
 * @param {number=} stop
 * @param {number=} step
 */
dv.range = function(start, stop, step) {
  if (arguments.length === 1) { stop = start; start = 0; }
  if (step == null) step = 1;
  if ((stop - start) / step == Infinity) throw new Error("infinite range");
  var range = [],
       i = -1,
       j;
  if (step < 0) while ((j = start + step * ++i) > stop) range.push(j);
  else while ((j = start + step * ++i) < stop) range.push(j);
  return range;
};

dv.merge = function(obj1, obj2) {
  var merged = {};
  d3.keys(obj1).forEach(function(key) {
    merged[key] = obj1[key];
  })
  d3.keys(obj2).forEach(function(key) {
    merged[key] = obj2[key];
  })
  return merged;
};
