const CLOG = console.log // convenience function

// Shortcut to get the best animationFrame function
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function(callback) { window.setTimeout(callback, 1000 / 60) }
})()

// Keep degrees in [0, 360)
function filter_degree(d) {
  const rem = d % 360 // Javascript's % operator is not mod but remainder :(
  return rem >= 0 ? rem : rem + 360
}

// Convert Polar to Cartesian coordinates
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = (angleInDegrees-90) * Math.PI / 180.0
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians)),
  }
}

// Draw a pie slice that is one section of the spinner
function arcPath(x, y, radius, endradius, startAngle, endAngle) {
  const start  = polarToCartesian(x, y, radius, endAngle)
  const end    = polarToCartesian(x, y, radius, startAngle)
  const start2 = polarToCartesian(x, y, endradius, endAngle)
  const end2   = polarToCartesian(x, y, endradius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"
  const d = [
    "M", start.x, start.y, 
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    "L", end2.x, end2.y,
    "A", endradius, endradius, 0, largeArcFlag, 1, start2.x, start2.y,
    "Z",
  ].join(" ")
  return d
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

function computeRotation(duration, startTime, startSpeed, currentTime) {
  const t = currentTime - startTime
  return startSpeed * 
    (2*duration*Math.cos((Math.PI*t)/(2*duration))/Math.PI + duration + t) - 
      startSpeed * duration * (2/Math.PI + 1)
}

function computeSpeed(duration, startTime, startSpeed, currentTime) {
  const t = currentTime - startTime
  return -Math.cos((1 - t/duration) * Math.PI/2)*startSpeed + startSpeed
}
*/

// Stop a tiny bit before the real target so it snaps into place?
function computeTotalRotation(duration, startTime, startSpeed) {
  const currentTime = startTime + duration - 0.01
  return computeRotation(duration, startTime, startSpeed, currentTime)
}

// Compute rotation as a function of current time
function computeRotation(duration, startTime, startSpeed, currentTime) {
  const t = currentTime - startTime
  return -startSpeed/(2.5*duration)*(t-duration)**2 + startSpeed*duration/2.5
  const T = duration
  const B = startSpeed*T/2 // implies startSpeed = 2*B/T
  return (2*T*t - t**2) * B/T**2
  // ORIG: -startSpeed/(2.5*duration)*(t-duration)**2 + startSpeed*duration/2.5
}

// I'm confused; time as a function of distance should be messier than this...
function computeTimeFromRotation(duration, startSpeed, rotation) {
  return 2.5*rotation / startSpeed
  const T = duration
  const B = startSpeed*T/2
  return T + T/B*Math.sqrt(B*(B-rotation))
  // ORIG: 2.5*rotation / startSpeed
}

// Derivative of the distance function
function computeSpeed(duration, startTime, startSpeed, currentTime) {
  const t = currentTime - startTime
  return 0.8 * startSpeed * (duration - t) / duration
  const T = duration
  const B = startSpeed*T/2
  return 2*B*(T-t)/T**2
  // ORIG: 0.8 * startSpeed * (duration - t) / duration
}

// Execute the animation frame using css
let spin_anim = function(spin) {
  if (spin.speed < 0.01) {
    setTimeout(spin_stop(spin), 0)
    return true
  }
  const t = (new Date()).getTime()
  spin.speed = computeSpeed(spin.duration, spin.startTime, spin.spinSpeed, t)
  // the spin is being eased, but what we want is the current location
  spin.degree = computeRotation(spin.duration, spin.startTime,spin.spinSpeed,t)
	spin.degree = filter_degree(spin.degree)
	spin.obj.css('transform', `rotate(-${spin.degree}deg)`)
  // curry this.
  const sa = () => { spin_anim(spin) }
	requestAnimFrame(sa)
}

// Start the spinner
// spin is the spin object, winner is the index of the slot that will win.
function spin_start(spin, winner) {
  // Reset to zero
  spin.degree = 0
  spin.winner = winner
  spin.obj.css('transform', `rotate(-${spin.degree}deg)`)
  spin.startTime = (new Date()).getTime()
  // start the spinner
	spin.rand_speed = Math.random()
  spin.speed = spin.spinSpeed
  spin.duration = spin.min_duration + 
    (spin.max_duration - spin.min_duration) * spin.rand_speed

  // Compute the total rotation, and figure out if it is landing on the winner.
  // If not, adjust the duration so that we do land on the winner by 
  // determining a position and then computing the time at that position and
  // updating the duration to match.

  // 1 - Figure out the min and max angle/rotation for the winner
  //console.log(
  //  `DEBUG: winner = ${winner} (0-based) of ${spin.slots.length} slots`)
  const win = spin.slots[winner] //start/endAngle.
  // 2 - Compute the rotation angles for the given duration
  const rotationTot = 
    computeTotalRotation(spin.duration, spin.startTime, spin.spinSpeed)
  const oneRot = filter_degree(rotationTot)
  // 3 - Figure out if we're already there, or if we need to move things around
  if (oneRot < win.startAngle || oneRot > win.endAngle) {
    // not inside the winner, so determine how much more we need by finding
    // a random value between start and end
    const ranAngle = 
      Math.random() * (win.endAngle - win.startAngle) + win.startAngle
    // decide how much to add to oneRot to get to ranAgnle, then do that to
    // rotationTot instead
    const newTot = rotationTot + (ranAngle - oneRot)
    // newTot should now be valid, so we need to compute a duration that can 
    // get us to this total.
    // Hmm, but shouldn't duration always be the length of the sound clip?
    const newTime = 
      computeTimeFromRotation(spin.duration, spin.spinSpeed, newTot)
    spin.duration = newTime
  }
	spin_anim(spin)
}

// Stop the spinner
function spin_stop(spin) {
  // compute where it is supposed to be and snap it there
  // this shouldn't be more than a degree or two off from the animation.
  const rotationTot = 
    computeTotalRotation(spin.duration, spin.startTime, spin.spinSpeed)
  spin.degree = filter_degree(rotationTot)
  spin.obj.css('transform', `rotate(-${spin.degree}deg)`);
  // The winner is the index of the slot that wins, so we want to figure out
  // what slot that is, and draw a new outline pie over it to show that's the 
  // winner!

  // TODO: handle the case where the prob is 1 (we have to draw a circle 
  // instead of an arc?)
  const total_weight = spin.slots.map(i => i.weight).reduce((p,c) => p+c)
  const normals = spin.slots.map(i => i.weight / total_weight)
  const startAngle = 0
  let svg = spin.obj.html()
  const win = spin.slots[spin.winner]
  svg += `<path d="${arcPath(50,50, 5, 50, win.startAngle, win.endAngle)}"\
                fill="#00000000" \
                stroke="#ffffff" \
                stroke-width="2" />`
  spin.obj.html(svg)
}

function setSpinnerNaN(spin) {
  const slots = compute2Slots(1)
  slots[0].color = "black"
  slots[0].value = "🍌" // could use a confused-emoji instead?
  updateSpinner(spin, slots)
}

function redrawSpinner(spin) {
  // draw the spinner
  const total_weight = spin.slots.map(i => i.weight).reduce((p,c) => p+c)
  const normals = spin.slots.map(i => i.weight / total_weight)
  const textOffset = spin.slots.length <= 4 ? 35 : 45

  let svg = ''
  // check to see if one of the normals is at 1, if it is we want to draw the 
  // special case for just that index (i).
  const iAtOne = normals.findIndex((i) => i == 1)
  if (iAtOne > -1) {
    // we are drawing wedges with arcs, and arcs can't draw full circles, so if
    // we are in the special case of one item has full probability (360 deg)
    // then we have to opt out of the arc and draw a circle.
    svg += 
      '<circle cx="50" cy="50" r="50" fill="'+spin.slots[iAtOne].color+'"/>' +
      '<circle cx="50" cy="50" r="5" fill="white"/>'
    const t = polarToCartesian(50, 50, textOffset, 0)
    svg += '<text font-size="10" x="' + t.x + '" y="' + t.y + 
      '" fill="#000000" font-style="bold" font-family="Arial" alignment-baseline="central" text-anchor="middle" transform="rotate(' + 
      (0) + ' ' + t.x + ',' + t.y + 
      ')" stroke="#000000" stroke-width="1" opacity="0.3">' + 
      spin.slots[iAtOne].value + '</text>'
    svg += '<text font-size="10" x="' + t.x + '" y="' + t.y + 
      '" fill="#ffffff" font-style="bold" font-family="Arial" alignment-baseline="central" text-anchor="middle" transform="rotate(' + 
      (0) + ' ' + t.x + ',' + t.y + ')">' + 
      spin.slots[iAtOne].value + '</text>'

    spin.obj.html( svg )
    return spin
  }
  // draw the pie parts
  let startAngle = 0
  for (let i=0; i<spin.slots.length; i++) {
    const endAngle = startAngle + 360*normals[i]
    spin.slots[i]["startAngle"] = startAngle
    spin.slots[i]["endAngle"] = endAngle
    svg += '<path d="' + arcPath(50,50, 5, 50, startAngle, endAngle) + 
      '" fill="' + spin.slots[i].color + 
      '" stroke="#ffffff" stroke-width="0" />'
    startAngle = endAngle
  }
  // draw the text on top of the pie parts
  for (let i=0; i<spin.slots.length; i++) {
    const endAngle = startAngle + 360*normals[i]
    // compute the location of the text
    const midAngle = startAngle + (endAngle - startAngle)/2
    const t = polarToCartesian(50, 50, textOffset, midAngle)
    svg += '<text font-size="6" x="' + t.x + '" y="' + t.y + 
      '" fill="#000000" font-style="bold" font-family="Arial" alignment-baseline="central" text-anchor="middle" transform="rotate(' + 
      midAngle + ' ' + t.x + ',' + t.y + 
      ')" stroke="#000000" stroke-width="1" opacity="0.3">' + 
      spin.slots[i].value + '</text>'
    svg += '<text font-size="6" x="' + t.x + '" y="' + t.y + 
      '" fill="#ffffff" font-style="bold" font-family="Arial" alignment-baseline="central" text-anchor="middle" transform="rotate(' + 
      midAngle + ' ' + t.x + ',' + t.y + ')">' + 
      spin.slots[i].value + '</text>'
    startAngle = endAngle
  }
  spin.obj.html( svg )

  return spin
}

function updateSpinner(spin, slots) {
  spin.slots = slots
  if (spin.slots.length < 2) throw "You must specify at least two options"
  return redrawSpinner(spin)
}

function spinner(div, slots) {
  // create an svg directly in the div 
  div.append('<svg xmlns="http://www.w3.org/2000/svg" class="spin" width="100%" height="100%" viewbox="0 0 100 100"></svg>')

  // generate the spin object
  const spin = {
    slots: slots,
    speed: 0,
    spinSpeed: 1,
    degree: 0,
    obj: div.children("svg"),
    min_duration: 3000,
    max_duration: 5000,
    rand_speed: 0,
    duration: 0,
    winner: -1,
    startTime: (new Date()).getTime(),
  }

  updateSpinner(spin, slots)
  return spin
}

function percentify(x) { return Math.round(100*x) + "%" }

// computes two slots given a probability
function compute2Slots(p) {
  if (p < 0 || p > 1) throw "Probability must be between 0 and 1"
  return [
    // Or we could label the slices with 'YES/💰/⬆️' and 'NO/🆓/⬇️'
    { value: percentify(p),   color: 'green', weight: p   },
    { value: percentify(1-p), color: 'red',   weight: 1-p },
  ]
}

window.spinner = {
  create: spinner,
  start: spin_start,
  compute2Slots: compute2Slots,
  update: updateSpinner,
  setNaN: setSpinnerNaN,
  redraw: redrawSpinner,
}