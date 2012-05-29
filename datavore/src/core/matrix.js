/* Matrix API
 rows
 cols
 nnz
 sum (?)
 sumsq (?)
 clone
 like(rows, cols)
 init(rows, cols)
 get(i, j)
 set(i, j)
 scale(s)
 multiply(mat)
 visitNonZero(func)
 visit(func)
*/
dv.matrix = {};

dv.matrix.dense = function (rows, cols, vals) {
  var A = {}, _v = [], _c = cols, _r = rows;

  A.values = function () { return _v; }

  A.init = function (rows, cols, vals) {
    A.rows = (_r = rows);
    A.cols = (_c = cols);
    _v = [];
    if (vals) {
      for (var i = 0; i < (rows*cols); ++i) {
        _v.push(vals[i]);
      }
    } else {
      for (var i = 0; i < (rows*cols); ++i) { _v.push(0); }
    }
  }
  A.clone = function () { return dv.matrix.dense(_r, _c, _v); }
  A.like = function (rows, cols) { return dv.matrix.dense(_r, _c); };

  A.get = function (i,j) { return _v[i*_c + j]; }
  A.set = function (i,j,v) { _v[i*_c + j] = v; }

  A.scale = function (s) {
    for (var i = 0; i < _v.length; ++i) { _v[idx] *= s; }
  }
  A.multiply = function (B) {
    if (_c !== B.rows) {
      dv.error("Incompatible matrix dimensions");
      return null;
    }
    var rows = _r, cols = B.cols, i, j, k, v, z;
    z = A.like(rows, cols);
    for (i = 0; i < rows; ++i) {
      for (j = 0, v=0; j < cols; ++j) {
        for (k=0; k<_c; ++k) {
          v += A.get(i,k) * B.get(k,j);
        }
        if (v) z.set(i,j,v);
      }
    }
    return z;
  }

  A.visitNonZero = function (f) {
    var k0, k, i, j;
    for (i = 0; i < _r; ++i) {
      k0 = i*_c;
      for (j = 0; j < _c; ++j) {
        k = k0 + j;
        u = _v[k];
        if (u) {
          v = f(i,j,u);
          _v[k] = v;
        }
      }
    }
  }

  A.visit = function (f) {
    var k0, k, i, j;
    for (i = 0; i < _r; ++i) {
      k0 = i*_c;
      for (j = 0; j < _c; ++j) {
        k = k0 + j;
        u = _v[k];
        v = f(i,j,u);
        _v[k] = v;
      }
    }
  }

  A.init(rows, cols, vals);
  return A;
};

/**
Sparse matrix definition.
*/
dv.matrix.sparse = function (rows, cols, vals) {
  var A = {}, _v = {}, _c = cols, _r = rows;

  A.values = function () { return _v; }

  A.init = function (rows, cols, vals) {
    A.rows = (_r = rows);
    A.cols = (_c = cols);
    _v = [];
    if (vals) {
      for (idx in vals) {
        _v[idx] = vals[idx];
      }
    }
  }
  A.clone = function () { return dv.matrix.sparse(_r, _c, _v); }
  A.like = function (rows, cols) { return dv.matrix.sparse(rows,cols); };

  A.get = function (i,j) {
    var v = _v[i*_c + j];
    return (v === undefined) ? 0 : v;
  }
  A.set = function (i,j,v) {
    var k = i*_c + j;
    if (v == 0) {
      delete _v[k];
    } else {
      _v[k] = v;
    }
  }

  A.scale = function (s) {
    for (var idx in _v) { _v[idx] *= s; }
  }
  A.multiply = function (B) {
    if (_c !== B.rows) {
      dv.error("Incompatible matrix dimensions");
      return null;
    }
    var rows = _r, cols = B.cols, i, j, k, v, z;
    z = A.like(rows, cols);
    for (i = 0; i < rows; ++i) {
      for (j = 0, v=0; j < cols; ++j) {
        for (k=0; k<_c; ++k) {
          v += A.get(i,k) * B.get(k,j);
        }
        if (v) z.set(i,j,v);
      }
    }
    return z;
  }

  A.visitNonZero = function (f) {
    var i, j, k, u, v, idx;
    for (idx in _v) {
      k = (+idx);
      j = k % _c;
      i = (k-j) / _c;
      u = _v[k];
      v = f(i,j,u);
      if (v==0) {
        delete _v[k];
      } else {
        _v[k] = v;
      }
    }
  }

  A.visit = function (f) {
    var k0, k, u, v, i, j;
    for (i = 0; i < _r; ++i) {
      k0 = i*_c;
      for (j = 0; j < _c; ++j) {
        k = k0 + j;
        u = _v[k];
        u = u ? (+u) : 0;
        v = f(i,j,u);
        if (v==0) {
          delete _v[k];
        } else {
          _v[k] = v;
        }
      }
    }
  }

  A.init(rows, cols, vals);
  return A;
};