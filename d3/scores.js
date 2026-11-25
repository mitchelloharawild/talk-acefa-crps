// Interactive accuracy explainers for a Normal forecast of an observation y,
// with sliders for the forecast mean and standard deviation:
//
//   <div class="score-slider" data-score="mae">           density, mean and |error|
//   <div class="score-slider" data-score="crps-density">  density, expected error and spread
//   <div class="score-slider" data-score="crps">          CDF, step at y, and the area between
//
// Slider styles are .score-slider in theme/acefa.scss.
(function () {
  var INK = "#3B3870", NAVY = "#262261", GRID = "#E1E6F0", MINOR = "#F1F6FA";
  var TEAL = "#217BA8", MAGENTA = "#EC008C";
  var WIDTH = 1200, HEIGHT = 360, XMIN = -2, XMAX = 14;
  var Y = 4;
  var SPEC = {
    mu: { label: "Forecast mean", value: 6, min: 0, max: 10, step: 0.1, ticks: [0, 2, 4, 6, 8, 10] },
    sigma: { label: "Forecast sd", value: 1.5, min: 0.1, max: 3, step: 0.1, ticks: [0.5, 1, 1.5, 2, 2.5, 3] }
  };

  function erf(x) {
    // Series for small |x|, continued fraction for erfc otherwise
    var s = x < 0 ? -1 : 1, a = Math.abs(x);
    if (a > 6) return s;
    if (a < 2.5) {
      var sum = a, term = a, n = 0;
      while (Math.abs(term) > 1e-16 * Math.abs(sum)) {
        n++;
        term *= -a * a / n;
        sum += term / (2 * n + 1);
      }
      return s * 2 / Math.sqrt(Math.PI) * sum;
    }
    var f = 0;
    for (var k = 60; k >= 1; k--) f = k / 2 / (a + f);
    return s * (1 - Math.exp(-a * a) / Math.sqrt(Math.PI) / (a + f));
  }
  function Phi(z) { return 0.5 * (1 + erf(z / Math.SQRT2)); }
  function phi(z) { return Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI); }
  function crps(mu, sigma, y) {
    var z = (y - mu) / sigma;
    return sigma * (z * (2 * Phi(z) - 1) + 2 * phi(z) - 1 / Math.sqrt(Math.PI));
  }

  // Shared frame: gridlines, axes and labels around the given marks
  function frame(y, marks) {
    var ticksX = d3.range(XMIN, XMAX + 1, 2), minorX = d3.range(XMIN + 1, XMAX, 2);
    var minorY = d3.pairs(y.ticks).map(function (p) { return (p[0] + p[1]) / 2; });
    var pad = (y.domain[1] - y.domain[0]) * 0.03;
    return Plot.plot({
      width: WIDTH, height: HEIGHT,
      marginLeft: 80, marginRight: 10, marginTop: 8, marginBottom: 56,
      style: { fontFamily: "'Open Sans', sans-serif", fontSize: "17px", color: INK, background: "transparent", overflow: "visible" },
      x: { domain: [XMIN, XMAX], ticks: ticksX, tickSize: 0, tickPadding: 6, label: "x", labelAnchor: "center", labelArrow: "none", labelOffset: 48 },
      y: { domain: [y.domain[0] - pad, y.domain[1] + pad], ticks: y.ticks, tickSize: 0, tickPadding: 6, tickFormat: d3.format(".2f"), label: y.label, labelAnchor: "center", labelArrow: "none", labelOffset: 70 },
      marks: [
        Plot.gridX(minorX, { stroke: MINOR, strokeOpacity: 1 }),
        Plot.gridY(minorY, { stroke: MINOR, strokeOpacity: 1 }),
        Plot.gridX(ticksX, { stroke: GRID, strokeOpacity: 1, strokeWidth: 1.5 }),
        Plot.gridY(y.ticks, { stroke: GRID, strokeOpacity: 1, strokeWidth: 1.5 })
      ].concat(marks)
    });
  }
  function label(x, y, text, color, options) {
    return Plot.text([{ x: x, y: y }], Object.assign({ x: "x", y: "y", text: [text], fontWeight: 700, fontSize: 19, fill: color, stroke: "white", strokeWidth: 5, paintOrder: "stroke" }, options));
  }

  var SCORES = {
    mae: function (mu, sigma) {
      var err = Math.abs(mu - Y), top = 1, bar = 0.88;
      var f = d3.range(XMIN, XMAX + 1e-9, 0.01).map(function (x) { return { x: x, d: phi((x - mu) / sigma) / sigma }; });
      var right = mu >= Y;
      return {
        score: "MAE = <strong>" + err.toFixed(2) + "</strong>",
        plot: frame({ domain: [0, top], ticks: [0, 0.25, 0.5, 0.75, 1], label: "Density" }, [
          Plot.areaY(f, { x: "x", y: "d", fill: TEAL, fillOpacity: 0.15, clip: true }),
          Plot.line(f, { x: "x", y: "d", stroke: TEAL, strokeWidth: 3, clip: true }),
          Plot.ruleX([mu], { y1: 0, y2: top, stroke: TEAL, strokeWidth: 2.5, strokeDasharray: "6,4" }),
          Plot.ruleX([Y], { y1: 0, y2: top, stroke: MAGENTA, strokeWidth: 3 }),
          Plot.link([{ x1: Y, x2: mu }], { x1: "x1", x2: "x2", y1: bar, y2: bar, stroke: NAVY, strokeWidth: 3, markerStart: "tick", markerEnd: "tick" }),
          label((mu + Y) / 2, bar, "|ŷ − y| = " + err.toFixed(1), NAVY, { dy: 20 }),
          label(Y, top, "y", MAGENTA, { dx: right ? -12 : 12, dy: 10 }),
          label(mu, top, "ŷ", TEAL, { dx: right ? 12 : -12, dy: 10 })
        ])
      };
    },
    // CRPS = E|X - y| - E|X - X'| / 2, the forecast's expected error less half its spread
    "crps-density": function (mu, sigma) {
      var z = (Y - mu) / sigma, top = 1, bar1 = 0.88, bar2 = 0.68;
      var err = sigma * (z * (2 * Phi(z) - 1) + 2 * phi(z)), spread = sigma / Math.sqrt(Math.PI);
      var f = d3.range(XMIN, XMAX + 1e-9, 0.01).map(function (x) { return { x: x, d: phi((x - mu) / sigma) / sigma }; });
      var right = mu >= Y, end = right ? Y + err : Y - err;
      return {
        score: "CRPS = " + err.toFixed(2) + " − " + spread.toFixed(2) + " = <strong>" + (err - spread).toFixed(2) + "</strong>",
        plot: frame({ domain: [0, top], ticks: [0, 0.25, 0.5, 0.75, 1], label: "Density" }, [
          Plot.areaY(f, { x: "x", y: "d", fill: TEAL, fillOpacity: 0.15, clip: true }),
          Plot.line(f, { x: "x", y: "d", stroke: TEAL, strokeWidth: 3, clip: true }),
          Plot.ruleX([mu], { y1: 0, y2: top, stroke: TEAL, strokeWidth: 2.5, strokeDasharray: "6,4" }),
          Plot.ruleX([Y], { y1: 0, y2: top, stroke: MAGENTA, strokeWidth: 3 }),
          Plot.link([{ x1: Y, x2: end }], { x1: "x1", x2: "x2", y1: bar1, y2: bar1, stroke: NAVY, strokeWidth: 3, markerStart: "tick", markerEnd: "tick" }),
          label((Y + end) / 2, bar1, "E|X − y| = " + err.toFixed(2), NAVY, { dy: 20 }),
          Plot.link([{ x1: mu - spread / 2, x2: mu + spread / 2 }], { x1: "x1", x2: "x2", y1: bar2, y2: bar2, stroke: TEAL, strokeWidth: 3, markerStart: "tick", markerEnd: "tick" }),
          label(mu, bar2, "½E|X − X′| = " + spread.toFixed(2), TEAL, { dy: 20 }),
          label(Y, top, "y", MAGENTA, { dx: right ? -12 : 12, dy: 10 }),
          label(mu, top, "ŷ", TEAL, { dx: right ? 12 : -12, dy: 10 })
        ])
      };
    },
    crps: function (mu, sigma) {
      var G = d3.range(XMIN, XMAX + 1e-9, 0.04).map(function (x) {
        return { x: x, g: Phi((x - mu) / sigma), f: x < Y ? 0 : 1 };
      });
      var step = [{ x: XMIN, f: 0 }, { x: Y, f: 0 }, { x: Y, f: 1 }, { x: XMAX, f: 1 }];
      return {
        score: "CRPS = <strong>" + crps(mu, sigma, Y).toFixed(2) + "</strong>",
        plot: frame({ domain: [0, 1], ticks: [0, 0.25, 0.5, 0.75, 1], label: "Probability" }, [
          Plot.areaY(G, { x: "x", y1: "g", y2: "f", fill: TEAL, fillOpacity: 0.25 }),
          Plot.line(step, { x: "x", y: "f", stroke: MAGENTA, strokeWidth: 3 }),
          Plot.line(G, { x: "x", y: "g", stroke: TEAL, strokeWidth: 3 }),
          label(Y, 0.5, "y", MAGENTA, { dx: -12, fontSize: 22 }),
          label(XMIN + 0.2, 0.12, "1{x ≥ y}: observation", MAGENTA, { textAnchor: "start" }),
          label(XMAX - 0.2, 0.88, "F(x): forecast", TEAL, { textAnchor: "end" })
        ])
      };
    }
  };

  function setup(el) {
    var score = SCORES[el.dataset.score];
    var names = Object.keys(SPEC);
    var values = {}, inputs = {}, outputs = {};

    var readout = document.createElement("div");
    readout.className = "score-readout";
    var plot = document.createElement("div");
    plot.className = "score-plot";
    var controls = document.createElement("div");
    controls.className = "score-controls";

    names.forEach(function (name) {
      var o = SPEC[name];
      var group = document.createElement("div");
      group.className = "score-input";
      group.innerHTML = '<label></label><div class="score-track"><input type="range">' +
        '<output></output><div class="score-ticks"></div></div>';
      group.querySelector("label").textContent = o.label;
      var input = inputs[name] = group.querySelector("input");
      outputs[name] = group.querySelector("output");
      input.min = o.min; input.max = o.max; input.step = o.step; input.value = o.value;
      values[name] = o.value;
      var ticks = group.querySelector(".score-ticks");
      o.ticks.forEach(function (t) {
        var tick = document.createElement("span");
        tick.textContent = String(t);
        tick.style.setProperty("--at", (t - o.min) / (o.max - o.min));
        ticks.append(tick);
      });
      controls.append(group);
    });
    el.append(readout, plot, controls);

    function update() {
      names.forEach(function (name) {
        var o = SPEC[name];
        outputs[name].textContent = values[name].toFixed(1);
        inputs[name].parentNode.style.setProperty("--fill", (values[name] - o.min) / (o.max - o.min));
      });
      var out = score(values.mu, values.sigma);
      readout.innerHTML = out.score;
      plot.replaceChildren(out.plot);
    }
    names.forEach(function (name) {
      var input = inputs[name];
      input.addEventListener("input", function () {
        values[name] = Number(input.value);
        update();
      });
      // Return the arrow keys to reveal.js once dragging ends
      input.addEventListener("pointerup", function () { input.blur(); });
    });
    update();
  }

  function init() { document.querySelectorAll(".score-slider").forEach(setup); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
