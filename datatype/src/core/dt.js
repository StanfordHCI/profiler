

/**
 * The top-level Datavore namespace. All public methods and fields should be
 * registered on this object. Note that core Datavore source is surrounded by an
 * anonymous function, so any other declared globals will not be visible outside
 * of core methods. This also allows multiple versions of Datavore to coexist,
 * since each version will see their own <tt>dv</tt> namespace.
 *
 * @namespace The top-level Datavore namespace, <tt>dv</tt>.
 */
dt = {};

dt.type = {
  nominal: "nominal",
  ordinal: "ordinal",
  numeric: "numeric",
  geo: "geo",
  geo_world: "geo_world",
  datetime: "datetime",
  unknown: "unknown"
};

dt.VALID = 'valid';
dt.MISSING = undefined;
dt.ERROR = null;

