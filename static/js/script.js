/*
 *  JumpOff JavaScript Boids
 *
 *  Copyright 2017, JumpOff, LLC
 *  Github:  https://github.com/jqlee85/boids
 *  Author: JumpOff, LLC
 *  Author URL: https://jumpoff.io
 *
 *  License: WTFPL license
 *  License URL: http://sam.zoy.org/wtfpl/
 *
 *  Version: 1.0
 */

/*---- Global Setup ----*/

// Set up canvas
const canvas = document.getElementById('boids');
const c = canvas.getContext('2d');

// Get Firefox
var browser=navigator.userAgent.toLowerCase();
if(browser.indexOf('firefox') > -1) {
  var firefox = true;
}

// Detect Mobile
var mobile = ( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) ? true : false;

// Set Size
var size = {
  width: window.innerWidth || document.body.clientWidth,
  height: window.innerHeight || document.body.clientHeight
}
canvas.width = size.width;
canvas.height = size.height;
var center = new Victor( size.width / 2 ,size.height / 2 );

// Initialize Mouse
var mouse = {
  position: new Victor( innerWidth / 2, innerHeight / 2 )
};

/*---- end Global Setup ----*/

/*---- Helper Functions ----*/

/**
 * Returns a random int between a min and a max
 *
 * @param  int | min | A minimum number
 * @param  int | max | A maximum number
 * @return int | The random number in the given range
 */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Returns the distance between two coordinates
 *
 * @param  int | x1 | Point 1's x coordinate
 * @param  int | y1 | Point 1's y coordinate
 * @param  int | x2 | Point 2's x coordinate
 * @param  int | y2 | Point 2's y coordinate
 * @return int | The distance between points 1 and 2
 */
function getDistance(x1, y1, x2, y2) {
  var xDist = x2 - x1;
  var yDist = y2 - y1;
  return Math.sqrt( Math.pow(xDist, 2) + Math.pow(yDist, 2) );
}

/**
 * Returns a random color from the colors array
 *
 * @param  array | colors | An array of color values
 * @return string | The random color value
 */
function randomColor(colors) {
  return colors[ Math.floor( Math.random() * colors.length) ];
}

/**
 * Get coefficients based on normal distribution
 *
 * @param  int | mean | The mean value of the data set
 * @param  int | stdev | The standard deviation for the data set
 * @return int | A number from the data set
 */
function gaussian(mean, stdev) {
    var y2;
    var use_last = false;
    return function() {
        var y1;
        if(use_last) {
           y1 = y2;
           use_last = false;
        }
        else {
            var x1, x2, w;
            do {
                 x1 = 2.0 * Math.random() - 1.0;
                 x2 = 2.0 * Math.random() - 1.0;
                 w  = x1 * x1 + x2 * x2;
            } while( w >= 1.0);
            w = Math.sqrt((-2.0 * Math.log(w))/w);
            y1 = x1 * w;
            y2 = x2 * w;
            use_last = true;
       }

       var retval = mean + stdev * y1;
       if(retval > 0)
           return retval;
       return -retval;
   }
}
var getCoefficient = gaussian(50, 9);
var getQuicknessCoefficient = gaussian(75,7.5);

/**
 * Add Limit Magnitude function to Victor objects
 *
 * @param  int | max | The limit magnitude for the vector
 */
Victor.prototype.limitMagnitude = function (max) {

  if (this.length() > max) {
    this.normalize();
    this.multiply({x:max,y:max});
  }

};

/*--- end Helper Functions ----*/

/*---- Loop and Initializing ----*/

// Checkbox Options
var walls = false;
// var mouseSeek = true;
var collisions = true;
var avoidCenter = false;
var snitchSeek = false;

// Set number of boids based on browser and screen size
if (firefox) {
  var maxBoids = 250;
} else if (mobile) {
  var maxBoids = 150;
} else {
  var maxBoids = 250;
}
var minBoids = 250;
var numBoids = Math.sqrt(canvas.width * canvas.height) / 2;
if ( numBoids > maxBoids ) {
  numBoids = maxBoids;
} else if ( numBoids < minBoids ) {
  numBoids = minBoids;
}

// Set possible radii  based on screen size
var radius;
if ( size.width / 288 > 5 ) {
  radius = 5;
} else if ( size.width / 288 < 3) {
  radius = 3;
} else {
  radius = size.width / 288;
}

var radiusCoefficients = [.5,.6,.7,.8,1];


// Boid Attributes
var colors = [
    '#395573',
    '#5e468c',
    '#477ab3',
    '#7e62b3',
];

var snitchColor = '#EFB86C'

var diversity = 4;
var diverseColors = colors.slice(0,diversity);

var quickness = 1;
var introversion = .8;
var racism = 1;
var speedIndex;
if ( size.width / 160 < 5 ) {
  speedIndex = 5;
} else if ( size.width / 180 > 8 ) {
  speedIndex = 9;
} else {
  speedIndex = size.width / 180;
}

// Create Boids Array
var boids = [];

/**
 * Create Boids Array
 *
 */
function createBoids() {

  // Instantiate all Boids
  for ( i = 0; i < numBoids; i++ ) {

    // Generate introversion coefficient
    var introversionCoefficient = getCoefficient() / 100;
    var quicknessCoefficient = getQuicknessCoefficient() / 100;
    var racismCoefficient = getCoefficient() / 100;
    var radiusCoefficient = Math.floor(Math.random() * radiusCoefficients.length);

    // Generate random coords
    var x = Math.ceil(Math.random()* ( size.width - ( radius * 2 ) ) ) + ( radius );
    var y = Math.ceil(Math.random()* ( size.height - ( radius * 2 ) ) ) + ( radius );
    // For subsequent boids, check for collisions and generate new coords if exist
    if ( i !== 0 ) {
      for (var j = 0; j < boids.length; j++ ) {
        if ( getDistance(x, y, boids[j].x, boids[j].y) - ( radius + boids[j].radius ) < 0 ) {
          x = Math.ceil(Math.random()* ( size.width - ( radius * 2 ) ) ) + ( radius );
          y = Math.ceil(Math.random()* ( size.height - ( radius * 2 ) ) ) + ( radius );
          j = -1;
        }
      }
    }

    // Add new Boid to array
    boids.push( new Boid( {
      id: i,
      x: x,
      y: y,
      speedIndex: speedIndex,
      radius: radius,
      radiusCoefficient: i == 0 ? radiusCoefficients.length - 1 : radiusCoefficient,
      quickness: quickness,
      quicknessCoefficient: quicknessCoefficient,
      color: i == 0 ? snitchColor : randomColor(diverseColors),
      racism: racism,
      racismCoefficient: racismCoefficient,
      introversion: introversion,
      introversionCoefficient: introversionCoefficient,
      snitch: i == 0
    } ) );
  }

}

/**
 * Setup and call animation function
 *
 */
function animate() {
  requestAnimationFrame(animate);

  // Calc elapsed time since last loop
  now = Date.now();
  elapsed = now - then;

  // FPS Reporting
  fpsReport++;
  if (fpsReport > 60) {
    fpsReport = 0;
  }

  // If enough time has elapsed, draw the next frame
  if (elapsed > fpsInterval) {
      // Get ready for next frame by setting then=now, but also adjust for your
      // specified fpsInterval not being a multiple of RAF's interval (16.7ms)
      then = now - (elapsed % fpsInterval);
      // Drawing Code
      c.clearRect(0, 0, canvas.width, canvas.height);
      // Update all boids
      for (var i = 0; i < boids.length; i++ ) {
        boids[i].update();
      }
  }
}

// Setup animation
var stop = false;
var frameCount = 0;
var fps, fpsInterval, startTime, now, then, elapsed;
var fpsReport = 58;

/**
 * Start Animation of Boids
 *
 */
function startAnimating() {
  if(fps == null) { var fps = 60; }
  fpsInterval = 1000 / fps;
  then = Date.now();
  startTime = then;
  animate();
}

//Initalize program
createBoids();
var snitch = boids[0];
startAnimating(60);

/*---- end Loop and Initializing ----*/

/*---- Event Listeners ----*/

/**
 * Update mouse positions on mousemove
 *
 */
addEventListener('mousemove', function(event){
  mouse.position.x = event.clientX;
  mouse.position.y = event.clientY;
});


/**
 * Update mouse positions on mousemove
 *
 */
addEventListener('click', function(event){
  var target = mouse.position.clone()
  var distance = target.subtract(snitch.position)
  if(distance.length() < snitch.radius){
    console.log("Caught!")
    snitchSeek ^= true;
  }
});

/**
 * Update boundary sizes on window resize
 *
 */
addEventListener('resize', function(){
  size.width = innerWidth;
  size.height = innerHeight;
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  center.x = size.width/ 2;
  center.y = size.height / 2;
});

/*---- end Event Listeners ----*/
