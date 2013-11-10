window.requestAnimFrame = (function(callback) {
  return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
  function(callback) {
    window.setTimeout(callback, 1000 / 60);
  };
})();

function message(msg) {
   document.getElementById("message").innerHTML = msg;
}


// keyboard event handling
Game.keysDown = {};
addEventListener("keydown", function(e) { Game.keysDown[e.keyCode] = true; }, false);
addEventListener("keyup", function(e) { delete Game.keysDown[e.keyCode]; }, false);




Game.input = function() {
  var thrust = 0.2 * Game.player.m;
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
  // Space bar
  if (32 in Game.keysDown) {
    Game.player.basicLaser();
    Game.player.boom();
  }
};


Game.load = function() {
  Game.director = new Director(Game.directorStat);
  Game.director.init();
  Game.display = new Display(Game.width, Game.height);

};

Game.start = function() {
  initMic();
  Game.running = true;
  Game.startTime = new Date();
  Game.frameNum = 0;
  Game.fpsTime = Game.startTime;
  Game.updateLoop = setInterval(Game.update, 5);
  Game.renderLoop = (function animloop(){
    Game.display.render();
    requestAnimFrame(animloop);
    }
  )();
};

Game.pause = function() {

};

Game.getXVel = function(x,y) {
  return 0;
};

Game.getYVel = function(x,y) {
  return 0;
};

Game.over = function(failed) {
  if(failed) {
    //Game over
  }
  else {
    //Level clear, display score
  }

};

Game.isAreaClear = function(x,y,r) {
  var dx;
  var dy;
  for (j in Game.actors) {
      dx = Game.actors[j].x - x;
      dy = Game.actors[j].y - y;
      if (norm(x,y) < r + Game.actors[j].r) {
        return false;
      }
  }
  return true;
};

Game.update = function() {
  var curTime = new Date();
  Game.gameTime = curTime - Game.startTime;
  Game.frameNum += 1;
  if(curTime - Game.fpsTime > 1000){
    document.getElementById("fps").innerHTML = ((1000 * (Game.frameNum) / (curTime - Game.fpsTime) + 0.5) | 0);
    Game.fpsTime = curTime;
    Game.frameNum = 0;
  }
  Game.director.run()
  Game.input();
};


$( document ).ready(function() {
  Game.load();
  console.log(Game);
});
