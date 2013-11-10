var tau = Math.PI * 2;
sign = function(x) { return x ? x < 0 ? -1 : 1 : 0; }
var audio = new Audio();
function norm(x,y) { return Math.sqrt(x*x+y*y); }
function approxGaus() {
  //Gives an approximate gaussian, increase k for closer approximation of gaussian
  //From central limit theorem, the sum of lots of independent random numbers
  //will approach normal distribution
  var k = 5;
  var gaus = 0;
  for (var i = 0; i < k; i++) {
    gaus += Math.random();
  }
  gaus = gaus/k;
  return gaus;
};

var inputContext = new window.webkitAudioContext();
var inputAnalyser = null;
var micStreamSource = null;

function error() {
    alert('Stream generation failed.');
}

function getUserMedia(dictionary, callback) {
    try {
        navigator.getUserMedia = 
                navigator.getUserMedia ||
                navigator.webkitGetUserMedia ||
                navigator.mozGetUserMedia;
        navigator.getUserMedia(dictionary, callback, error);
    } catch (e) {
        alert('getUserMedia threw exception :' + e);
    }
};

function getMicStream(stream){
  micStreamSource = inputContext.createMediaStreamSource(stream);
  inputAnalyser = inputContext.createAnalyser();
  inputAnalyser.fftSize = 128;
  micStreamSource.connect( inputAnalyser );

};

function initMic() {
  getUserMedia({audio:true}, getMicStream);
};



ENUM = {
  PLAYER: 1,
  MINOR: 2,
  MAJOR: 3
};

Game = {
  running: false,
  shipVMax: 1,
  bulletVMax: 5,
  drag: 0.01,
  width: 450,
  height: 400,
  bgCol: "#000000",
  weaponSettings: {
    laserFreq: 5,
    laserWidth: 10,
    laserStrokeColor: 'rgba(0,0,128,0.5)',
    laserFillColor: 'rgba(100,255,255,0.1)',
    laserDamage: 10,
    boomRadius: 30,
    boomStrokeColor: 'rgba(255,255,255,0.7)',
    boomDamage: 10,
    numBullets: 7,
    bulletMass: 30,
    bulletVel: 4,
  },
  beatThreshold: 2.0,
  inputThreshold: 1.5,
  maxParticles: 5000,
  maxEnemies: 100,
};

Game.playerStat= {
  x: Game.width/2,
  y: Game.height-50,
  m: 5,
  r: 10,
  vx: 0,
  vy: 0,
  cor: 0.1,
  hth: 1000,
  basedmg: 10,
  takesPhysDmg: true,
  strokeStyle: "rgba(0,255,255,1)"
}

Game.directorStat= {
  diff: 0,
  comboTime: 1000,
  lives: 5,
  triggers: [
    /*{time:1000, callback: function() {Game.director.spawnEnemy(ENUM.MINOR,5)}},
    {time:1500, callback: function() {Game.director.spawnEnemy(ENUM.MINOR,5)}},
    {time:2000, callback: function() {Game.director.spawnEnemy(ENUM.MINOR,5)}},
    {time:2600, callback: function() {Game.director.spawnEnemy(ENUM.MINOR,5)}},
    {time:3200, callback: function() {Game.director.spawnEnemy(ENUM.MAJOR,3)}}*/
  ]
}

Game.minorEnemyStat = {
  m: 2,
  r: 5,
  vx: 0,
  vy: 1,
  cor: 0.5,
  hth: 100,
  takesPhysDmg: true,
  strokeStyle: 'rgba(255,100,100,1)',
  fillStyle: 'rgba(255,0,0,0.2)'
}

Game.majorEnemyStat = {
  m: 20,
  r: 20,
  vx: 0,
  vy: 1,
  cor: 0.5,
  hth: 500,
  takesPhysDmg: true,
  strokeStyle: 'rgba(255,0,255,1)',
  fillStyle: 'rgba(255,0,255,0.3)'
}

enemyInfo = []
enemyInfo[ENUM.PLAYER] = Game.playerStat
enemyInfo[ENUM.MINOR]  = Game.minorEnemyStat
enemyInfo[ENUM.MAJOR] = Game.majorEnemyStat

var canvas;
var context;
var output_canvas;
var output_context;
