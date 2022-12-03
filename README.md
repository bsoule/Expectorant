# Expectorant: the stochastic, nerdtastic, restaurant bill splitting app (and random number spinner)

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://github.com/codespaces/new?hide_repo_select=true&ref=master&repo=649443)


[instructions now in index.html]

## Hat tip

NB: The ingenious restaurant bill splitting algorithm was devised by Dave 
Pennock of, appropriately, oddhead.com.


---

## Dev notes from Glitch

# Expectorant


## The Math


## The Interface


## The Backstory


## Technical/Implementation Note

This is hosted on Glitch

## Changelog

<pre>
2022-10-23: Lets you enter a probability but doesn't do anything with it
2017-08-05: Dummy version on Glitch
2012-07-17: Messy Matters post
</pre>

new name idea: Bernoullinator

enter the probability, get a spinner with a green (yes/pay/high) section and a red (no/free/low) section and spin it to bernoullinate.

Original java code for the `@` and `:` syntactic sugar:

```
// Convert "t@a,b" to "((t)-(a))/((b)-(a))"
// Convert "s:a,b,c" (any # of comma-separated items) to "(c)/((s)-(a)-(b))"
static String preprocess(String s) {
  // "t @ a,b" -- t and a and b can be expressions
  if(s.matches("^[^\\@\\,\\:]+\\@[^\\@\\,\\:]+\\,[^\\@\\,\\:]+$"))
    s = s.replaceFirst(
          "^\\s*([^\\@\\,]+)\\s*\\@\\s*([^\\,]+)\\,([^\\,]+)\\s*$",
          "(($1)-($2))/(($3)-($2))");
    // "s : a,b,c,..." -- for dinner bill splitting
    else if(s.matches("^[^\\:\\,]+\\:[^\\:]+$")) {
      String[] ss = s.split("[\\:\\,]");
      int n = ss.length;
      s = "("+ss[n-1]+")/(("+ss[0]+")";
      if(n >= 3) {
        for(int i = 1; i <= n-3; i++) s += "-("+ss[i]+")";
        s += "-(" + ss[n-2] + ")";
      }
      s += ")";
    }
  return s;
}
```

OpenAI Codex's stab at converting that to Javascript:

```
function preprocess(s) {
  // "t @ a,b" -- t and a and b can be expressions
  if(s.match(/^[^@,:]+@[^@,:]+,[^@,:]+$/))
    s = s.replace(/^\s*([^@,]+)\s*@\s*([^,]+),([^,]+)\s*$/,
                  "(($1)-($2))/((($3)-($2)))");
  // "s : a,b,c,..." -- for dinner bill splitting
  else if(s.match(/^[^:,]+:[^:]+$/)) {
    var ss = s.split(/[:,]/);
    var n = ss.length;
    s = "("+ss[n-1]+")/("+ss[0];
    if(n >= 3) {
      for(var i = 1; i <= n-3; i++)  s += "-("+ss[i]+")";
      s += "-(" + ss[n-2] + ")";
    }
    s += ")";
  }
  return s;
}
```
