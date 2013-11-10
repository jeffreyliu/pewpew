/* globals */
var tau = Math.PI * 2;
function sign(x) { return x ? x < 0 ? -1 : 1 : 0; }
function norm(x,y) { return Math.sqrt(x*x+y*y); }



Game = {
  vmax: 2,
  drag: 0.01,
  width: 450,
  height: 400
};

var canvas = document.createElement("canvas");
var context = canvas.getContext("2d");
canvas.width = Game.width;
canvas.height = Game.height;

var output_canvas = document.createElement("canvas");
var output_context = output_canvas.getContext("2d");
output_canvas.width = Game.width;
output_canvas.height = Game.height;
  // output_context.scale(2,2); ???
document.body.appendChild(output_canvas);

var Actor = function(x, y, r, m, vx, vy, cor) {
  this.x = x;
  this.y = y;
  this.r = r;
  this.m = m;
  this.vx = vx;
  this.vy = vy;
  this.alive = true;
  this.physics = true;
  this.cor = 0.5;
};

Actor.prototype = {
  hasConflict: function(otherActor) {
    if(otherActor.physics && this.physics) {
      var xr = otherActor.x - this.x; // relative location of Games.actors[i]; (this) is at origin
      var yr = otherActor.y - this.y;
      var r0 = norm(xr, yr); // distance at current tick
      var drdt = (xr * (otherActor.vx - this.vx) + yr * (otherActor.vy - this.vy)) / r0;
      if (r0 < this.r + otherActor.r + 1) {
        return true;
      }
    }   
    return false;
  },
  resolveConflict: function(otherActor) {
    // compute inter-actor physics interactions
    // Push them apart so that they aren't intersecting anymore
    var R = otherActor.r + this.r + 1.01;
    var xr = this.x - otherActor.x; // relative location of Games.actors[i]; (this) is at origin
    var yr = this.y - otherActor.y;
    var r0 = norm(xr, yr); // distance at current tick
    var mtdx = xr * (R-r0)/r0; // Minimum translational distance to achieve separation
    var mtdy = yr * (R-r0)/r0;
    var im1 = 1/this.m; //inverse masses, since we divide by the masses more often than multiply.
    var im2 = 1/otherActor.m;
    this.x += (im1/(im1+im2)) * mtdx; //Move the objects away from each other proportional to their inverse mass (i.e. lighter moves more)
    this.y += (im1/(im1+im2)) * mtdy;
    otherActor.x -= (im2/(im1+im2)) * mtdx;
    otherActor.y -= (im2/(im1+im2)) * mtdy;
    var vxr = this.vx-otherActor.vx; // relative velocity in x direction
    var vyr = this.vy-otherActor.vy;
    var vn = (vxr * mtdx + vyr * mtdy) / norm(mtdx, mtdy); //this is just dot product w/ unit mtd vector
    //if (vn > 0) { return }; 
    var i = (-(1 + this.cor * otherActor.cor * vn)) / (im1 + im2);
    var impx = i * mtdx;
    var impy = i * mtdy;
    this.vx -= impx*im1;
    this.vy -= impy*im1;
    otherActor.vx += impx*im2;
    otherActor.vy += impy*im2;
  },
  move: function() {
    // this flag is set to true if the movement is computed by the 
    // collision code, which means the standard euler integration step 
    // should be skipped.
    if (this.physics) {
      // compute interaction with walls
      if (this.x + this.vx < this.r) {
        var t = (this.x - this.r) / this.vx;
        this.x = this.r;
        this.vx = -this.vx;
        this.x += Math.abs(1-t) * this.vx; 
      }
      if (this.x + this.vx > canvas.width - this.r) {
        var t = (canvas.width - this.r - this.x) / this.vx;
        this.x += t * this.vx;
        this.vx = -this.vx;
        this.x += (1-t) * this.vx; 
      }
      if (this.y + this.vy < this.r) {
        var t = (this.y - this.r) / this.vy;
        this.y += t * this.vy;
        this.vy = -this.vy;
        this.y += (1-t) * this.vy; 
      }
      if (this.y + this.vy > canvas.height - this.r) {
        var t = (canvas.height - this.r - this.y) / this.vy;
        this.y += t * this.vy;
        this.vy = -this.vy;
        this.y += (1-t) * this.vy; 
      }
    } 
    this.vx = sign(this.vx) * Math.min(Math.abs(this.vx), Game.vmax);
    this.vy = sign(this.vy) * Math.min(Math.abs(this.vy), Game.vmax);
      this.x += this.vx;
      this.y += this.vy;
  },
  impulse: function(jx, jy) {
    this.vx += jx / this.m;
    this.vy += jy / this.m;
  },
  kill: function() {
    this.alive = false;
  },
  render: function(context) {
    context.strokeStyle = '#ffffff';
    context.beginPath();
    context.arc(this.x, this.y, this.r, 0, tau);
    context.stroke();
  }
};

EnemyShip.prototype = new Actor();
EnemyShip.prototype.constructor = EnemyShip;
function EnemyShip(x, y, r, m, vx, vy,hth) {
  this.x = x;
  this.y = y;
  this.r = r;
  this.m = m;
  this.vx = vx;
  this.vy = vy;
  this.alive = true;
  this.health = hth;
};
EnemyShip.prototype.render = function(context) {
  context.strokeStyle = '#ff0000';
  context.fillStyle = 'rgba(255,0,0,' + Math.random()*0.1 + ')';
  context.beginPath();
  context.arc(this.x, this.y, this.r, 0, tau);
  context.stroke();
  context.fill();
};

PlayerShip.prototype = new Actor();
PlayerShip.prototype.constructor = PlayerShip;
function PlayerShip(x, y, m, vx, vy, hth) {
  this.x = x;
  this.y = y;
  this.vx = vx;
  this.vy = vy;
  this.r = 10;
  this.m = m;
  this.cor = 0.6;
  this.physics = true;
  this.alive = true;
};
PlayerShip.prototype.render = function(context) {

  context.shadowColor = '#00ffff';
  context.shadowBlur = 10;
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 0;

  context.strokeStyle = '#00ffff';
  context.beginPath();
  context.moveTo(this.x, this.y - 10);
  context.lineTo(this.x + 10, this.y + 10);
  context.lineTo(this.x, this.y + 5);
  context.lineTo(this.x - 10, this.y + 10);
  context.lineTo(this.x, this.y - 10);
  context.stroke();

  context.shadowBlur = 0;
};
PlayerShip.prototype.move = function() {
  this.vx = sign(this.vx) * Math.min(Math.abs(this.vx), Game.vmax);
  this.vy = sign(this.vy) * Math.min(Math.abs(this.vy), Game.vmax);
  this.x += this.vx;
  this.y += this.vy;
  this.vx -= sign(this.vx) * (Game.drag * this.vx * this.vx)/this.m;
  this.vy -= sign(this.vy) * (Game.drag * this.vy * this.vy)/this.m;
  if (this.x + this.vx < this.r) {
        var t = (this.x - this.r) / this.vx;
        this.x = this.r;
        this.vx = -this.cor*this.vx;
        this.x += Math.abs(1-t) * this.vx; 
      }
      if (this.x + this.vx > canvas.width - this.r) {
        var t = (canvas.width - this.r - this.x) / this.vx;
        this.x += t * this.vx;
        this.vx = -this.cor*this.vx;
        this.x += (1-t) * this.vx; 
      }
      if (this.y + this.vy < this.r) {
        var t = (this.y - this.r) / this.vy;
        this.y += t * this.vy;
        this.vy = -this.cor*this.vy;
        this.y += (1-t) * this.vy; 
      }
      if (this.y + this.vy > canvas.height - this.r) {
        var t = (canvas.height - this.r - this.y) / this.vy;
        this.y += t * this.vy;
        this.vy = -this.cor*this.vy;
        this.y += (1-t) * this.vy; 
      }
},

PlayerShip.prototype.basicLaser = function() {
  var delta = 10;
  for (i in Game.actors) {
    var actor = Game.actors[i]
    if (actor != this){
      var xr = this.x - actor.x; 
      var yr = this.y - actor.y;
      if (Math.abs(xr) < delta && yr > this.r) {
        var theta = Math.atan2(yr, xr);
        actor.impulse(-2 * Math.cos(theta), -10 * Math.sin(theta));
      }
    }
  }
};

PlayerShip.prototype.boom = function() {
  var blastRadius = 100;
  for (i in Game.actors) {
    var actor = Game.actors[i]
    if (actor != this){
      dx = actor.x - this.x;
      dy = actor.y - this.y;
      dr = norm(dx, dy);
      if (dr < blastRadius) {
        actor.impulse(50*dx/(dr*dr), 50*dy/(dr*dr));
      }
    }
  }
};

// keyboard event handling
Game.keysDown = {};
addEventListener("keydown", function(e) { Game.keysDown[e.keyCode] = true; }, false);
addEventListener("keyup", function(e) { delete Game.keysDown[e.keyCode]; }, false);

Game.actors = [];

Game.reset = function() {
  Game.actors = [];
  for (var i = 0; i < 3; i++) {
    var enemy = new EnemyShip(Math.random() * canvas.width, Math.random()* canvas.height, 30, 20, Math.random() * 2 - 1, Math.random() * 2 - 1, 100); 
    Game.actors.push(enemy);
  }
  for (var i = 0; i < 100; i++) {
    var r = Math.random() * 8 + 2;
    var x, y;
    var okay = false;
    do {
      var x = Math.random() * (canvas.width-2 * r) + r ;
      var y = Math.random() * (canvas.height - 2*r) +    r;;
      okay = true;
      for (j in Game.actors) {
        var dx = Game.actors[j].x - x;
        var dy = Game.actors[j].y - y;
        if (norm(x,y) < r + Game.actors[j].r) {
          okay = false
        }
      }
    } while (!okay )
    var actor = new Actor(x, y, r, 1, Math.random() * 6 - 3, Math.random() * 6 - 3);  
    Game.actors.push(actor);
  }
  var player = new PlayerShip(100, 100, 5, 0, 0, 100);
  Game.actors.push(player);
  Game.player = Game.actors[Game.actors.length-1];
};

Game.pause = function() {

};

Game.render = function() {
  context.clearRect(0, 0, Game.width, Game.height);
  context.fillStyle = "#000000";
  context.fillRect(0, 0, canvas.width, canvas.height);
  for (i in Game.actors) {
    Game.actors[i].render(context);
  }
  var imageData = context.getImageData(0, 0, Game.width, Game.height);
  for (var y = 1; y < Game.height - 1; y += 2) {
    for (var x = 1; x < Game.width - 1; x += 2) {
      var i = (y * Game.width + x)* 4;
      var noise = Math.random() * 5;
      var dx = Game.player.x - x;
      var dy = Game.player.y - y;
      imageData.data[i] += noise * imageData.data[i+4]; 
      imageData.data[i+1] += noise * imageData.data[i-3]; 
      imageData.data[i+2] += noise * imageData.data[i-Game.width*4+2]; 
    }
  }

  output_context.putImageData(imageData, 0, 0);
};

Game.input = function() {
  var thrust = 0.1 * Game.player.m;
  // Player holding up
  if (38 in Game.keysDown) { 
    Game.player.impulse(0,-thrust);
  }
  // Player holding down
  if (40 in Game.keysDown) { 
    Game.player.impulse(0,thrust);
  }
  // Player holding left
  if (37 in Game.keysDown) { 
    Game.player.impulse(-thrust,0);
  }
  // Player holding right
  if (39 in Game.keysDown) { 
    Game.player.impulse(thrust,0);
  }

  if (32 in Game.keysDown) {
    Game.player.basicLaser();
  }
};

Game.logic = function() {
  for (var i=0; i < Game.actors.length; i++) {
    var actor = Game.actors[i];
    for (var j = i+1; j < Game.actors.length; j++) {
      var otherActor = Game.actors[j];
      if (actor.hasConflict(otherActor)) {
        actor.resolveConflict(otherActor);
      }
    }
  }
};

Game.update = function() {

  Game.input();
  Game.logic();

  for (i in Game.actors) {
    Game.actors[i].move();
    //Game.actors[i].impulse(0, 0.02 * Game.actors[i].m);
  }

};

Game.reset();
console.log(Game);
Game.updateLoop = setInterval(Game.update, 1);
Game.renderLoop = setInterval(Game.render, 15);

