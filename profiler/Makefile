JS_PROFILE_FILES = \
	src/profile/profile.js \
	src/profile/vis.js \
	src/profile/bar.js \
	src/profile/multiples.js \
	src/profile/cluster_multiples.js \
	src/profile/grouped_bar.js \
	src/profile/histogram.js \
	src/profile/date_histogram.js \
	src/profile/spreadsheet.js \
	src/profile/scatter.js \
	src/profile/month_histogram.js \
	src/profile/line.js \
	src/profile/schema.js \
	src/profile/world_map.js \
	src/profile/view.js \
	src/profile/controller.js \
	src/profile/text_cluster.js \

JS_QUERY_FILES = \
	src/query/query.js \
	src/query/bin.js \
	src/query/group.js \
	src/query/quarter.js \
	src/query/month.js \
	src/query/year.js \
	src/query/month_year.js \
	src/query/day.js \
	src/query/hour.js \

JS_SCROLL_FILES = \
	src/profile/scroll/scroll.js \
	src/profile/scroll/histogram.js \
	src/profile/scroll/bar.js \
	src/profile/scroll/scatter.js \

JS_TICK_FILES = \
	src/profile/tick/tick.js \
	src/profile/tick/month.js \
	src/profile/tick/quarter.js \
	src/profile/tick/month_year.js \
	src/profile/tick/year.js \
	src/profile/tick/day.js \
	src/profile/tick/hour.js \

JS_MENU_FILES = \
	src/profile/menu/menu.js \
	src/profile/menu/menu_widget.js \
	src/profile/menu/histogram.js \
	src/profile/menu/date_histogram.js \
	src/profile/menu/spreadsheet.js \
	src/profile/menu/text_cluster.js \
	src/profile/menu/bar.js \
	src/profile/menu/grouped_bar.js \
	src/profile/menu/histogram.js \
	src/profile/menu/line.js \
	src/profile/menu/scatter.js \
	src/profile/menu/world_map.js \
	src/profile/menu/month_histogram.js \

JS_QUALITY_FILES = \
	src/profile/quality/quality.js \
	src/profile/quality/bar.js \
	src/profile/quality/scatter.js \
	src/profile/quality/spreadsheet.js \

JS_SUMMARY_FILES = \
	src/profile/summary/summary.js \
	src/profile/summary/numeric.js \

JS_EDITOR_FILES = \
	src/editor/editor.js \
	src/editor/range.js \
	src/editor/input.js \
	src/editor/formula.js \

JS_FACTORY_FILES = \
	src/profile/factory/factory.js \
	src/profile/factory/bin.js \
	src/profile/factory/date.js \

JS_CHART_FILES = \
	src/profile/chart/chart.js \
	src/profile/chart/bar.js \
	src/profile/chart/grouped_bar.js \
	src/profile/chart/spreadsheet.js \
	src/profile/chart/histogram.js \
	src/profile/chart/date_histogram.js \
	src/profile/chart/line.js \
	src/profile/chart/scatter.js \
	src/profile/chart/world_map.js \
	src/profile/chart/month_histogram.js \
	src/profile/chart/text_cluster.js \

JS_SELECTION_FILES = \
	src/selection/selection.js \
	src/selection/manager.js \
	src/selection/range.js \
	src/selection/month.js \
	src/selection/quality.js \
	src/selection/world_map.js \

JS_STAT_FILES = \
	src/stat/stat.js \
	src/stat/entropy.js \
	src/stat/similarity/levenshtein.js \
	src/stat/similarity/atomic_string.js \
	src/stat/similarity/qgram_filter.js \
	src/stat/outlier/outlier.js \
	src/stat/outlier/zscore.js \
	src/stat/outlier/linear_regression.js \
	src/stat/outlier/mahalanobis.js \
  src/stat/index/index.js \
  src/stat/index/qgram.js \

JS_SUGGESTION_FILES = \
	src/profile/suggestion/suggestion.js \
	src/profile/suggestion/related_variable.js \
	src/profile/suggestion/entropy.js \
	src/profile/suggestion/issue/missing.js \
	src/profile/suggestion/issue/error.js \
	src/profile/suggestion/issue/extreme.js \
	src/profile/suggestion/issue/primary.js \
	src/profile/suggestion/issue/mad.js \
	src/profile/suggestion/issue/duplicate.js \

JS_LAYOUT_FILES = \
	src/layout/layout.js \
	src/layout/naive.js \
	src/layout/linear.js \

JS_TABLE_LAYOUT_FILES = \
	src/layout/table/table.js \
	src/layout/table/uniform.js \

JS_VIEW_FILES = \
	src/view/suggestion/text.js \

JS_FILES = \
  src/start.js \
	$(JS_PROFILE_FILES) \
	$(JS_QUERY_FILES) \
	$(JS_CHART_FILES) \
	$(JS_FACTORY_FILES) \
	$(JS_QUALITY_FILES) \
	$(JS_TICK_FILES) \
	$(JS_SCROLL_FILES) \
	$(JS_MENU_FILES) \
	$(JS_SUMMARY_FILES) \
	$(JS_EDITOR_FILES) \
	$(JS_LAYOUT_FILES) \
	$(JS_TABLE_LAYOUT_FILES) \
	$(JS_SELECTION_FILES) \
	$(JS_STAT_FILES) \
	$(JS_SUGGESTION_FILES) \
	$(JS_VIEW_FILES) \
  src/end.js \

JS_COMPILER = \
	java -jar lib/google-compiler/compiler-20100201.jar \
	--charset UTF-8 \
	--warning_level=QUIET

JSDOC_HOME = /Library/jsdoc-toolkit
JSDOC = java -jar $(JSDOC_HOME)/jsrun.jar $(JSDOC_HOME)/app/run.js

all: dp-d0.1.js dp-r0.1.js
short: dp-d0.1.js



dp-d0.1.js: $(JS_FILES)
dp-r0.1.js: $(JS_FILES)

%-d0.1.js: Makefile
	grep ' $$' -Hn $(filter %.js,$^) && echo "ERROR: trailing space" && exit 1 || true
	rm -f $@
	cat $(filter %.js,$^) >> $@
	cp $@ ../lib/profiler/

%-r0.1.js: Makefile
	rm -f $@
	cat $(filter %.js,$^) | $(JS_COMPILER) >> $@
	cp $@ ../lib/profiler/


jsdoc: $(JS_FILES) Makefile
	rm -rf jsdoc
	$(JSDOC) -a -t=$(JSDOC_HOME)/templates/jsdoc -d=$@ -E="^dv-" $(JS_FILES)

clean:
	rm -rf dp-d0.1.js dp-r0.1.js jsdoc

