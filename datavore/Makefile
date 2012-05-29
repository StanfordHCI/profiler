JS_LANG_FILES = \
	src/lang/Array.js

JS_CORE_FILES = \
	src/core/dv.js \
	src/core/util.js \
	src/core/table.js \
	src/core/query.js \
	src/core/graph.js \
	src/core/matrix.js \
	src/core/view.js \

JS_PARSE_FILES = \
	src/parse/import.js

JS_FILES = \
  src/start.js \
	$(JS_LANG_FILES) \
	$(JS_CORE_FILES) \
	$(JS_PARSE_FILES) \
	$(JS_TYPE_FILES) \
  src/end.js \

JS_COMPILER = \
	java -jar lib/google-compiler/compiler-20100201.jar \
	--charset UTF-8 \
	--warning_level=QUIET

JSDOC_HOME = /Library/jsdoc-toolkit
JSDOC = java -jar $(JSDOC_HOME)/jsrun.jar $(JSDOC_HOME)/app/run.js

all: datavore-d0.1.js datavore-r0.1.js
short: datavore-d0.1.js

datavore-d0.1.js: $(JS_FILES)
datavore-r0.1.js: $(JS_FILES)

%-d0.1.js: Makefile
	grep ' $$' -Hn $(filter %.js,$^) && echo "ERROR: trailing space" && exit 1 || true
	rm -f $@
	cat $(filter %.js,$^) >> $@
	cp $@ ../lib/datavore/

%-r0.1.js: Makefile
	rm -f $@
	cat $(filter %.js,$^) | $(JS_COMPILER) >> $@
	cp $@ ../lib/datavore/

jsdoc: $(JS_FILES) Makefile
	rm -rf jsdoc
	$(JSDOC) -a -t=$(JSDOC_HOME)/templates/jsdoc -d=$@ -E="^dv-" $(JS_FILES)

clean:
	rm -rf datavore-d0.1.js datavore-r0.1.js jsdoc
