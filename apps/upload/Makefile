JS_UPLOAD_FILES = \
	src/core/upload.js \
	src/core/controller.js \

JS_FILES = \
  src/start.js \
	$(JS_UPLOAD_FILES) \
  src/end.js \

JS_COMPILER = \
	java -jar ../lib/google-compiler/compiler-20100201.jar \
	--charset UTF-8 \
	--warning_level=QUIET

JSDOC_HOME = /Library/jsdoc-toolkit
JSDOC = java -jar $(JSDOC_HOME)/jsrun.jar $(JSDOC_HOME)/app/run.js

all: upload-d0.1.js upload-r0.1.js
short: upload-d0.1.js



upload-d0.1.js: $(JS_FILES)
upload-r0.1.js: $(JS_FILES)

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
	rm -rf upload-d0.1.js upload-r0.1.js jsdoc

