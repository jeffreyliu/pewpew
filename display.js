var Display = function(width,height) {
	this.canvas = document.getElementById("canvas");
  this.canvas.width = width;
  this.canvas.height = height;
  this.context = this.canvas.getContext("2d");
  document.body.appendChild(this.canvas);
  this.totParts = 0;
  this.animations = [];
};

Display.prototype.add = function(animation) {
  this.animations.push(animation);
}

Display.prototype.clear = function () {
  this.context.clearRect(0, 0, Game.width, Game.height);
  this.context.fillStyle = Game.bgCol;
  this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
};

Display.prototype.render = function() {
  this.clear();
  for (var i = 0; i < Game.actors.length; i++) {
    Game.actors[i].render(this.context);
  }
  for (var k = this.animations.length - 1; k >= 0; k--) {
    this.animations[k].render(this.context);
    if(this.animations[k].completed){
      this.animations.splice(k,1);//remove finished animations from list
    }
  }
};

Display.prototype.animateDeath = function(actor) {
  var damage = 100;
  var maxSpread = 1;
  var death = new Damage(actor,damage,maxSpread,2000);
  this.add(death);
};

Display.prototype.animateDamage = function(actor,dmg) {
  var maxSpread = Math.min (dmg/100,1);
  var dmg = Math.min(dmg, 100);
  var damage = new Damage(actor,dmg, maxSpread, 100);
  this.add(damage);
}

Display.prototype.animateLaser = function(actor,delta) {
  var params = {
    x: actor.x - delta,
    y: 0,
    width: 2 * delta,
    height: actor.y - actor.r,
    fillStyle: Game.weaponSettings.laserFillColor,
    strokeStyle: Game.weaponSettings.laserStrokeColor,
    duration: 10
  };
  var beam = new Rectangular(params);
  this.add(beam);
}

var Animation = function() {
  /*
  Animation class is visual sugar that doesn't affect actual gameplay
  This abstract parent class doesn't do anything except show what an animation needs:
  a render function that takes a context
  */
  this.startTime = new Date();
  this.duration = 1000;
  this.completed = false;
}

Animation.prototype = {
  render: function(context) { 
    if(Game.gameTime - this.startTime > this.duration){
      this.completed=true;
    }
  }
}

Rectangular.prototype = new Animation();
Rectangular.prototype.constructor = Rectangular;

function Rectangular(params) {
  this.startTime = Game.gameTime,
  this.duration = params.duration,
  this.x = params.x,
  this.y = params.y,
  this.width = params.width,
  this.height = params.height,
  this.strokeStyle = params.strokeStyle,
  this.fillStyle = params.fillStyle
}

Rectangular.prototype.render = function(ctx) {
  ctx.save();
  ctx.strokeStyle = this.strokeStyle;
  ctx.fillStyle = this.fillStyle;
  ctx.beginPath();
  ctx.rect(this.x,0,this.width,this.height);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  if(Game.gameTime - this.startTime > this.duration){
      this.completed=true;
  }
}

Particular.prototype = new Animation();
Particular.prototype.constructor = Particular;

function Particular(params){
  this.startTime = params.startTime;
  this.x = params.x;
  this.y = params.y;
  this.vx = params.vx;
  this.vy = params.vy;
  this.r = params.r;
  this.strokeStyle = params.strokeStyle;
  this.spread = params.spread || 0.5; // from 0 to 1
  this.numPar = params.numPar || 10;
  this.avgLife = params.avgLife || 100;
  this.init();
}
Particular.prototype.init = function() {
  this.px = [];
  this.py = [];
  this.pvx = [];
  this.pvy = [];
  this.pc = [];
  this.pl = [];
  var rand1;
  var rand2;
  var randG;
  var theta;
  var dtheta;
  var randSign;
  var cosThet;
  var sinThet;
  for(var i = 0; i < this.numPar; i++) {
    if(Game.display.totParts < Game.maxParticles){
      randSign1 = sign(0.5 - Math.random());
      randSign2 = sign(0.5 - Math.random());
      rand1 = Math.random();
      rand2 = Math.random();
      randG = approxGaus();
      theta = Math.atan2(this.vx,this.vy);
      dtheta = (this.spread * randG * tau) - Math.PI;
      theta = theta + dtheta;
      cosThet = Math.cos(theta);
      sinThet = Math.sin(theta);
      this.px.push(this.x + randSign1*this.r*rand1*cosThet);
      this.py.push(this.y + randSign2*this.r*rand2*sinThet);
      this.pvx.push(rand1*this.vx + cosThet);
      this.pvy.push(rand2*this.vy - sinThet);
      this.pc.push(this.strokeStyle);
      this.pl.push((rand1 + randG) * this.avgLife);
      Game.display.totParts += 1;
    }
  }
}

Particular.prototype.render = function(ctx) {
  ctx.strokeStyle = this.strokeStyle;
  for(var i = this.pl.length - 1; i >=0; i--) {
    if(this.pl[i] > Game.gameTime - this.startTime){
      ctx.strokeStyle = this.pc[i];
      ctx.beginPath();
      ctx.moveTo(this.px[i],this.py[i]);
      ctx.lineTo(this.px[i]+3*this.pvx[i],this.py[i]+3*this.pvy[i]);
      ctx.stroke();
      this.px[i] += this.pvx[i];
      this.py[i] += this.pvy[i];
      this.pvx[i] += Game.getXVel(this.px[i],this.py[i]);
      this.pvy[i] += Game.getYVel(this.px[i],this.py[i]);
    }
    else if(this.pl[i] != 0) {
      Game.display.totParts -= 1;
      this.pl[i] = 0;
    }
  }

}

Damage.prototype = new Animation(); 
Damage.prototype.constructor = Damage;

function Damage(actor, dmg, maxSpread, avgLife) {
  this.startTime = Game.gameTime;
  this.completed = false;
  this.x = actor.x;
  this.y = actor.y;
  this.r = actor.r;
  this.vx = 2*actor.vx;
  this.vy = 2*actor.vy;
  this.strokeStyle = actor.strokeStyle;
  this.avgLife = avgLife;
  this.duration = 2 * avgLife;
  this.spread = maxSpread*(Math.random());
  this.numPar = (1+this.spread) * Math.min(dmg,20);
  this.partic = new Particular(this);
}

Damage.prototype.render = function (ctx) {
  this.partic.render(ctx);
  if(Game.gameTime - this.startTime > this.duration) {
    this.completed = true;
  }
}


