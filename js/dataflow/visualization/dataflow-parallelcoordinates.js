
"use strict";

var extObject = {

  // use object to specify default rendering properties
  defaultProperties: {
    "stroke": "black",
    "stroke-width": "1px",
    "fill": "none",
    "opacity": 0.5
  },
  // show these properties when items are selected
  selectedProperties: {
    "stroke": "#FF4400",
    "stroke-width": "2px"
  },
  // let d3 know to use attr or style for each key
  isAttr: {
    "id": true
  },

  initialize: function(para) {
    DataflowParallelCoordinates.base.initialize.call(this, para);

    this.plotName = "ParallelCoordinates";

    this.inPorts = [
      DataflowPort.new(this, "in", "in-single")
    ];
    this.outPorts = [
      DataflowPort.new(this, "out", "out-multiple")
    ];
    this.prepare();

    // shown dimensions in parallel coordinates
    this.dimensions = [];

    this.scaleTypes = [];
    // dataScale : datavalue <-> [0, 1]
    this.dataScales = [];
    // screenScale: [0, 1] <-> screen pixel (rendering region)
    this.screenScales = [];

    // map each axis to the corresponding X position on screen
    this.axisScale = null;
    // leave some space for axes
    this.plotMargins = [ { before: 30, after: 30 }, { before: 20, after: 20 } ];

    this.lastDataId = 0;  // default: empty data
  },

  serialize: function() {
    var result = DataflowParallelCoordinates.base.serialize.call(this);
    result.dimensions = this.dimensions;
    result.lastDataId = this.lastDataId;
    return result;
  },

  deserialize: function(save) {
    DataflowParallelCoordinates.base.deserialize.call(this, save);

    this.dimensions = save.dimensions;
    this.lastDataId = save.lastDataId;
    if (this.dimensions == null) {
      console.error("dimensions not saved for scatterplot");
      this.dimensions = [0, 0];
    }
  },

  showIcon: function() {
    this.jqicon = $("<div></div>")
      .addClass("dataflow-parallelcoordinates-icon")
      .appendTo(this.jqview);
  },

  interaction: function() {
    var node = this,
        mode = "none";
    var startPos = [0, 0],
        lastPos = [0, 0],
        endPos = [0, 0];
    var brush = [];
    var getOffset = function(event, jqthis) {
      var parentOffset = jqthis.parent().offset();
      return [event.pageX - parentOffset.left, event.pageY - parentOffset.top];
    };
    this.jqsvg
      .mousedown(function(event) {
        if (core.interactionManager.ctrled) // ctrl drag mode blocks
          return;

        startPos = getOffset(event, $(this));

        if (event.which == 1) { // left click triggers brush
          mode = "brush";
          brush = [];
        }
        if (core.interactionManager.visualizationBlocking)
          event.stopPropagation();
      })
      .mousemove(function(event) {

        if (mode == "brush") {
          endPos = getOffset(event, $(this));
          brush.push(endPos);

          node.showBrush(brush);

          lastPos = [endPos[0], endPos[1]];
        }
        // we shall not block mousemove (otherwise dragging edge will be problematic)
        // as we can start a drag on edge, but when mouse enters the visualization, drag will hang there
      })
      .mouseup(function(event) {
        //var pos = getOffset(event, $(this));

        if (mode == "brush") {
          node.selectItemsBrushed(brush);

          if (node.brush) {
            node.brush.remove();
            node.brush = null;
          }
        }

        mode = "none";

        if (core.interactionManager.visualizationBlocking)
          event.stopPropagation();
      });
  },

  selectItemsBrushed: function(brush) {
    if (!core.interactionManager.shifted) {
      this.selected = {}; // reset selection if shift key is not down
    }

    var inpack = this.ports["in"].pack,
        items = inpack.items,
        values = inpack.data.values;

    var points = [];
    for (var d in this.dimensions) {
      // use axisScale to map d-th axis to its X position
      points[d] = [this.axisScale(d)];
    }

    for (var index in items) {
      if (this.selected[index] != null) // already selected
        continue;
      for (var d in this.dimensions) {
        var value = values[index][this.dimensions[d]];
        value = this.dataScales[d](value);
        value = this.screenScales[d](value);
        points[d][1] = value;
      }
      var ok = 0;
      for (var d = 0; d < this.dimensions.length - 1 && !ok; d++) {
        for (var i = 0; i < brush.length - 1; i++) {
          if (Utils.intersect(points[d], points[d + 1], brush[i], brush[i+1])) {
            this.selected[index] = true;
            break;
          }
        }
      }
    }

    this.showVisualization();
    this.process();
    core.dataflowManager.propagate(this);
  },

  showBrush: function(points) {
    var node = this;
    var line = d3.svg.line()
        .x(function(e) {
          return e[0];
        })
        .y(function(e) {
          return e[1];
        })
        .interpolate("linear");
    this.brush = this.svg.append("path")
      .attr("class", "df-parallelcoordinates-brush")
      .attr("d", line(points));
  },

  showVisualization: function() {
    var inpack = this.ports["in"].pack,
        items = inpack.items,
        data = inpack.data,
        values = data.values;

    this.prepareSvg();
    this.prepareScales();
    this.interaction();

    if (this.isEmpty)
      return;

    var node = this;

    var points = [];
    for (var d in this.dimensions) {
      // use axisScale to map d-th axis to its X position
      points[d] = [this.axisScale(d)];
    }

    for (var index in items) {
      for (var d in this.dimensions) {
        var value = values[index][node.dimensions[d]];
        value = this.dataScales[d](value);
        value = this.screenScales[d](value);
        points[d][1] = value;
      }

      var properties = _.extend(
        {},
        this.defaultProperties,
        items[index].properties,
        {
          id: "i" + index
        }
      );
      var line = d3.svg.line()
        .x(function(e) {
          return e[0];
        })
        .y(function(e) {
          return e[1];
        })
        .interpolate("linear");

      var u = this.svg.append("path")
        .attr("id", "i" + index)
        .attr("d", line(points));
      for (var key in properties) {
        if (this.isAttr[key] == true)
          u.attr(key, properties[key]);
        else
          u.style(key, properties[key]);
      }
    }

    this.showSelection();

    // axis appears on top
    for (var d in this.dimensions) {
      this.showAxis(d);
    }
  },

  showSelection: function() {
    // otherwise no item data can be used
    if (this.isEmpty)
      return;

    var inpack = this.ports["in"].pack,
        items = inpack.items,
        values = inpack.data.values,
        node = this;

    var points = [];
    for (var d in this.dimensions) {
      // use axisScale to map d-th axis to its X position
      points[d] = [this.axisScale(d)];
    }

    for (var index in this.selected) {
      for (var d in this.dimensions) {
        var value = values[index][node.dimensions[d]];
        value = this.dataScales[d](value);
        value = this.screenScales[d](value);
        points[d][1] = value;
      }

      var properties = _.extend(
        {},
        this.defaultProperties,
        items[index].properties,
        this.selectedProperties,
        {
          id: "i" + index
        }
      );

      var d3sel = this.svg.selectAll("#i" + index);
      var jqu = $(d3sel[0])
        .appendTo(this.jqsvg);  // change position of tag to make them appear on top
      var u = d3sel;
      for (var key in properties) {
        if (this.isAttr[key] == true)
          u.attr(key, properties[key]);
        else
          u.style(key, properties[key]);
      }
    }
  },


  showOptions: function() {
    var node = this;
    var div = $("<div></div>")
      .addClass("dataflow-options-item")
      .appendTo(this.jqoptions);
    $("<label></label>")
      .addClass("dataflow-options-text")
      .text("Dimensions")
      .appendTo(div);

    var dimensionsUpdated = function() {
      node.showVisualization();
      node.process();
      // push dimension change to downflow
      core.dataflowManager.propagate(node);
    };

    this.dimensionSelect = $("<select></select>")
      .attr("multiple", "multiple")
      .addClass("dataflow-options-select-multiple")
      .appendTo(div)
      .select2()
      .on("select2-selecting", function(event){
        var dim = event.val;
        for (var i in node.dimensions) {
          if (node.dimensions[i] == dim)
            return; // already selected, skip
        }
        node.dimensions.push(dim);
        dimensionsUpdated();
      })
      .on("select2-removed", function(event){
        var dim = event.val;
        for (var i in node.dimensions) {
          if (node.dimensions[i] == dim) {
            node.dimensions.splice(i, 1); // remove this dimension
          }
        }
        dimensionsUpdated();
      });

    this.dimensionSelect.parent().find(".select2-choices")
      .sortable({
        update: function(event, ui) {
          node.dimensions = [];
          node.dimensionSelect.parent().find(".select2-search-choice")
            .each(function() {
              var dimName = $(this).children("div").text(); // get dimension name inside tags
              node.dimensions.push(node.dimensionIndexes[dimName]);
            });
          dimensionsUpdated();
        }
      });

    this.prepareDimensionList();
    // show current selection, must call after prepareDimensionList
    this.dimensionSelect.select2("val", this.dimensions);
  },

  showAxis: function(d) {
    var margins = this.plotMargins;
    var axis = d3.svg.axis()
      .orient("left")
      .tickValues(this.dataScales[d].domain());
    if (this.scaleTypes[d] == "ordinal"){
      axis.scale(this.dataScales[d].copy()
          .rangePoints(this.screenScales[d].range()));
    } else {
      axis.scale(this.dataScales[d].copy()
          .range(this.screenScales[d].range()));
    }
    var transX = this.axisScale(d),
        transY = 0;
    var labelX = 0,
        labelY = this.svgSize[1] - this.plotMargins[1].after + 15;

    var data = this.ports["in"].pack.data;

    var u = this.svg.select("#axis" + d);
    if (u.empty()) {
      u = this.svg.append("g")
       .attr("id", "axis" + d)
       .attr("class", "axis")
       .attr("transform", "translate(" + transX + "," + transY + ")");
    }
    u.call(axis);
    var t = u.select(".df-visualization-label");
    if (t.empty()) {
      t = u.append("text")
        .attr("class", "df-visualization-label")
        .style("text-anchor", "middle")
        .attr("x", labelX)
        .attr("y", labelY);
      }
    t.text(data.dimensions[this.dimensions[d]]);
  },

  prepareScales: function() {
    for (var d in this.dimensions) {
      this.prepareDataScale(d);
      this.prepareScreenScale(d);
    }
    this.prepareAxisScale();
  },

  prepareDataScale: function(d) {
    var inpack = this.ports["in"].pack;
    var items = inpack.items,
        data = inpack.data;

    var dim = this.dimensions[d],
        dimType = data.dimensionTypes[dim];

    var scaleType = dimType == "string" ? "ordinal" : "numerical";
    this.scaleTypes[d] = scaleType;
    var scale;
    if (scaleType == "numerical") {
      scale = this.dataScales[d] = d3.scale.linear().range([0,1]);

      var minVal = Infinity, maxVal = -Infinity;
      // compute min max
      for (var index in items) {
        var value = data.values[index][dim];
        minVal = Math.min(minVal, value);
        maxVal = Math.max(maxVal, value);
      }
      // NOT leave some spaces on the margin
      scale.domain([minVal, maxVal]);

    } else if (scaleType == "ordinal") {
      scale = this.dataScales[d] = d3.scale.ordinal().rangePoints([0,1], 1.0);  // TODO check padding
      // find unique values
      var has = {};
      for (var index in items) {
        var value = data.values[index][dim];
        has[value] = true;
      }
      var values = [];
      for (var value in has) {
        values.push(value);
      }
      scale.domain(values);
    }
  },

  prepareScreenScale: function(d) {
    var scale = this.screenScales[d] = d3.scale.linear();
    var interval = [this.svgSize[1] - this.plotMargins[1].after, this.plotMargins[1].before];
    scale
      .domain([0, 1])
      .range(interval);
  },

  prepareAxisScale: function() {
    var numDims = this.dimensions.length;
    this.axisScale = d3.scale.linear()
      .domain([0, numDims - 1])
      .range([this.plotMargins[0].before, this.svgSize[0] - this.plotMargins[0].after]);
  },

  prepareDimensionList: function() {
    var dims = this.ports["in"].pack.data.dimensions;

    // name to indexes
    // for backward look up in select2 reordering
    this.dimensionIndexes = {};
    for (var i in dims) {
      this.dimensionIndexes[dims[i]] = i;
      $("<option value='" + i + "'>" + dims[i] + "</option>")
        .appendTo(this.dimensionSelect);
    }
  },

  process: function() {
    var inpack = this.ports["in"].pack,
        outpack = this.ports["out"].pack;

    var data = inpack.data;
    if (inpack.isEmpty()) {
      return;
    }

    this.validateSelection();

    if (data.dataId != this.lastDataId) {
      // data has changed, by default load all dimensions
      this.dimensions = [];
      for (var i in data.dimensionTypes) {
        if (data.dimensionTypes[i] == "string") // ignore string by default
          continue;
        this.dimensions.push(i);
      }
      this.lastDataId = data.dataId;
    }

    outpack.copy(inpack);
    outpack.filter(_.allKeys(this.selected));
  },

  selectAll: function() {
    DataflowParallelCoordinates.base.selectAll.call(this);
    this.showSelection();
  },

  clearSelection: function() {
    DataflowParallelCoordinates.base.clearSelection.call(this);
    this.showVisualization(); // TODO　not efficient
  },

  resize: function(size) {
    DataflowParallelCoordinates.base.resize.call(this, size);
    // TODO update scales for dimensions
    this.showVisualization();
  }

};

var DataflowParallelCoordinates = DataflowVisualization.extend(extObject);
