function heatmapChartViz(option) {
  const operationMeasures = ["sum", "avg", "count"];
  const positionLegends = ["top", "bottom", "right"];
  const showValues = [1, 0];
  // Verify options
  if (!operationMeasures.includes(option.operationMeasure)) {
    throw Error("Calc can only be sum, avg, or count.");
  }
  if (!positionLegends.includes(option.positionLegend)) {
    throw Error("Legend can only be top or bottom.");
  }
  if (!showValues.includes(option.showValue)) {
    throw Error("showValue can only be 1 or 0.");
  }

  // Extract options
  const el = option.el;
  const columnX = option.columnX;
  const columnY = option.columnY;
  const columnMeasure = option.columnMeasure;
  const operationMeasure = option.operationMeasure || "avg";
  const fillColorStart = option.fillColorStart;
  const fillColorFinish = option.fillColorFinish;
  const colorAxis = option.colorAxis || "#000000";
  const positionLegend = option.positionLegend || "top";
  const labelX = option.labelX;
  const labelY = option.labelY;
  const sortX = option.sortX;
  const sortY = option.sortY;
  const showValue = option.showValue;

  console.log(option);
  console.log("showValue", showValue);

  // Process data
  option.data.forEach(d => {
    d[columnMeasure] = parseFloat(d[columnMeasure]);
  });

  function xSort(a, b) {
    for (i = 0; i < sortX.length; i++) {
      if (a === sortX[i]) {
        var valA = i;
      }
      if (b === sortX[i]) {
        var valB = i;
      }
    }
    return valA < valB ? -1 : valA > valB ? 1 : valA >= valB ? 0 : NaN;
  }

  function ySort(a, b) {
    for (i = 0; i < sortY.length; i++) {
      if (a === sortY[i]) {
        var valA = i;
      }
      if (b === sortY[i]) {
        var valB = i;
      }
    }
    return valA < valB ? -1 : valA > valB ? 1 : valA >= valB ? 0 : NaN;
  }

  const allValues = [];
  var data = d3
    .nest()
    .key(function(d) {
      return d[columnX];
    })
    .sortKeys(xSort)
    .key(function(d) {
      return d[columnY];
    })
    .sortKeys(ySort)
    .rollup(function(v) {
      const value = aggregate(v, operationMeasure, columnMeasure);
      allValues.push(value);
      return value;
    })
    .entries(option.data);

  const maxValue = d3.max(allValues);

  //Set up:
  var xGroups = data.map(function(d) {
    return d.key;
  });

  var yGroups = data[0].values.map(function(d) {
    return d.key;
  });

  var margin = { top: 10, right: 50, bottom: 50, left: 30 };
  svg_width = 700;
  svg_height = 700;

  // Build Scales:
  var x = d3
    .scaleBand()
    .range([margin.left, svg_width - margin.right - margin.left])
    .domain(xGroups)
    .padding(0.01);

  var y = d3
    .scaleBand()
    .range([svg_height - margin.top - margin.bottom, margin.bottom])
    .domain(yGroups)
    .padding(0.01);

  var colorScale = d3
    .scaleLinear()
    .domain([0, maxValue])
    .interpolate(d3.interpolateHcl)
    .range([d3.rgb(fillColorStart), d3.rgb(fillColorFinish)]);

  // Render chart
  const container = d3.select(el).classed("heatmap-chart-viz", true);

  let legendContainer;
  if (positionLegend === "top") {
    legendContainer = container.insert("div", ".chart-container");
  }

  var chartContainer = container
    .append("svg")
    .attr("width", svg_width)
    .attr("height", svg_height)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  if (positionLegend === "bottom") {
    legendContainer = container.append("div");
  }

  render(chartContainer, data);

  function render(container, data) {
    data.forEach(function(v) {
      container
        .selectAll()
        .data(v.values)
        .enter()
        .append("rect")
        .attr("class", "heatmap-square")
        .each(function(d) {
          d.parentKey = v.key;
        })
        .attr("x", function(d) {
          return x(v.key);
        })
        .attr("y", function(d) {
          return y(d.key);
        })
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .style("fill", fillColorStart)
        .on("mouseover", showTooltip)
        .on("mousemove", moveTooltip)
        .on("mouseout", hideTooltip);

      if (showValue === 1) {
        container
          .selectAll()
          .data(v.values)
          .enter()
          .append("text")
          .attr("class", "value-label")
          .attr("x", function(d) {
            return x(v.key) + x.bandwidth() / 2;
          })
          .attr("y", function(d) {
            return y(d.key) + y.bandwidth() / 2;
          })
          .text(function(d) {
            return formatNumber(d.value);
          })
          .attr("opacity", 0);
      }
    });
    container
      .append("g")
      .attr("class", "x-axis")
      .attr(
        "transform",
        "translate(0," + (svg_height - margin.bottom - margin.top) + ")"
      )
      .call(d3.axisBottom(x));

    container
      .append("g")
      .attr("class", "y-axis")
      .attr("transform", "translate(" + margin.left + ",0)")
      .call(d3.axisLeft(y));

    container
      .append("text")
      .attr(
        "transform",
        "translate(" +
          (svg_width - margin.left - margin.right) / 2 +
          " ," +
          (svg_height - margin.top) +
          ")"
      )
      .attr("class", "x-axis axis-label")
      .text(labelX);

    container
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (svg_height - margin.bottom - margin.top) / 2)
      .attr("dy", "1em")
      .attr("class", "y-axis axis-label")
      .text(labelY);

    d3.selectAll(".y-axis line").style("stroke", colorAxis);
    d3.selectAll(".y-axis .domain").style("stroke", colorAxis);
    d3.selectAll(".y-axis text").style("fill", colorAxis);
    d3.selectAll(".x-axis line").style("stroke", colorAxis);
    d3.selectAll(".x-axis .domain").style("stroke", colorAxis);
    d3.selectAll(".x-axis text").style("fill", colorAxis);
  }

  init();

  function init() {
    chartContainer
      .selectAll("rect")
      .transition()
      .duration(1000)
      .delay(500)
      .style("fill", function(d) {
        return colorScale(d.value);
      });

    if (showValue === 1) {
      chartContainer
        .selectAll(".value-label")
        .transition()
        .duration(1000)
        .delay(500)
        .attr("opacity", 1);
    }
  }

  // Tooltip
  const tooltip = container.append("div").attr("class", "chart-tooltip");
  tooltip.append("div").attr("class", "tooltip-x-label");
  tooltip.append("div").attr("class", "tooltip-y-label");
  tooltip.append("div").attr("class", "tooltip-value");

  function moveTooltip() {
    let padding = 10;
    const { width, height } = tooltip.datum();
    let x = d3.event.clientX;
    if (x + padding + width > window.innerWidth) {
      x = x - padding - width;
    } else {
      x = x + padding;
    }
    let y = d3.event.clientY;
    if (y + padding + height > window.innerHeight) {
      y = y - padding - height;
    } else {
      y = y + padding;
    }
    tooltip.style("transform", `translate(${x}px,${y}px)`);
  }

  function showTooltip(d) {
    tooltip.select(".tooltip-x-label").text(d.parentKey);
    tooltip.select(".tooltip-y-label").text(d.key);
    tooltip.select(".tooltip-value").text(formatNumber(d.value));
    tooltip
      .style("border-color", colorScale(d.value))
      .transition()
      .style("opacity", 1);

    const { width, height } = tooltip.node().getBoundingClientRect();
    tooltip.datum({ width, height });
  }

  function hideTooltip() {
    tooltip.transition().style("opacity", 0);
  }

  // Render legend
  if (positionLegend === "top" || positionLegend === "bottom") {
    var legendWidth = svg_width - margin.left - 2 * margin.right;

    var legendSVG = legendContainer
      .append("svg")
      .attr("width", svg_width)
      .attr("height", 50)
      .append("g")
      .attr("transform", "translate(" + (margin.left + margin.right) + ",0)")
      .attr("class", "legend-container");

    var legendColorScale = d3
      .scaleLinear()
      .domain([0, legendWidth])
      .interpolate(d3.interpolateHcl)
      .range([d3.rgb(fillColorStart), d3.rgb(fillColorFinish)]);

    legendSVG
      .selectAll(".bars")
      .data(d3.range(legendWidth), function(d) {
        return d;
      })
      .enter()
      .append("rect")
      .attr("class", "bars")
      .attr("x", function(d, i) {
        return i;
      })
      .attr("y", 0)
      .attr("height", 30)
      .attr("width", 1)
      .style("fill", function(d, i) {
        return legendColorScale(d);
      });
  }

  // Utilities
  function aggregate(v, op, col) {
    switch (op) {
      case "sum":
        return d3.sum(v, v => v[col]);
      case "avg":
        return d3.mean(v, v => v[col]);
      case "count":
        return v.length;
      default:
        break;
    }
  }

  function sortBars(sortOrder) {
    switch (sortOrder) {
      case "atoz":
        return d3.ascending;
      case "ztoa":
        return d3.descending;
      default:
        break;
    }
  }

  // Format number
  function formatNumber(d) {
    if (d < 1e3) {
      return d3.format(".3s")(d);
    } else if (d < 1e5) {
      return `${(d / 1e3).toFixed(1)}K`;
    } else if (d < 1e6) {
      return `${(d / 1e3).toFixed(0)}K`;
    } else if (d < 1e8) {
      return `${(d / 1e6).toFixed(1)}M`;
    } else if (d < 1e9) {
      return `${(d / 1e6).toFixed(0)}M`;
    } else if (d < 1e11) {
      return `${(d / 1e9).toFixed(1)}B`;
    } else if (d < 1e12) {
      return `${(d / 1e9).toFixed(0)}B`;
    } else if (d < 1e14) {
      return `${(d / 1e12).toFixed(1)}T`;
    } else {
      return `${(d / 1e12).toFixed(1)}T`;
    }
  }
}
