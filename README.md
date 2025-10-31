# Expectorant: the stochastic, nerdtastic, restaurant bill splitting app (and random number spinner)

Expectorant is online for all your stochastic bill splitting and repayment needs:
[expectorant.yootl.es](https://expectorant.yootl.es "Hosted on Render.com currently but probably GitHub Pages would make more sense").

Read more about it there.

## Changelog

<pre>
2025-10-31: Bugfix with leading zeros causing numbers to get parsed as octal
2025-10-30: Some little tweaks like hover text and improve the README
2025-03-15: Play w/ easter egg salad and get off Replit
2022-12-30: Easter egg salad, long story
2022-12-29: Lots of fussing and tweaking
2022-12-23: Better rounding and other polishing
2022-12-21: Polished up, better colors, better easing function for the spinner
2022-12-04: A spinner!
2022-10-23: Lets you enter a probability but doesn't do anything with it
2017-08-05: Dummy version on Glitch
2012-07-17: Messy Matters post
2011-02-07: Last update of the Android app on Google Play
2010-05-10: Android app released on whatever Google Play was called back then
</pre>

## Musing and Notes

New name idea: Bernoullinator? 
Cuz it does Bernoulli trials? 
Then instead of "expectorize" it'd be "bernoullinate". 
Pretty fun to say!
But it seems "Expectorant" was pretty sticky, so to speak.

Idea: If you enter a list of things with probabilities or weights, it makes a
multi-outcome spinner for them.
You could even make the restaurant bill-splitting algorithm intuitive for 
normal people by picking a couple entrees and spinning between them plus a big
slice of the pie chart for "everything else".
Like for a $300 restaurant bill including a $25 steak and a $50 bottle of wine,
you could enter something like:
  [steak:25/300, wine:50/300, misc:(300-50-25)/300]
and then if misc wins, you effectively zoom in on that pie slice and repeat with
a few more items from the bill, using the remaining subtotal as the denominator.

I guess really the restaurnt bill splitting use case just wants a whole
dedicated UI where you're prompted for the subtotal plus as many 
easy-to-identify items on the bill as you care to specify.
Then you get a spinner and if the "misc" option comes up, the previously 
identified items are crossed out, the remaining subtotal is shown, and you're 
prompted to identify more items from the bill.
Repeat till an explicitly identified item is chosen so whoever got that item can
pay the whole bill.

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://github.com/codespaces/new?hide_repo_select=true&ref=master&repo=649443)
