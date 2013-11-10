var Physical = function(x,y,r,m,vx,vy,cor){
  this.x = x;
  this.y = y;
  this.r = r;
  this.m = m;
  this.vx = vx;
  this.vy = vy;
  this.physics = true;
  this.cor = cor;
  this.takesPhysDmg = false;
};

Physical.prototype = {
  hasConflict: function(otherPhysical) {
    if(otherPhysical.physics && this.physics) {
      var xr = otherPhysical.x - this.x; // relative location of Games.actors[i]; (this) is at origin
      var yr = otherPhysical.y - this.y;
      var r0 = norm(xr, yr); // distance at current tick
      var drdt = (xr * (otherPhysical.vx - this.vx) + yr * (otherPhysical.vy - this.vy)) / r0;
      if (r0 < this.r + otherPhysical.r + 1) {
        return true;
      }
    }   
    return false;
  },
  resolveConflict: function(otherPhysical) {
    // compute inter-actor physics interactions
    // Push them apart so that they aren't intersecting anymore
    var R = otherPhysical.r + this.r + 1.01;
    var xr = this.x - otherPhysical.x; // relative location of Games.actors[i]; (this) is at origin
    var yr = this.y - otherPhysical.y;
    var r0 = norm(xr, yr); // distance at current tick
    var mtdx = xr * (R-r0)/r0; // Minimum translational distance to achieve separation
    var mtdy = yr * (R-r0)/r0;
    var im1 = 1/this.m; //inverse masses, since we divide by the masses more often than multiply.
    var im2 = 1/otherPhysical.m;
    this.x += (im1/(im1+im2)) * mtdx; //Move the objects away from each other proportional to their inverse mass (i.e. lighter moves more)
    this.y += (im1/(im1+im2)) * mtdy;
    otherPhysical.x -= (im2/(im1+im2)) * mtdx;
    otherPhysical.y -= (im2/(im1+im2)) * mtdy;
    var vxr = this.vx-otherPhysical.vx; // relative velocity in x direction
    var vyr = this.vy-otherPhysical.vy;
    var vn = (vxr * mtdx + vyr * mtdy) / norm(mtdx, mtdy); //this is just dot product w/ unit mtd vector
    //if (vn > 0) { return }; 
    var i = (-(1 + this.cor * otherPhysical.cor * vn)) / (im1 + im2);
    var impx = i * mtdx;
    var impy = i * mtdy;
    this.vx -= impx*im1;
    this.vy -= impy*im1;
    otherPhysical.vx += impx*im2;
    otherPhysical.vy += impy*im2;
    if(this.takesPhysDmg && otherPhysical.takesPhysDmg) {
      otherPhysical.damage(Math.abs(i) * this.m);
      this.damage(Math.abs(i) * otherPhysical.m);
    }
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
        this.vx = -this.cor * this.vx;
        this.x += Math.abs(1-t) * this.vx; 
      }
      if (this.x + this.vx > Game.display.canvas.width - this.r) {
        var t = (Game.display.canvas.width - this.r - this.x) / this.vx;
        this.x += t * this.vx;
        this.vx = -this.cor * this.vx;
        this.x += (1-t) * this.vx; 
      }
      if (this.y + this.vy < this.r) {
        var t = (this.y - this.r) / this.vy;
        this.y += t * this.vy;
        this.vy = -this.cor * this.vy;
        this.y += (1-t) * this.vy; 
      }
      if (this.y + this.vy > Game.display.canvas.height - this.r) {
        var t = (Game.display.canvas.height - this.r - this.y) / this.vy;
        this.y += t * this.vy;
        this.vy = -this.cor * this.vy;
        this.y += (1-t) * this.vy; 
      }
    } 
    this.x += this.vx;
    this.y += this.vy;
  },
  impulse: function(jx, jy) {
    this.vx += jx / this.m;
    this.vy += jy / this.m;
  },
};

Projectile.prototype = new Physical();
Projectile.prototype.constructor = Projectile;

function Projectile(x,y,r,m,vx,vy,cor,duration) {
  this.startTime = Game.gameTime;
  this.x = x;
  this.y = y;
  this.r = r;
  this.m = m;
  this.vx = vx;
  this.vy = vy;
  this.alive = true;
  this.physics = true;
  this.cor = cor;
  this.health = 100000;
  this.duration = duration;
};

Projectile.prototype.move = function() {
    // this flag is set to true if the movement is computed by the 
    // collision code, which means the standard euler integration step 
    // should be skipped.
    if (Game.gameTime - this.startTime > this.duration) {
      this.die();
    }
    if (this.physics) {
      // compute interaction with walls
      if (this.x + this.vx < this.r) {
        var t = (this.x - this.r) / this.vx;
        this.x = this.r;
        this.vx = -this.cor * this.vx;
        this.x += Math.abs(1-t) * this.vx; 
      }
      if (this.x + this.vx > Game.display.canvas.width - this.r) {
        var t = (Game.display.canvas.width - this.r - this.x) / this.vx;
        this.x += t * this.vx;
        this.vx = -this.cor * this.vx;
        this.x += (1-t) * this.vx; 
      }
      if (this.y + this.vy < this.r) {
        var t = (this.y - this.r) / this.vy;
        this.y += t * this.vy;
        this.vy = -this.cor * this.vy;
        this.y += (1-t) * this.vy; 
      }
      if (this.y + this.vy > Game.display.canvas.height - this.r) {
        var t = (Game.display.canvas.height - this.r - this.y) / this.vy;
        this.y += t * this.vy;
        this.vy = -this.cor * this.vy;
        this.y += (1-t) * this.vy; 
      }
    } 
    this.x += this.vx;
    this.y += this.vy;
};

Projectile.prototype.die = function() {
  this.alive = false;
};

Projectile.prototype.render = function(context) {
    context.strokeStyle = '#ffffff';
    context.beginPath();
    context.arc(this.x, this.y, this.r, 0, tau);
    context.stroke();
};

Actor.prototype = new Physical();
Actor.prototype.constructor = Actor; 

function Actor(x, y, r, m, vx, vy, cor, hth) {
  this.x = x;
  this.y = y;
  this.r = r;
  this.m = m;
  this.vx = vx;
  this.vy = vy;
  this.alive = true;
  this.physics = true;
  this.cor = cor;
  this.health = hth;
};

Actor.prototype.logic = function() {};

Actor.prototype.move = function() {
  this.vx = sign(this.vx) * Math.min(Math.abs(this.vx), Game.shipVMax);
  this.vy = sign(this.vy) * Math.min(Math.abs(this.vy), Game.shipVMax);
  this.x += this.vx;
  this.y += this.vy;
  this.vx -= sign(this.vx) * (Game.drag * this.vx * this.vx)/this.m;
  this.vy -= sign(this.vy) * (Game.drag * this.vy * this.vy)/this.m;
  var collided = false;
  var orientation = null;
  if (this.x + this.vx < this.r) {
    collided = true;
    orientation = 1; // collision along x
    var t = (this.x - this.r) / this.vx;
    this.x = this.r;
    this.vx = -this.cor*this.vx;
    this.x += Math.abs(1-t) * this.vx; 
  }
  if (this.x + this.vx > Game.display.canvas.width - this.r) {
    collided = true;
    orientation = 1; // collision along x
    var t = (Game.display.canvas.width - this.r - this.x) / this.vx;
    this.x += t * this.vx;
    this.vx = -this.cor*this.vx;
    this.x += (1-t) * this.vx; 
  }
  if (this.y + this.vy < this.r) {
    collided = true;
    orientation = 2; // collision along y
    var t = (this.y - this.r) / this.vy;
    this.y += t * this.vy;
    this.vy = -this.cor*this.vy;
    this.y += (1-t) * this.vy; 
  }
  if (this.y + this.vy > Game.display.canvas.height - this.r) {
    collided = true;
    orientation = 2; // collision along y
    var t = (Game.display.canvas.height - this.r - this.y) / this.vy;
    this.y += t * this.vy;
    this.vy = -this.cor*this.vy;
    this.y += (1-t) * this.vy; 
  }
  if(collided && this.takesPhysDmg) {
    if(orientation == 1){
      this.damage(this.cor * this.m * Math.abs(this.vx));
    }
    else if (orientation == 2) {
      this.damage(this.cor * this.m * Math.abs(this.vy));
    }
  }
}

Actor.prototype.damage = function(dmg) {
  this.health -= dmg;
  Game.display.animateDamage(this,dmg);
  if(this.health <= 0){
    this.die();
  }
}

Actor.prototype.die = function() {
  this.alive = false;
};

Actor.prototype.render = function(context) {
    context.strokeStyle = '#ffffff';
    context.beginPath();
    context.arc(this.x, this.y, this.r, 0, tau);
    context.stroke();
};

EnemyShip.prototype = new Actor();
EnemyShip.prototype.constructor = EnemyShip;
function EnemyShip(x, y, enemyStat) {
  this.x = x;
  this.y = y;
  this.r = enemyStat.r;
  this.m = enemyStat.m;
  this.vx = enemyStat.vx;
  this.vy = enemyStat.vy;
  this.cor = enemyStat.cor;
  this.strokeStyle = enemyStat.strokeStyle;
  this.fillStyle = enemyStat.fillStyle;
  this.alive = true;
  this.health = enemyStat.hth;
  this.takesPhysDmg = enemyStat.takesPhysDmg;
  this.pointValue = this.health;
};

EnemyShip.prototype.render = function(context) {
  context.strokeStyle = this.strokeStyle;
  context.fillStyle = this.fillStyle;
  context.beginPath();
  context.arc(this.x, this.y, this.r, 0, tau);
  context.stroke();
  context.fill();
};

EnemyShip.prototype.logic = function() {
  var probMove = 0.05;
  var prob = Math.random();
    if(prob < probMove){
    this.dx = this.x - Game.player.x;
    this.dy = this.y - Game.player.y;
    var inaccuracyX = 2*(0.5 - Math.random());
    var inaccuracyY = 2*(0.5 - Math.random());
    var thrust = 0.01*prob;
    this.impulse(-thrust*(this.dx + inaccuracyX), -thrust*(this.dy + inaccuracyY));
  }
};

PlayerShip.prototype = new Actor();
PlayerShip.prototype.constructor = PlayerShip;
function PlayerShip(playerStat) {
  this.x = playerStat.x;
  this.y = playerStat.y;
  this.vx = playerStat.vx;
  this.vy = playerStat.vy;
  this.r = playerStat.r;
  this.m = playerStat.m;
  this.cor = playerStat.cor;
  this.maxHealth = playerStat.hth;
  this.health = this.maxHealth;
  this.baseDamage = playerStat.basedmg;
  this.takesPhysDmg = playerStat.takesPhysDmg;
  this.strokeStyle = playerStat.strokeStyle;
  this.physics = true;
  this.alive = true;
};

PlayerShip.prototype.reset = function() {
  this.health = this.maxHealth;
  this.alive=true;
  console.log ("You died");
}

PlayerShip.prototype.render = function(context) {
  context.strokeStyle = this.strokeStyle;;
  context.beginPath();
  context.moveTo(this.x, this.y - 10);
  context.lineTo(this.x + 10, this.y + 10);
  context.lineTo(this.x, this.y + 5);
  context.lineTo(this.x - 10, this.y + 10);
  context.lineTo(this.x, this.y - 10);
  context.stroke();
};

PlayerShip.prototype.basicLaser = function() {
  var delta = Math.sin(((Game.gameTime / 50) % tau))* 5 + Game.weaponSettings.laserWidth;
  Game.display.animateLaser(this,delta);
  for (i in Game.actors) {
    var actor = Game.actors[i]
    if (actor != this){
      var xr = this.x - actor.x; 
      var yr = this.y - actor.y;
      if (Math.abs(xr) < delta && yr > 0 ) {
        var theta = Math.atan2(yr, xr);
        actor.impulse(-0.5 * Math.cos(theta), -2 * Math.sin(theta));
        actor.damage(this.baseDamage);
      }
    }
  }
};

PlayerShip.prototype.boom = function() {
  var blastRadius = 50;
  for (i in Game.actors) {
    var actor = Game.actors[i]
    if (actor != this){
      dx = actor.x - this.x;
      dy = actor.y - this.y;
      dr = norm(dx, dy);
      if (dr < blastRadius) {
        actor.impulse(50*dx/(dr*dr), 50*dy/(dr*dr));
        actor.damage(0.5*this.baseDamage);
      }
    }
  }
};

PlayerShip.prototype.gun = function() {
  var numBullets = Game.weaponSettings.numBullets;
  var theta = 0;
  var dtheta = tau/numBullets;
  var bullVel = Game.weaponSettings.bulletVel;
  var bullet;
  var xS;
  var yS;
  var vxS;
  var vyS;
  var m;
  var cosThet;
  var sinThet;
  var cor = 0.5;
  var r = 2;
  var duration = 1000;
  for (var i = 0; i < numBullets; i++){
    cosThet = Math.cos(theta);
    sinThet = Math.sin(theta);
    xS = this.x + (1+this.r) * cosThet;
    yS = this.y + (1+this.r) * sinThet;
    vxS = this.vx + bullVel * (1+this.r) * cosThet;
    vyS = this.vy + bullVel * (1+this.r) * sinThet;
    m = Game.weaponSettings.bulletMass;
    bullet = new Physical(xS,yS,r,m,vxS,vyS,cor,duration);
    Game.projectiles.push();
    theta += dtheta;
  }
}
