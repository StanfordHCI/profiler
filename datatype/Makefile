JS_CORE_FILES = \
	src/core/dt.js \
	src/core/min.js \
	src/core/max.js \
	src/core/minmax.js \
	src/core/registry.js \
	src/core/composite.js \
	src/core/is_missing.js \

JS_TYPE_FILES = \
	src/core/type/datatype.js \
	src/core/type/primitive.js \
	src/core/type/uncoded_primitive.js \
	src/core/type/bool.js \
	src/core/type/integer.js \
	src/core/type/number.js \
	src/core/type/date.js \
	src/core/type/string.js \
	src/core/type/whitespace.js \

JS_CONSTRAINT_FILES = \
	src/constraint/range.js \
	src/constraint/dictionary.js \
	src/constraint/length.js \
	src/constraint/regex/regex.js \
	src/constraint/regex/alphanumeric.js \
	src/constraint/regex/string.js \
	src/constraint/regex/symbol.js \
	src/constraint/regex/number.js \

JS_TRANSFORM_FILES = \
	src/transform/scale.js \
	src/transform/lowercase.js \
	src/transform/uppercase.js \
	src/transform/capitalize.js \
	src/transform/lookup.js \

JS_DATE_FILES = \
	src/date/date.js \
	src/date/util.js \
	src/date/datetime.js \
	src/date/second.js \
	src/date/minute.js \
	src/date/hour.js \
	src/date/day.js \
	src/date/full_date.js \
	src/date/month.js \
	src/date/year.js \

JS_GEO_FILES = \
	src/geo/geo.js \
	src/geo/us/us.js \
	src/geo/us/us_state_name.js \
	src/geo/us/us_fips_code.js \
	src/geo/world/world.js \
	src/geo/world/world_country_name.js \
	src/geo/world/world_iso_code.js \

JS_INFERENCE_FILES = \
	src/inference/inference.js \
	src/inference/structure.js \
	src/inference/simple.js \

JS_MATH_FILES = \
	src/math/math.js \
	src/math/expression.js \
	src/math/constant.js \
	src/math/variable.js \
	src/math/add.js \
	src/math/multiply.js \
	src/math/subtract.js \
	src/math/divide.js \
	src/math/negate.js \
	src/math/parse.js \
	src/math/parser.js \
	src/math/univariate.js \
	src/math/bivariate.js \

JS_FILES = \
  src/start.js \
	$(JS_CORE_FILES) \
	$(JS_TYPE_FILES) \
	$(JS_MATH_FILES) \
	$(JS_DATE_FILES) \
	$(JS_GEO_FILES) \
	$(JS_TRANSFORM_FILES) \
	$(JS_CONSTRAINT_FILES) \
	$(JS_INFERENCE_FILES) \
  src/end.js \

JS_COMPILER = \
	java -jar lib/google-compiler/compiler-20100201.jar \
	--charset UTF-8 \
	--warning_level=QUIET

JSDOC_HOME = /Library/jsdoc-toolkit
JSDOC = java -jar $(JSDOC_HOME)/jsrun.jar $(JSDOC_HOME)/app/run.js

all: datatype-d0.1.js datatype-r0.1.js
short: datatype-d0.1.js

datatype-d0.1.js: $(JS_FILES)
datatype-r0.1.js: $(JS_FILES)

%-d0.1.js: Makefile
	grep ' $$' -Hn $(filter %.js,$^) && echo "ERROR: trailing space" && exit 1 || true
	rm -f $@
	cat $(filter %.js,$^) >> $@
	cp $@ ../lib/datatype/

%-r0.1.js: Makefile
	rm -f $@
	cat $(filter %.js,$^) | $(JS_COMPILER) >> $@
	cp $@ ../lib/datatype/

jsdoc: $(JS_FILES) Makefile
	rm -rf jsdoc
	$(JSDOC) -a -t=$(JSDOC_HOME)/templates/jsdoc -d=$@ -E="^dt-" $(JS_FILES)

clean:
	rm -rf datatype-d0.1.js datatype-r0.1.js jsdoc
