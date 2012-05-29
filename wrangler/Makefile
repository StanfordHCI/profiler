JS_CORE_FILES = \
	src/core/dw.js \
	src/core/wrangle.js \
	src/core/controller.js \
	src/core/view.js \

JS_REGEX_FILES = \
	src/regex/regex.js \
	src/regex/match.js \

JS_TRANSFORM_FILES = \
	src/transform/transform.js \
	src/transform/copy.js \
	src/transform/drop.js \
	src/transform/map.js \
	src/transform/merge.js \
	src/transform/textPattern.js \
	src/transform/extract.js \
	src/transform/cut.js \
	src/transform/unfold.js \
	src/transform/fill.js \
	src/transform/filter.js \
	src/transform/fold.js \
	src/transform/row.js \
	src/transform/split.js \
	src/transform/schema.js \
	src/transform/metadata.js \

JS_DERIVE_FILES = \
	src/transform/derive/derive.js \
	src/transform/derive/derived_predicate.js \
	src/transform/derive/expression.js \
	src/transform/derive/constant.js \
	src/transform/derive/variable.js \
	src/transform/derive/add.js \
	src/transform/derive/multiply.js \
	src/transform/derive/subtract.js \
	src/transform/derive/divide.js \
	src/transform/derive/log.js \
	src/transform/derive/pow.js \
	src/transform/derive/negate.js \
	src/transform/derive/parse.js \
	src/transform/derive/parser.js \
	src/transform/derive/univariate.js \
	src/transform/derive/bivariate.js \
	src/transform/derive/empty.js \
	src/transform/derive/index.js \
	src/transform/derive/zscore.js \

JS_AGGREGATE_FILES = \
	src/transform/derive/aggregate/aggregate.js \
	src/transform/derive/aggregate/sum.js \
	src/transform/derive/aggregate/avg.js \
	src/transform/derive/aggregate/min.js \
	src/transform/derive/aggregate/max.js \
	src/transform/derive/aggregate/count.js \
	src/transform/derive/aggregate/stdev.js \
	src/transform/derive/aggregate/variance.js \

JS_PREDICATE_FILES = \
	src/transform/derive/predicate/eq.js \
	src/transform/derive/predicate/missing.js \
	src/transform/derive/predicate/neq.js \
	src/transform/derive/predicate/lt.js \
	src/transform/derive/predicate/lte.js \
	src/transform/derive/predicate/gt.js \
	src/transform/derive/predicate/gte.js \
	src/transform/derive/predicate/is.js \
	src/transform/derive/predicate/and.js \
	src/transform/derive/predicate/or.js \
	src/transform/derive/predicate/not.js \

JS_INFERENCE_FILES = \
	src/inference/engine.js \
	src/inference/row_inference.js \
	src/inference/regex/regex.js \
	src/inference/regex/match.js \

JS_VIEW_FILES = \
	src/view/suggestion/suggestions.js \
	src/view/suggestion/grouped_suggestions.js \
	src/view/suggestion/suggestion.js \
	src/view/suggestion/text.js \
	src/view/preview/preview.js \
	src/view/preview/highlight.js \

JS_CLAUSE_FILES = \
	src/view/transform/description/description.js \
	src/view/transform/description/clause.js \
	src/view/transform/description/columns.js \
	src/view/transform/description/row.js \
	src/view/transform/description/enumerable.js \
	src/view/transform/description/column.js \
	src/view/transform/description/filter.js \
	src/view/transform/description/ints.js \
	src/view/transform/description/int.js \
	src/view/transform/description/row_index.js \
	src/view/transform/description/row_indices.js \
	src/view/transform/description/regex.js \

JS_SELECTION_FILES = \
	src/selection/table_selection.js \

JS_CORPUS_FILES = \
	src/corpus/corpus.js \

JS_IO_FILES = \
  src/io/io.js \
  src/io/delimited.js \
  src/io/inference.js \
    
JS_LANG_FILES = \
	src/lang/util.js \

JS_FILES = \
  src/start.js \
	$(JS_CORE_FILES) \
	$(JS_LANG_FILES) \
	$(JS_REGEX_FILES) \
	$(JS_TRANSFORM_FILES) \
	$(JS_DERIVE_FILES) \
	$(JS_PREDICATE_FILES) \
	$(JS_AGGREGATE_FILES) \
	$(JS_INFERENCE_FILES) \
	$(JS_VIEW_FILES) \
	$(JS_CLAUSE_FILES) \
	$(JS_SELECTION_FILES) \
	$(JS_CORPUS_FILES) \
	$(JS_IO_FILES) \
  src/end.js \

JS_COMPILER = \
	java -jar lib/google-compiler/compiler-20100201.jar \
	--charset UTF-8 \
	--warning_level=QUIET

JSDOC_HOME = /Library/jsdoc-toolkit
JSDOC = java -jar $(JSDOC_HOME)/jsrun.jar $(JSDOC_HOME)/app/run.js

all: dw-d0.1.js dw-r0.1.js
short: dw-d0.1.js



dw-d0.1.js: $(JS_FILES)
dw-r0.1.js: $(JS_FILES)

%-d0.1.js: Makefile
	grep ' $$' -Hn $(filter %.js,$^) && echo "ERROR: trailing space" && exit 1 || true
	rm -f $@
	cat $(filter %.js,$^) >> $@
	cp $@ ../lib/wrangler/

%-r0.1.js: Makefile
	rm -f $@
	cat $(filter %.js,$^) | $(JS_COMPILER) >> $@
	cp $@ ../lib/wrangler/



jsdoc: $(JS_FILES) Makefile
	rm -rf jsdoc
	$(JSDOC) -a -t=$(JSDOC_HOME)/templates/jsdoc -d=$@ -E="^dv-" $(JS_FILES)

clean:
	rm -rf dw-d0.1.js dw-r0.1.js jsdoc

