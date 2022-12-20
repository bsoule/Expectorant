/* Here we provide the following functions for spinning a spinner:
1. genslots: generate the list of slots aka pie slices
2. spinit: initialize spinner with a div and list of slots, return a spin object
3. spingo: make the spinner respresented by the given spin object start spinning
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

/* 
The following describes motion as a function of time, t, such that the
distance is 0 when t=0 and is B when t=T:

DIST:      (2*T*t - t^2) * B/T^2
SPEED:     2*B*(T-t)/T^2
INITSPEED: 2*B/T          (that's twice the average speed of B/T)

In other words, the speed drops linearly over an amount of time T covering a 
distance B. That's what a projectile thrown in the air does as it comes to a 
stop at the apex due to gravity.

But the following may be more suspenseful, with the spinner asymptotically 
coming to rest but never quite doing so, until the movement is imperceptible:

DIST:      B*(1 - d^(t/T))
SPEED:     -B/T * log(d) * d^(t/T)
INITSPEED: -B * log(d) / T

where d>0 is a parameter giving the tolerance -- something like 0.01 -- for how
close to B the distance function gets by time T. In other words, d is like the
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

// How far the spinner (spin object so) has spun in total degrees as of now
function dist(so) {
  const t = Date.now() - so.tini  // milliseconds since spinner started spinning
  const T = so.tdel               // total time the spinner is gonna spin
  const D = so.dtot               // total distance the spinner is gonna spin
  return (2*T*t - t**2) * D/T**2
}

// Stop a tiny bit before the real target so it snaps into place?
function totalRotation(duration, tini, startSpeed) {
  const tcur = tini + duration - 0.01
  return rotationFromTime(duration, tini, startSpeed, tcur)
}

// Compute rotation as a function of current time
function rotationFromTime(duration, tini, startSpeed, tcur) {
  tcur -= tini
  return -startSpeed/(2.5*duration)*(tcur-duration)**2 + startSpeed*duration/2.5
}

// I'm confused; time as a function of distance should be messier than this...
function timeFromRotation(duration, startSpeed, rotation) {
  return 2.5*rotation / startSpeed
}

// Derivative of the distance function
function speedFromTime(duration, tini, startSpeed, tcur) {
  tcur -= tini
  return 0.8 * startSpeed * (duration - tcur) / duration
}

// Execute the animation frame using css
function spin_anim(so) {
  if (so.speed < 0.01) { setTimeout(spinstop(so), 0); return true }
  const t = Date.now()
  so.speed = speedFromTime(so.duration, so.tini, so.spinSpeed, t)
  // The spin is being eased, but what we want is the current location
  so.degree = rotationFromTime(so.duration, so.tini, so.spinSpeed, t)
  so.obj.style.transform = `rotate(-${mod(so.degree, 360)}deg)`
	requestAnimFrame(() => spin_anim(so)) // curried version of spin_anim? why?
}

// Snap to the final destination (which should be close enough to where the 
// animation is that there's no visible snapping) and draw a bolder outline 
// around the winning pie slice.
function spinstop(so) {
  so.degree = totalRotation(so.duration, so.tini, so.spinSpeed)
  so.obj.style.transform = `rotate(-${mod(so.degree, 360)}deg)`
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
  
  // compute dtot
/*
  let [a, b] = [(win.kyoom - p) * 360, win.kyoom * 360]    // start & end angles
  const rangle = Math.random() * (b - a) + a  // random angle pointing to winner
  so.dtot = rangle + 0*360 // probably a few more extra spins than this?
  spin_anim(so)
  return
*/

  so.degree = 0
  so.obj.style.transform = `rotate(-${so.degree}deg)`
  so.tini = Date.now()
	so.rand_speed = Math.random()
  so.speed = so.spinSpeed
  so.duration = so.min_duration + 
                             (so.max_duration - so.min_duration) * so.rand_speed
  // Compute the total rotation, and figure out if it is landing on the winner.
  // If not, adjust the duration so that we do land on the winner by 
  // determining a position and then computing the time at that position and
  // updating the duration to match. This is not elegant.
  const win = so.slots[windex]
  const rotTot = totalRotation(so.duration, so.tini, so.spinSpeed)
  const oneRot = mod(rotTot, 360)
  // Figure out if we're already on the winner, or if we need to adjust
  const p = win.weight
  let [a, b] = [(win.kyoom - p) * 360, win.kyoom * 360]  // start & end angles
  if (oneRot < a || oneRot > b) {
    // Not inside the winner, so determine how much more we need by finding
    // a random value between start and end
    const rangle = Math.random() * (b - a) + a
    // Decide how much to add to oneRot to get to rangle, then do that to
    // rotTot instead, computing a duration that gets us to the new total.
    so.duration = timeFromRotation(so.duration, so.spinSpeed, 
                                                    rotTot + (rangle - oneRot))
  }
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
  // being the same thing, so adjust to 0 to 359.999 in that case.
  // But also for some buggy reason, things like .00001 degrees to 360 degrees
  // also break (?) so we're just drawing basically the whole circle if a pie
  // slice is close enough to p=1.
  if (p > 1-1e-4) { a = 0; b = 360 - 1e-4 }
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
  tini:   Date.now(),             // initial timestamp, when spinning starts
  tdel:   4500,                   // total duration of the spin, in milliseconds
  dtot:   -1,                     // total distance in degrees it's gonna spin
  dcur:   0,                      // current distance in degrees it has spun
  // ------------------------ we should be able to get rid of everything below
  speed: 0,
  spinSpeed: 1,
  degree: 0,
  min_duration: 3000,
  max_duration: 5000,
  rand_speed: 0,
  duration: 0,
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
