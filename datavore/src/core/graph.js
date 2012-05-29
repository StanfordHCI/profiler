dv.graph = function (N, src, trg) {
  var G = [], _links;
  G.nodes = N;
  G.edges = src.length;
  G.source = src;
  G.target = trg;

  G.init = function () {
    var i, u, v, links = [];
    for (i = 0; i < N; ++i) {
      links.push([]);
    }
    for (i = 0; i < src.length; ++i) {
      u = src[i];
      v = trg[i];
      links[u].push(v);
      links[v].push(u);
    }
    _links = links;
  }

  G.neighbors = function (n) {
    return _links[n];
  }

  G.init();
  return G;
};



dv.graph.indegree = function (g) {
  var i, N=g.nodes, E=g.edges, trg=g.target, deg = dv.array(N);
  for (i = 0; i < E; ++i) deg[trg[i]] += 1;
  return deg;
};

dv.graph.outdegree = function (g) {
  var i, N=g.nodes, E=g.edges, src=g.source, deg = dv.array(N);
  for (i = 0; i < E; ++i) deg[src[i]] += 1;
  return deg;
};

dv.graph.degree = function (g) {
  var i, N=g.nodes, E=g.edges, src=g.source, trg=g.target, deg = dv.array(N);
  for (i = 0; i < E; ++i) {
    deg[src[i]] += 1;
    deg[trg[i]] += 1;
  }
  return deg;
};

/**
 * Calculates betweenness centrality measures for nodes in an unweighted graph.
 * The running time is O(|V|*|E|).
 * The algorithm used is due to Ulrik Brandes, as published in the
 * <a href="http:\\www.inf.uni-konstanz.de/algo/publications/b-fabc-01.pdf">
 * Journal of Mathematical Sociology, 25(2):163-177, 2001</a>.
 */
dv.graph.bc = function (g) {
  var N = g.nodes, links, stack, queue,
    i, j, n, v, w, s, sn, sv, sw, len;


  function score() {
    var s = {};
    s.centrality = 0;
    s.reset = function () {
      s.predecessors = [];
      s.dependency = 0;
      s.distance = -1;
      s.paths = 0;
      return s;
    }
    return s.reset();
  }


  for (n = 0, s=[]; n < N; ++n) {
    s.push(score());
  }


  for (n = 0; n < N; ++n) {
    for (i = 0; i < N; ++i) { s[i].reset(); }
    sn = s[n];
    sn.paths = 1;
    sn.distance = 0;

    stack = [];
    queue = [n];

    while (queue.length > 0) {
      v = queue.shift();
      stack.push(v);
      sv = s[v];

      links = g.neighbors(v);
      for (i = 0, len=links.length; i < len; ++i) {
        w = links[i];
        sw = s[w];
        if (sw.distance < 0) {
          queue.push(w);
          sw.distance = sv.distance + 1;
        }
        if (sw.distance == sv.distance + 1) {
          sw.paths += sv.paths;
          sw.predecessors.push(sv);
        }
      }
    }
    while (stack.length > 0) {
      sw = stack.pop();
      for (i = 0, len=sw.predecessors.length; i < len; ++i) {
        sv = sw.predecessors[i];
        sv.dependency += (sv.paths/sw.paths) * (1+sw.dependency);
      }
      if (sw !== sn) sw.centrality += sw.dependency;
    }
  }
  return s.map(function (sc) { return sc.centrality; });
};



dv.cluster = {};

dv.cluster.merge = function (a, b, p, n) {
  var m = {i:(+a),j:(+b),prev:p,next:n};
  if (p) p.next = m;
  if (n) n.prev = m;
  return m;
};

dv.cluster.community = function (g) {
  var edge = dv.cluster.merge, merges=edge(-1,-1), merge=merges,
    dQ, maxDQ = 0, Q = 0, zsum = 0, scores=[], N = g.nodes, M = g.edges,
    Z, z, w, x, y, v, na, tmp, i, j, k, xy, yx, xk, yk, ky,
    E = edge(-1,-1), e = E, maxEdge = edge(0,0), a = dv.array(N),
    src = g.source, trg = g.target;

  for (i = 0; i < M; ++i) {
    u = src[i], v = trg[i];
    if (u != v) zsum += 2;
  }
  zsum = 1/zsum;


  z = dv.array(N*N);
  for (i = 0; i < M; ++i) {
    u = src[i], v = trg[i];
    if (u == v) continue;
    w = zsum;
    z[u*N+v] += w;
    z[v*N+u] += w;
    a[u] += w;
    a[v] += w;
    e = edge(u, v, e);
  }

  for (i = 0; i < N-1 && E.next; ++i) {
    maxDQ = -Infinity;
    maxEdge.i = 0; maxEdge.j = 0;

    for (e=E.next; e; e=e.next) {
      x = e.i; y = e.j;
      if (x == y) continue;

      xy = x*N+y; yx = y*N+x;
      dQ = z[xy] + z[yx] - 2*a[x]*a[y];

      if (dQ > maxDQ) {
        maxDQ = dQ;
        maxEdge.i = x;
        maxEdge.j = y;
      }
    }


    x = maxEdge.i; y = maxEdge.j;
    if (y < x) { tmp = y; y = x; x = tmp; }

    xy = x*N; yx = y*N;
    for (k = 0, na = 0; k < N; ++k) {
      xk = xy+k; yk = yx+k;
      v = z[xk] + z[yk];
      if (v != 0) {
        na += v;
        z[xk] = v;
        z[yk] = 0;
      }
    }

    for (k = 0; k < N; ++k) {
      kx = k*N+x; ky = k*N+y;
      v = z[kx] + z[ky];
      if (v != 0) {
        z[kx] = v;
        z[ky] = 0;
      }
    }

    a[x] = na;
    a[y] = 0;


    for (e=E.next; e; e=e.next) {
      if ((e.i == x && e.j == y) || (e.i == y && e.j == x)) {
        e.prev.next = e.next;
        if (e.next) e.next.prev = e.prev;
      } else if (e.i == y) {
        e.i = x;
      } else if (e.j == y) {
        e.j = x;
      }
    }

    Q += maxDQ;
    scores.push(Q);
    merge = edge(x, y, merge);
  }
};

































































































dv.cluster.groups = function (mergelist, idx) {
  var merges = mergelist.merges,
    scores = mergelist.scores,
    map = {}, groups, gid=1,
    max, i, j, e, k1, k2, l1, l2;

  if (idx === undefined || idx < 0) {
    for (i = 0,idx=-1,max=-Infinity; i < scores.length; ++i) {
      if (scores[i] > max) { max = scores[idx=i]; }
    }
  }

  for (i = 0, e=merges.next; i <= idx; ++i, e=e.next) {
    k1 = e.i; k2 = e.j;
    if ((l1 = map[k1]) === undefined) {
      l1 = [k1];
      map[k1] = l1;
    }
    if ((l2 = map[k2]) === undefined) {
      l1.push(k2);
    } else {
      for (j = 0; j < l2.length; ++j) l1.push(l2[j]);
      delete map[k2];
    }
  }

  groups = dv.array(merges.length+1);
  for (k1 in map) {
    l1 = map[k1];
    for (i = 0; i < l1.length; ++i) {
      groups[l1[i]] = gid;
    }
    ++gid;
  }

  return groups;
};