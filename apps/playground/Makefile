JS_playground_FILES = \
	src/core/playground.js \
	src/core/controller.js \
	src/core/editor.js \

JS_FILES = \
  src/start.js \
	$(JS_playground_FILES) \
  src/end.js \

JS_COMPILER = \
	java -jar ../lib/google-compiler/compiler-20100201.jar \
	--charset UTF-8 \
	--warning_level=QUIET

JSDOC_HOME = /Library/jsdoc-toolkit
JSDOC = java -jar $(JSDOC_HOME)/jsrun.jar $(JSDOC_HOME)/app/run.js

all: playground-d0.1.js playground-r0.1.js
short: playground-d0.1.js

playground-d0.1.js: $(JS_FILES)
playground-r0.1.js: $(JS_FILES)

%-d0.1.js: Makefile
	grep ' $$' -Hn $(filter %.js,$^) && echo "ERROR: trailing space" && exit 1 || true
	rm -f $@
	cat $(filter %.js,$^) >> $@

%-r0.1.js: Makefile
	rm -f $@
	cat $(filter %.js,$^) | $(JS_COMPILER) >> $@

jsdoc: $(JS_FILES) Makefile
	rm -rf jsdoc
	$(JSDOC) -a -t=$(JSDOC_HOME)/templates/jsdoc -d=$@ -E="^dv-" $(JS_FILES)

clean:
	rm -rf playground-d0.1.js playground-r0.1.js jsdoc

