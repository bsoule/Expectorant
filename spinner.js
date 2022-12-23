/* Here we provide the following functions for visually spinning a spinner:
1. genslots: generate the list of slots aka pie slices
2. spinit: initialize spinner with a div and list of slots, return a spin object
3. spingo: set the target and start spinning
4. spindraw: draw or redraw the spinner for the given spin object

Some of this code is based on http://jsfiddle.net/PhilQ/c5etdjro/8/ but we made
it way better.
*/

// Config constants; see also ease() to pick the easing function
const DROT = 4        // number of extra full rotations before landing on winner
const KEXP = .001/3   // exponential decay parameter
const KBER = .96      // Bernoulli (different Bernoulli, probably) parameter
const KPOL = 3.7      // parameter giving the polynomial degree
const BOOP = 4400   // length of the audio clip in milliseconds
const SUSP = 500  // extra milliseconds after beep-boop stops till spinner stops
const YAYCOLOR = 'hsl(159deg 53% 28%)' // green for YES pie slice
const NAYCOLOR = 'hsl(356deg 70% 51%)' // red for NO pie slice

const SVGcX = 50 // x,y coordinates of the center of the spinner
const SVGcY = 50
const SVGr1 = 5  // radius of the little knob at the center of the spinner
const SVGr2 = 50 // radius of the whole spinner

// -----------------------------------------------------------------------------

const max = Math.max
const min = Math.min
const abs = Math.abs
const sin = Math.sin
const cos = Math.cos
const TAU = 2*Math.PI
const sqrt = Math.sqrt
const pow = Math.pow // or use the ** operator

// Shortcut to get the best animationFrame function
window.requestAnimFrame = (function() {
  return window.requestAnimationFrame       ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame    ||
         function(callback) { window.setTimeout(callback, 1000 / 60) }
})()

// Easing function ie normalized distance: d from 0 to 1 as t goes from 0 to 1.
// See the bottom of this file for more on the math of this.
function ease(t) {
  //return t                   // linear / constant velocity (looks horrible)
  //return t*(2-t)             // constant acceleration (like gravity!)
  //return 1-KEXP**(t)         // exponential decay, never quiiiiite stops
  //return sin(t*TAU/4)        // what the spinner we found on the internet used
  return 1-(1-t)**KPOL       // KPOL=2 is quadratic, 3 is cubic, etc
  //return sqrt(1-(1-t)**2)    // circular easing function, why not
  //return t**.2               // power easing function
  //return t*KBER/(1-t+KBER*(2*t-1)) // Bernoulli easing function  
  //return 2**(-10*t)*sin((t*10-0.75)*TAU/3)+1    // bouncy!
  //return t<0.5 ? 8*t**4 : 1-pow(-2*t+2, 4)/2 // easeInOutQuart
  //return t<0.5 ? 2*t**2 : 1-pow(-2*t+2, 2)/2 // easeInOutQuad
}

// Total degrees the spinner spins by time t if it does D by time T
function dist(t, T, D) { return D*ease(t/T) }

// Javascript's % operator is not actually mod but remainder so we have to
// force it to be positive. We use this to keep degrees in [0, 360).
function mod(x, m) { return (x % m + m) % m }

// Take an x,y point, an angle in degrees d measuring counterclockwise from 
// 12'o'clock (straight up), and radius r; return the x,y coordinates of the
// point r units from x,y in direction d.
function polarcart(x, y, r, d) {
  const theta = (d-90)/360*TAU // angle in radians
  return { x: x + (r * cos(theta)),
           y: y + (r * sin(theta)) }
}

// Draw a pie slice from angle a to angle b
function arcPath(a, b) {
  // Call the intermediate points a1, a2, b1, b2 where the a's are at angle a
  // the b's are at angle b and the 1's are at the inner radius and the 2's are
  // at the outer radius. Eg, b1 is the point at angle b at the inner radius.
  const a1 = polarcart(SVGcX, SVGcY, SVGr1, a)
  const a2 = polarcart(SVGcX, SVGcY, SVGr2, a)
  const b1 = polarcart(SVGcX, SVGcY, SVGr1, b)
  const b2 = polarcart(SVGcX, SVGcY, SVGr2, b)
  const larc = b - a <= 180 ? "0" : "1" // large arc flag
  ASSERT(!isNaN(b1.x) && !isNaN(b2.x) && !isNaN(a1.x) &&! isNaN(a2.x),
    `arcPath(${a}, ${b})`)
  return [
    "M", b1.x, b1.y,                      // move to angle b at the inner radius
    "A", SVGr1,SVGr1, 0, larc, 0, a1.x,a1.y,  // arc to angle a at inner radius
    "L", a2.x, a2.y,                          // line to angle a at outer radius
    "A", SVGr2,SVGr2, 0, larc, 1, b2.x,b2.y,  // arc to angle b at outer radius
    "Z",                                      // close the path, ending at b1
  ].join(' ')
}

// Execute the animation frame using css
function spinanimate(spob) {
  const t = Date.now()
  if (t >= spob.tini + spob.ttot) { setTimeout(spinstop(spob), 0); return true }
  spob.dcur = dist(t-spob.tini, spob.ttot, spob.dtot)
  spob.domo.style.transform = `rotate(-${mod(spob.dcur, 360)}deg)`
	requestAnimFrame(() => spinanimate(spob)) // curry the spin object
}

// Snap to the final destination (which should be close enough to where the 
// animation is that there's no visible snapping) and draw a bolder outline 
// around the winning pie slice.
function spinstop(spob) {
  spob.domo.style.transform = `rotate(-${mod(spob.dtot, 360)}deg)`
  const win = spob.slots[spob.windex]
  const p = win.weight
  let [a, b] = [(win.kyoom - p) * 360, win.kyoom * 360]  // start & end angles
  if (p > 1-1e-4) { a = 0; b = 360 - 1e-4 }
  spob.domo.innerHTML += `<path d="${arcPath(a, b)}" ` +
                           `fill="#00000000" stroke="white" stroke-width="2" />`
}

// Set the winner and start spinning the given spinner object
function spingo(spob, windex) {
  ASSERT(windex >= 0 && windex < spob.slots.length, 
    `Can't take slot ${windex} of ${JSON.stringify(spob.slots)}`)
  spob.windex = windex
  spob.tini = Date.now()
  const win = spob.slots[windex]
  const p = win.weight
  let [a, b] = [(win.kyoom - p) * 360, win.kyoom * 360]    // start & end angles
  const rangle = Math.random() * (b - a) + a  // random angle pointing to winner
  spob.dtot = rangle + DROT*360   // a bunch of extra rotations; adjust to taste
  spinanimate(spob)
}

// Take the weight (probability) of the pie slice and make the font blurb
function fontblurb(x) {
  const MAXF = 16            // biggest font size that looks good on the spinner
  const fs = min(MAXF, max(0, x*100 - 1))  // eg, p=10% displayed at font size 9
  return `font-family="Arial" font-style="bold" font-size="${fs}" `
}

// Take a slot object and generate the svg blurb
function arcblurb(slot) {
  //CLOG(`DEBUG: arcblurb slot=${JSON.stringify(slot)}`)
  const p = slot.weight                        // probability ie fraction of pie
  let [a, b] = [(slot.kyoom - p) * 360, slot.kyoom * 360]  // start & end angles
  // Things break if we try to draw an arc from exactly 0 to 360 degrees, those
  // being the same thing, so adjust to like 0 to 359.999 in that case.
  // But also for some buggy reason, things like .00001 degrees to 360 degrees
  // also break (?) so we're just drawing basically the whole circle if a pie
  // slice is close enough to p=1.
  if (p > 1-1e-4) { a = 0; b = 360 - 1e-4 } // breaks a bit if that 1e-4 is 1e-5
  return `<path d="${arcPath(a, b)}" fill="${slot.color}" />`
  // PS: we can just make a 0-359.9 degree arc so no need for this special case:
  // `<circle cx="${SVGcX}" cy="${SVGcY}" r="${SVGr1}"  fill="white"/>` +
  // `<circle cx="${SVGcX}" cy="${SVGcY}" r="${SVGr2}" fill="${color}"/>`
}

// Take angle in degrees and x,y coordinates, return svg blurb for the rotation
function rotateblurb(d, x, y) { return `transform="rotate(${d}, ${x}, ${y})"` }

// Draw or redraw the given spin object
function spindraw(spob) {
  //const totweight = spob.slots.reduce((a, b) => a + b.weight, 0)
  //ASSERT(abs(totweight-1) < 1e-9, `Slot weights sum to ${totweight} not 1`)
  const textRadius = spob.slots.length <= 4 ? 35 : 45
  let svg = ''
  for (let i = 0; i < spob.slots.length; i++) {
    const p = spob.slots[i].weight                   // probability of this slot
    const a = (spob.slots[i].kyoom - p/2) * 360             // middle of the arc
    const tc = polarcart(SVGcX, SVGcY, textRadius, a)       // text coords
    svg += arcblurb(spob.slots[i]) +
           `<text x="${tc.x}" y="${tc.y}" fill="white" ` + fontblurb(p) +
                  'alignment-baseline="central" text-anchor="middle" ' +
                  `${rotateblurb(a, tc.x, tc.y)}>${spob.slots[i].value}</text>`
  }
  spob.domo.innerHTML = svg
}

// Initialize and return a fresh spinner object
function spinit(div, slots) { return {
  domo:   div.querySelector('svg'), // DOM object for the spinner
  slots:  slots,                    // list of slots (see genslots)
  windex: -1,                       // index of the winning slot
  tini:   -1,                       // initial timestamp, when spinning starts
  ttot:   BOOP+SUSP,                // spin duration (ms); adjust to taste
  dtot:   -1,                       // total distance in degrees it's gonna spin
  dcur:   0,                        // current distance in degrees it has spun
}}

// Generate a list of slots from a probability (just need one probability for
// two slots) or a list of probabilities that sum to one.
// For the case of 2 slots in Expectorant, the first slot is for
// yes/pay/high/green and the second is for no/free/low/red.
function genslots(p) {
  if (Array.isArray(p)) { 
    ASSERT(false, "More than 2 slots not supported yet")
    return null
  }
  if (!(p >= 0 && p <= 1)) {
    return [
      { value: "🍌", weight: 1, kyoom: 1, color: 'black' }, // Obviously we'll
      { value: "🍒", weight: 0, kyoom: 1, color: 'taupe' }, // never see the 🍒
    ]
  }
  return [
    { value: percentify(p),   weight: p,   kyoom: p, color: YAYCOLOR },
    { value: percentify(1-p), weight: 1-p, kyoom: 1, color: NAYCOLOR },
  ]  
}

// -----------------------------------------------------------------------------

/* THE MATH
None of this is specific to a spinning spinner, we just treat total degrees 
traveled as a distance metric. Typically the spinner makes several full
rotations so that just means the total distance traveled is more than a few
multiples of 360. The constraint for the spinner is that we stop the animation
when the velocity (that's the derivative of the distance function) hits zero.

Here's the distance function for a projectile starting at distance 0:

dist(t) = v0*t + 1/2*a*t^2

where v0 is the initial velocity and a is the acceleration.

Now add two constraints: 

1. After a known amount of time T we reach a known distance D
2. The velocity is zero at time T

That's what we want for our spinner. We decide where we want it to land which
implies a total distance it will travel (throw in a few extra full rotations
for suspensefulness) and we want it to come to rest when the beep-boop sound
effect stops.

Writing those constraints as equations gives this:

1. D = v0*T + 1/2*a*T^2
2. v0 + a*t = 0

So we just solve those for initial velocity v0 and acceleration a in terms of
the known values D and T. Algebra algebra, and:

v0 = 2*D/T
a = -2*D/T^2

Now we put those into our distance equation to get distance in terms of just 
the things we know:

dist(t) = 2*D/T * t - D/T^2 * t^2

We don't need the velocity explicitly but here it is, just differentiating
distance with respect to time:

velo(t) = 2*D/T - 2*D/T^2 * t

Another random thing to notice is that the average speed is D/T and the initial
speed is 2*D/T and of course the final speed is 0. In other words, the speed
drops linearly over an amount of time T covering a distance D.

But now let's consider more suspenseful distance functions! Here's one where the
spinner asymptotically comes to rest but never quite does so, until the movement
is imperceptible:

dist(t) = D*(1 - k^(t/T))
velo(t) = -D/T * log(k) * k^(t/T)

where k>0 is a parameter giving the tolerance -- something like 0.01 -- for how
close to D the distance function gets by time T. In other words, k is like the
tolerance on what counts as stopped.

PS: It's easier to do all of the above where T=1 and D=1 and then just rescale.
So if we have a normalized distance function d(t) that hits distance 1 at time 1
then we can just do D*d(t/T) to get the version that hits distance D at time T.
The (0,0) to (1,1) version is called an easing function and there's a nice 
library of ones to try at easings.net.
*/
