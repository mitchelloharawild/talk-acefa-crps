# Explaining the Continuous Ranked Probability Score (CRPS)

Slides explaining how the CRPS evaluates probabilistic forecasts, with
interactive graphics. They are extracted from the ACEFA Awards 2026 talk, for
the Australia-Aotearoa Consortium for Epidemic Forecasting & Analytics (ACEFA).

### Structure

* Accuracy and precision
* Mean Absolute Error (MAE): compares forecast means with observed values
  * Definition
  * Interactive: absolute error of the forecast mean
* CRPS: compares forecast distributions with observed values
  * Definition
  * Interactive: expected error less half the expected spread
  * Interactive: area between the forecast CDF and the observation
* Why the CRPS is ideal for evaluating forecast accuracy

The interactive slides have sliders for the mean and standard deviation of a
Normal forecast, showing how each score responds.

### Rendering the slides

The slides are written with [Quarto](https://quarto.org), and the extensions
they use are included in this repository. Preview them with:

```bash
quarto preview
```

The interactive graphics load [D3](https://d3js.org) and
[Observable Plot](https://observablehq.com/plot/) from a CDN, so an internet
connection is needed to view them.

### Files

* `index.qmd`: the slides
* `d3/scores.js`: interactive MAE and CRPS graphics
* `theme/`: ACEFA slide styles, layouts and logos
* `figures/` and `backgrounds/`: images used in the slides
