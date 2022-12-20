/* Here we provide the following functions for spinning a spinner:
1. genslots: generate the list of slots aka pie slices
2. spinit: initialize spinner with a div and list of slots, return a spin object
3. spingo: set the target and start spinning
4. spindraw: draw or redraw the spinner for the given spin object
*/

// -----------------------------------------------------------------------------
const max = Math.max
const min = Math.min
const abs = Math.abs
const sin = Math.sin
const cos = Math.cos
const TAU = 2*Math.PI

// Shortcut to get the best animationFrame function
window.requestAnimFrame = (function() {
  return window.requestAnimationFrame       ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame    ||
         function(callback) { window.setTimeout(callback, 1000 / 60) }
})()

// Javascript's % operator is not actually mod but remainder so we have to
// force it to be positive. We use this to keep degrees in [0, 360).
function mod(x, m) { return (x % m + m) % m }

// Convert Polar to Cartesian coordinates
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = (angleInDegrees-90)/360*TAU
  return { x: centerX + (radius * cos(angleInRadians)),
           y: centerY + (radius * sin(angleInRadians)) }
}

// Draw a pie slice that is one section of the spinner
function arcPath(x, y, radius, endradius, startAngle, endAngle) {
  const start  = polarToCartesian(x, y, radius, endAngle)
  const end    = polarToCartesian(x, y, radius, startAngle)
  const start2 = polarToCartesian(x, y, endradius, endAngle)
  const end2   = polarToCartesian(x, y, endradius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"
  ASSERT(!isNaN(start.x) && !isNaN(start2.x) && !isNaN(end.x) &&! isNaN(end2.x),
    `arcPath(${x}, ${y}, ${radius}, ${endradius}, ${startAngle}, ${endAngle})`)
  return [
    "M", start.x, start.y, 
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    "L", end2.x, end2.y,
    "A", endradius, endradius, 0, largeArcFlag, 1, start2.x, start2.y,
    "Z",
  ].join(' ')
}

// Total degrees the spinner spins by time t if it does D by time T
// (See the end of this file for the math of this)
function dist(t, T, D) {
  //return D/T * t // constant velocity (simplest but doesn't look good)
  //return 2*D/T * t - D/T**2 * t**2  // constant acceleration (like gravity!)
  //return D*(1 - 0.0002**(t/T)) // exponential decay, never quiiiiite stops
  return D*sin(t*TAU/4/T) // sine-based easing like we found on the internet
}

// Execute the animation frame using css
function spin_anim(so) {
  const t = Date.now()
  if (t >= so.tini + so.tdel) { setTimeout(spinstop(so), 0); return true }
  so.dcur = dist(t-so.tini, so.tdel, so.dtot)
  so.obj.style.transform = `rotate(-${mod(so.dcur, 360)}deg)`
	requestAnimFrame(() => spin_anim(so)) // curried version of spin_anim? why?
}

// Snap to the final destination (which should be close enough to where the 
// animation is that there's no visible snapping) and draw a bolder outline 
// around the winning pie slice.
function spinstop(so) {
  so.obj.style.transform = `rotate(-${mod(so.dtot, 360)}deg)`
  const win = so.slots[so.windex]
  const p = win.weight
  let [a, b] = [(win.kyoom - p) * 360, win.kyoom * 360]  // start & end angles
  if (p > 1-1e-4) { a = 0; b = 360 - 1e-4 }
  so.obj.innerHTML += `<path d="${arcPath(50,50, 5, 50, a, b)}" ` +
                           `fill="#00000000" stroke="white" stroke-width="2" />`
}

// Set the winner and start spinning the given spinner object
function spingo(so, windex) {
  ASSERT(windex >= 0 && windex < so.slots.length, 
    `Can't take slot ${windex} of ${JSON.stringify(so.slots)}`)
  so.windex = windex
  so.tini = Date.now()
  const win = so.slots[windex]
  const p = win.weight
  let [a, b] = [(win.kyoom - p) * 360, win.kyoom * 360]    // start & end angles
  const rangle = Math.random() * (b - a) + a  // random angle pointing to winner
  so.dtot = rangle + 5*360 // a bunch of extra rotations; adjust to taste
  spin_anim(so)
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
  return `<path d="${arcPath(50,50, 5,50, a, b)}" fill="${slot.color}" />`
  // PS: we can just make a 0-359.9 degree arc so no need for this special case:
  // `<circle cx="50" cy="50" r="50" fill="${color}"/>` +
  // `<circle cx="50" cy="50" r="5"  fill="white"/>`
}

// Take angle in degrees and x,y coordinates, return svg blurb for the rotation
function rotateblurb(d, x, y) { return `transform="rotate(${d}, ${x}, ${y})"` }

// Draw or redraw the given spin object
function spindraw(so) {
  //const totweight = so.slots.reduce((a, b) => a + b.weight, 0)
  //ASSERT(abs(totweight-1) < 1e-9, `Slot weights sum to ${totweight} not 1`)
  const textOffset = so.slots.length <= 4 ? 35 : 45
  let svg = ''
  for (let i = 0; i < so.slots.length; i++) {
    const p = so.slots[i].weight                     // probability of this slot
    const a = (so.slots[i].kyoom - p/2) * 360               // middle of the arc
    const tc = polarToCartesian(50, 50, textOffset, a)      // text coords
    svg += arcblurb(so.slots[i]) +
           `<text x="${tc.x}" y="${tc.y}" fill="white" ` + fontblurb(p) +
                  'alignment-baseline="central" text-anchor="middle" ' +
                  `${rotateblurb(a, tc.x, tc.y)}>${so.slots[i].value}</text>`
  }
  so.obj.innerHTML = svg
}

// Initialize and return a fresh spinner object
function spinit(div, slots) { return {
  obj:    div.querySelector('svg'),
  slots:  slots,                  // list of slots (see genslots)
  windex: -1,                     // index of the winning slot
  tini:   -1,                     // initial timestamp, when spinning starts
  tdel:   4400+500,               // spin duration (ms); adjust to taste
  dtot:   -1,                     // total distance in degrees it's gonna spin
  dcur:   0,                      // current distance in degrees it has spun
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
    { value: percentify(p),   weight: p,   kyoom: p, color: 'green' },
    { value: percentify(1-p), weight: 1-p, kyoom: 1, color: 'red'   },
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
speed is 2*D/T and of course the final speed is 0.

In other words, the speed drops linearly over an amount of time T covering a 
distance D.

But now let's consider more suspenseful distance functions! Here's one where the
spinner asymptotically comes to rest but never quite does so, until the movement
is imperceptible:

dist(t) = D*(1 - k^(t/T))
velo(t) = -D/T * log(k) * k^(t/T)

where k>0 is a parameter giving the tolerance -- something like 0.01 -- for how
close to D the distance function gets by time T. In other words, k is like the
tolerance on what counts as stopped.


And for posterity, here's a sine-based easing function we found on the internet
but it's pretty annoying to work with:

function rotationFromTime(duration, tini, startSpeed, tcur) {
  const t = tcur - tini
  return startSpeed * 
    (duration*cos(TAU/4 * t / duration)/(TAU/4) + duration + t) - 
      startSpeed * duration * (4/TAU + 1)
}

function speedFromTime(duration, tini, startSpeed, tcur) {
  const t = tcur - tini
  return -cos((1 - t/duration) * TAU/4) * startSpeed + startSpeed
}
*/
