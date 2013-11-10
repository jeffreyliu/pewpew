var Director = function(directorStat) {
  /*
  The director handles the game logic
  */
  this.difficulty = directorStat.diff; // should be between (0,1), 0 is easiest, 1 most difficult
  this.comboTime = (2-this.difficulty) * directorStat.comboTime;
  this.playerLives = directorStat.lives;
  this.triggers = directorStat.triggers; // Array of triggers. Trigger is a literal w/ attributes: time, callback
  this.songDetector = new BeatDetector();
  this.inputDetector = new BeatDetector();
};

Director.prototype = {
  init: function() {
    Game.actors = [];
    Game.playerScore = 0;
    var player = new PlayerShip(Game.playerStat);
    Game.actors.push(player);
    Game.player = Game.actors[Game.actors.length-1];
    Game.projectiles = [];
  },

  adjustDifficulty: function(diffDelta) {
    this.difficulty = Math.max(this.difficulty + diffDelta, 1); 
  },

  resolvePhysics: function() {
    var physicals = Game.actors.concat(Game.projectiles)
    for (var i=0; i < physicals.length; i++) {
      var physical = physicals[i];
      for (var j = i+1; j < physicals.length; j++) {
        var otherPhysical = physicals[j];
        if (physical.hasConflict(otherPhysical)) {
          physical.resolveConflict(otherPhysical);
        }
      }
      physical.move();
    }
  },

  spawnEnemy: function(enemyType,numEnemies) {
    var enInfo = enemyInfo[enemyType];
    var xDelta = Game.width / (numEnemies + 1);
    var R = enInfo.r;
    var x = 0;
    var y = 1.5*R;
    var okay = Game.isAreaClear(x,y,R);
    for(var i=0; i<numEnemies; i++){
      if(Game.actors.length <= Game.maxEnemies){
        x += xDelta;
        var attempts = 0;
        while(!okay && attempts < 20){
          x += (Math.random() - 0.5) * R;
          y += (Math.random() - 0.5) * R;
          okay = Game.isAreaClear(x,y,R);
          attempts += 1
        }
      var enemy =  new EnemyShip(x,y,enInfo); 
      Game.actors.push(enemy);
      }
    }
  },
  nextTrigger: function(timestamp) {
    if(this.triggers.length > 0){
      trigger = this.triggers[0];
      if (trigger.time < timestamp){
        this.triggers.shift();
        return trigger;
      }
    }
    return null;
  },

  resolveAlive: function() {
    for(var i = Game.actors.length-1; i>=0; i--){
      if(!Game.actors[i].alive){
        Game.display.animateDeath(Game.actors[i]);
        if(Game.actors[i] != Game.player){
          this.updateScore(Game.actors[i].pointValue);
          Game.actors.splice(i,1); //remove dead actors from list
        }
        else{
          Game.player.reset();
          this.playerLives -= 1;
          this.updateScore(-1 * Game.playerScore/4)
          if(this.playerLives < 0){
            Game.over(true);
          }
        }
      }
    }
  },

  resolveLogic: function() {
    for(var i = Game.actors.length-1; i>=0; i--){
      Game.actors[i].logic();
    }
  },

  updateScore: function(scoreDelta) {
    Game.playerScore += scoreDelta * (1+this.difficulty);
  },

  detect: function() {
    this.songDetector.sample(audio.analyser);
    if(this.songDetector.beatChance > Game.beatThreshold) {
      this.triggers.push({time: Game.gameTime + 10, callback: function(){Game.director.spawnEnemy(ENUM.MINOR,5)}} )
    }
    this.inputDetector.sample(inputAnalyser);
    if(this.inputDetector.beatChance > Game.inputThreshold) {
      Game.player.gun();
    }
  },

  run: function() { 
    this.resolvePhysics();
    this.resolveAlive();
    this.resolveLogic();
    this.detect();
    next = this.nextTrigger(Game.gameTime);
    if(next != null){
      next.callback();
    }
  }
};


 