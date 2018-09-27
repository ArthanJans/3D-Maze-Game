(function(){
  
  var checkbox;
  var buttons;
  var canvas;
  var ctx;
  var width;
  var height;
  var mapSize;
  var interval;
  var viewDistance = 15;
  var chests = {};
  var version = "1";
  var textBoxText = "";
  var rectEasy = {};
  var hasNextPage = false;
  var hasPrevPage = false;
  var rectNext = {};
  var rectPrev = {};
  var rectNormal = {};
  var rectHard = {};
  var page = 0;
  var difficulty;
  var timer = 0;
  var char = {
    x : 1,
    y : 1,
    facing : 0,
    rotateTimer : 0,
    stepTime : 0,
    compass : false,
    map : false,
    pickaxe : 0,
  };
  var visitedTiles = [];
  var map = [];
  var tiles = {"w":{"colour":"#8B8589", "shadow":"#454244", "collision":"true"},"g":{"colour":"#C0C0C0", "collision":"false"}};
  
  document.addEventListener('DOMContentLoaded', init, false);
  
  function init(){
    canvas = document.querySelector('canvas');
    ctx = canvas.getContext('2d');
    width = canvas.width;
    height = canvas.height;
    titleScreen();
    buttons = document.querySelectorAll('button');
    for(var i=0;i<buttons.length;i++){
      buttons[i].addEventListener('click', button, false);
    }
    checkbox = document.querySelector('input');
    checkbox.addEventListener('change', changed, false);
  }

  function changed(event){
    if(checkbox.checked == true){
      for(var i=0;i<buttons.length;i++){
        buttons[i].style.visibility = "visible";
      }
    }
    else{
      for(var i=0;i<buttons.length;i++){
        buttons[i].style.visibility = "hidden";
      }
    }
  }

  function titleScreen(){
    var gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(1, "#C0C0C0");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "black";
    rectEasy={x:40, y: 40, width: width-80, height: height/3 - 80};
    ctx.fillRect(rectEasy.x, rectEasy.y, rectEasy.width, rectEasy.height);
    rectNormal={x:40, y: height/3 + 40, width: width-80, height: height/3 - 80};
    ctx.fillRect(rectNormal.x, rectNormal.y, rectNormal.width, rectNormal.height);
    rectHard={x:40, y: 2 * height/3 + 40, width: width-80, height: height/3 - 80};
    ctx.fillRect(rectHard.x, rectHard.y, rectHard.width, rectHard.height);
    ctx.font="20px Georgia";
    ctx.fillStyle = "white";
    ctx.textAlign="center";
    ctx.textBaseline="middle";
    ctx.fillText("Easy", width/2, rectEasy.y+(rectEasy.height/2));
    ctx.fillText("Normal", width/2, rectNormal.y+(rectNormal.height/2));
    ctx.fillText("Hard", width/2, rectHard.y+(rectHard.height/2));
    canvas.addEventListener("click", click, false);
  }

  function click(event){
    var mousePos = getMousePos(canvas, event);
    if (isInside(mousePos,rectEasy)) {
      mapSize = 21;
      difficulty = 0;
    }else if(isInside(mousePos,rectNormal)) {
      mapSize = 101;
      difficulty = 1;
    }else if(isInside(mousePos,rectHard)) {
      mapSize = 501;
      difficulty = 2;
    }else{
      return;
    }
    canvas.removeEventListener("click",click);
    start();
  }

  function  getMousePos(canvas, event) {
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width;
    var scaleY = canvas.height / rect.height;
  
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    }
  }

  function isInside(pos, rect){
    return pos.x > rect.x && pos.x < rect.x+rect.width && pos.y < rect.y+rect.height && pos.y > rect.y;
  }

  function start(){
    setup();
    interval = window.setInterval(draw, 33);
    document.addEventListener("keydown", keyIn, false);
  }
  
  function draw(){
    ctx.fillStyle = "#87CEEB";
    ctx.fillRect(0, 0, width, height/2);
    ctx.fillStyle = "#C0C0C0";
    ctx.fillRect(0, height/2, width, height/2);
    draw3dMap();
    drawCompass();
    drawMap();
    drawTextBox();
    drawPickaxes();
  }

  function drawTextBox(){
    if(textBoxText !== ""){
      ctx.fillStyle = "black";
      ctx.fillRect(0, height * (9/10), width, height / 10);
      ctx.font="20px Georgia";
      ctx.fillStyle = "white";
      ctx.textAlign="center";
      ctx.textBaseline="middle";
      ctx.fillText(textBoxText, width / 2, height * (19/20), width - 50);
    }
  }

  function drawPickaxes(){
    if(char.pickaxe > 0){
      ctx.beginPath();
      ctx.fillStyle = "#FFFFFF";
      ctx.arc(width - 105, 30, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.strokeStyle = "#964B00";
      ctx.lineWidth = 3;
      ctx.moveTo(width - 125, 50);
      ctx.lineTo(width - (105 - 17.6776), 30 - 17.6776);
      ctx.stroke();
      ctx.beginPath();
      ctx.strokeStyle = "black";
      ctx.arc(width - 105, 30, 25, 3 * Math.PI / 2, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.fillStyle = "red";
      ctx.arc(width - 80, 50, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.font="20px Georgia";
      ctx.fillStyle = "black";
      ctx.textAlign="center";
      ctx.textBaseline="middle";
      ctx.fillText(char.pickaxe, width - 80, 50);
      ctx.lineWidth = 1;
    }
  }

  function drawCompass(){
    if(char.compass){
      ctx.fillStyle = "black";
      ctx.beginPath();
      ctx.arc(width - 30, 30, 25, 0, 2*Math.PI);
      ctx.fill();
      ctx.font="20px Georgia";
      ctx.fillStyle = "red";
      ctx.textAlign="center"; 
      ctx.fillText("N", width - 30, 22);
      ctx.strokeStyle = "#C0C0C0";
      ctx.lineWidth=2;
      ctx.beginPath();
      ctx.moveTo(width - 30, 30);
      var angle = (char.facing * Math.PI / 2) - (char.rotateTimer * Math.PI / 12);
      ctx.lineTo((width - 30) - 22 * Math.sin(angle), 30 - 22 * Math.cos(angle));
      ctx.stroke();
    }
  }

  function drawMap(){
    if(char.map){
      ctx.fillStyle = "#F8ECC2";
      ctx.fillRect(5, 5, 80, 80);
      if(!visited(char.x, char.y)){
        visitedTiles.push([char.x, char.y]);
      }
      for(var x = char.x - 10; x < char.x + 10; x++){
        for(var y = char.y - 10; y < char.y + 10; y++){
          if(seen(x,y)){
            ctx.fillStyle = tiles [map[y][x]] ["colour"];
            ctx.fillRect(45 + (x-char.x)*4, 45 + (y-char.y)*4, 4, 4);
          }
        }
      }
      ctx.fillStyle = "red";
      ctx.fillRect(45, 45, 4, 4);
    }
  }

  function visited(x,y){
    for(var index = 0; index<visitedTiles.length; index++){
      if(visitedTiles[index][0] === x && visitedTiles[index][1] === y){
        return true;
      }
    }
    return false;
  }

  function seen(x,y){
    for(var i = -1; i < 2; i++){
      for(var j = -1; j < 2; j++){
        if(x < mapSize && y < mapSize && x >= 0 && y >= 0 && visited(x+i,y+j)){
          return true;
        }
      }
    }
    return false;
  }

  function pointToCanvas(distance, xoffset, yoffset){
    var x = (width/2) + 500 * (xoffset / (1+(distance / 1.5)))
    var y = (height/2) - 150 * (yoffset / (1+(distance / 1.5)))
    return [x, y];
  }

  function drawTile3d(tile, x, y, flag){
    if(tiles[tile]["collision"] === "true"){
      distance = 0;
      offset = 0;
      if(char.facing === 0){
        distance = char.y - y;
        offset = x - char.x;
      } else if(char.facing === 1){
        distance = x - char.x;
        offset = y - char.y;
      } else if(char.facing === 2){
        distance = y - char.y;
        offset = char.x - x;
      } else if(char.facing === 3){
        distance = char.x - x;
        offset = char.y - y;
      }
      if(char.stepTime !== 0){
        distance = distance + (char.stepTime/6);
      }
      draw3dCube(distance, offset, tiles[tile]["colour"], tiles[tile]["shadow"], -1 * Math.PI * char.rotateTimer/12, flag);
    } 
    else if([x, y] in chests){
      var chest = chests[[x, y]];
      if(char.facing === 0){
        distance = char.y - y;
        offset = x - char.x;
      } else if(char.facing === 1){
        distance = x - char.x;
        offset = y - char.y;
      } else if(char.facing === 2){
        distance = y - char.y;
        offset = char.x - x;
      } else if(char.facing === 3){
        distance = char.x - x;
        offset = char.y - y;
      }
      if(char.stepTime !== 0){
        distance = distance + (char.stepTime/6);
      }
      drawChest(distance, offset, chest, -1 * Math.PI * char.rotateTimer/12);
    }
  }

  function drawChest(distance, offset, chest, rotation){
    var centerY = ((distance * Math.cos(rotation)) + (offset * Math.sin(rotation)));
    var centerX = ((offset * Math.cos(rotation)) - (distance * Math.sin(rotation)));
    if(centerY < -0.5){
      return;
    }
    if(!chest.opened){
      drawBox(centerX, centerY, -1.5, rotation, 1, 1 / (2 * Math.sqrt(2)), "#964B00", "#964B00", 0);
      drawBox(centerX, centerY, -0.8, rotation, 0.4, 1 / (2 * Math.sqrt(2)), "#964B00", "#964B00", 0);
    } else{
      drawBox(centerX, centerY, -1.5, rotation, 1, 1 / (2 * Math.sqrt(2)), "#964B00", "#964B00", -2);
    }
  }

  function draw3dMap(){
    var f = char.facing;
    var flag = 0;
    if(char.rotateTimer < -2){
      f++;
      if(f == 4){
        f = 0;
      }
      flag = -1;
    } else if(char.rotateTimer > 2){
      f--;
      if(f == -1){
        f = 3;
      }
      flag = 1;
    }
    var farthest = ((f%2) * char.x + ((f+1)%2) * char.y) + (-1 * Math.abs(2 * (f-1.5)) + 2) * viewDistance;
    if(farthest < 0){
      farthest = 0;
    }
    if(farthest >= mapSize){
      farthest = mapSize - 1;
    }
    var closest = ((f%2) * char.x + ((f+1)%2) * char.y) + (Math.abs(2 * (f-1.5)) - 2) * viewDistance;
    if(closest < -1){
      closest = -1;
    }
    if(closest > mapSize){
      closest = mapSize;
    }
    while (farthest !== closest) {
      var leftest = (((f+1)%2) * char.x + (f%2) * char.y) - viewDistance;
      var rightest = (((f+1)%2) * char.x + (f%2) * char.y) + viewDistance;
      if(leftest < 0){
        leftest = 0;
      }
      if(leftest >= mapSize){
        leftest = mapSize-1;
      }
      if(rightest < 0){
        rightest = 0;
      }
      if(rightest >= mapSize){
        rightest = mapSize-1;
      }
      while (leftest !== (((f+1)%2) * char.x + (f%2) * char.y)){
        var tile = map[((f+1)%2) * farthest + ((f)%2) * leftest][((f)%2) * farthest + ((f+1)%2) * leftest];
        drawTile3d(tile, ((f)%2) * farthest + ((f+1)%2) * leftest, ((f+1)%2) * farthest + ((f)%2) * leftest, flag);
        leftest++;
      }
      while (rightest !== (((f+1)%2) * char.x + (f%2) * char.y)){
        var tile = map[((f+1)%2) * farthest + ((f)%2) * rightest][((f)%2) * farthest + ((f+1)%2) * rightest];
        drawTile3d(tile, ((f)%2) * farthest + ((f+1)%2) * rightest, ((f+1)%2) * farthest + ((f)%2) * rightest, flag);
        rightest--;
      }
      var tile = map[((f+1)%2) * farthest + ((f)%2) * char.y][((f+1)%2) * char.x + ((f)%2) * farthest];
      drawTile3d(tile, ((f+1)%2) * char.x + ((f)%2) * farthest, ((f+1)%2) * farthest + ((f)%2) * char.y, flag);
      drawMist(((-1 * Math.abs(2 * (f - 1.5))) + 2) * farthest - ((-1 * Math.abs(2 * (f - 1.5))) + 2) * (((f+1)%2) * char.y + ((f)%2) * char.x));
      farthest += ((Math.abs(2 * (f - 1.5))) - 2)
    }
    if(char.stepTime > 0){
      char.stepTime --;
    } else if(char.stepTime < 0){
      char.stepTime ++;
    }
    if(char.rotateTimer > 0){
      char.rotateTimer -= 1;
    } else if(char.rotateTimer < 0){
      char.rotateTimer += 1;
    }
  }

  function drawMist(distance){
    if(distance > 1){
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 1;
    }
  }

  function draw3dEnemy(distance, offset, rotation){
    var centerY = ((distance * Math.cos(rotation)) + (offset * Math.sin(rotation)));
    var centerX = ((offset * Math.cos(rotation)) - (distance * Math.sin(rotation)));
    if(centerY < -0.5){
      return;
    }

    //LLeg
    drawBox(centerX - 0.0625 * Math.cos(rotation), centerY, -1.625, rotation, 0.75, 1 / 16 * Math.sqrt(2), "green", 0);
    //RLeg
    drawBox(centerX + 0.0625 * Math.cos(rotation), centerY, -1.625, rotation, 0.75, 1 / 16 * Math.sqrt(2), "green", 0);
    // LArm
    drawBox(centerX - 0.1875 * Math.cos(rotation), centerY, -0.75, rotation, 1, 1 / 16 * Math.sqrt(2), "green", 0);
    //RArm
    drawBox(centerX + 0.1875 * Math.cos(rotation), centerY, -0.75, rotation, 1, 1 / 16 * Math.sqrt(2), "green", 0);
    //Body
    drawBox(centerX, centerY, -0.75, rotation, 1, 1 / 8 * Math.sqrt(2), "green", 0);
    //Head
    drawBox(centerX, centerY, 0, rotation, 0.5, 1 / 8 * Math.sqrt(2), "green", 0);
  }

  function drawBox(centerX, centerY, centerZ, rotation, height, radius, colour, shade, faceOrderFlag){
    var pt1 = pointToCanvas(centerY + (radius) * Math.sin((-3 * Math.PI / 4) + rotation), centerX + (radius) * Math.cos((-3 * Math.PI / 4) + rotation), centerZ - height/2)
    var pt2 = pointToCanvas(centerY + (radius) * Math.sin((-1 * Math.PI / 4) + rotation), centerX + (radius) * Math.cos((-1 * Math.PI / 4) + rotation), centerZ - height/2);
    var pt3 = pointToCanvas(centerY + (radius) * Math.sin((Math.PI / 4) + rotation), centerX + (radius) * Math.cos((Math.PI / 4) + rotation), centerZ - height/2);
    var pt4 = pointToCanvas(centerY + (radius) * Math.sin((3 * Math.PI / 4) + rotation), centerX + (radius) * Math.cos((3 * Math.PI / 4) + rotation), centerZ - height/2);
    var pt5 = pointToCanvas(centerY + (radius) * Math.sin((-3 * Math.PI / 4) + rotation), centerX + (radius) * Math.cos((-3 * Math.PI / 4) + rotation), centerZ + height/2)
    var pt6 = pointToCanvas(centerY + (radius) * Math.sin((-1 * Math.PI / 4) + rotation), centerX + (radius) * Math.cos((-1 * Math.PI / 4) + rotation), centerZ + height/2);
    var pt7 = pointToCanvas(centerY + (radius) * Math.sin((Math.PI / 4) + rotation), centerX + (radius) * Math.cos((Math.PI / 4) + rotation), centerZ + height/2);
    var pt8 = pointToCanvas(centerY + (radius) * Math.sin((3 * Math.PI / 4) + rotation), centerX + (radius) * Math.cos((3 * Math.PI / 4) + rotation), centerZ + height/2);
    if(faceOrderFlag === 1){
      drawWall4(pt1[0], pt4[0], pt8[0], pt5[0], pt1[1], pt4[1], pt8[1], pt5[1], colour);
      drawWall4(pt1[0], pt2[0], pt3[0], pt4[0], pt1[1], pt2[1], pt3[1], pt4[1], colour);
      drawWall4(pt5[0], pt6[0], pt7[0], pt8[0], pt5[1], pt6[1], pt7[1], pt8[1], colour);
      drawWall4(pt3[0], pt4[0], pt8[0], pt7[0], pt3[1], pt4[1], pt8[1], pt7[1], colour);
      drawWall4(pt1[0], pt2[0], pt6[0], pt5[0], pt1[1], pt2[1], pt6[1], pt5[1], colour);
      drawWall4(pt2[0], pt3[0], pt7[0], pt6[0], pt2[1], pt3[1], pt7[1], pt6[1], shade);
      return;
    } else if(faceOrderFlag === -1){
      drawWall4(pt2[0], pt3[0], pt7[0], pt6[0], pt2[1], pt3[1], pt7[1], pt6[1], colour);
      drawWall4(pt1[0], pt2[0], pt3[0], pt4[0], pt1[1], pt2[1], pt3[1], pt4[1], colour);
      drawWall4(pt5[0], pt6[0], pt7[0], pt8[0], pt5[1], pt6[1], pt7[1], pt8[1], colour);
      drawWall4(pt3[0], pt4[0], pt8[0], pt7[0], pt3[1], pt4[1], pt8[1], pt7[1], colour);
      drawWall4(pt1[0], pt2[0], pt6[0], pt5[0], pt1[1], pt2[1], pt6[1], pt5[1], colour);
      drawWall4(pt1[0], pt4[0], pt8[0], pt5[0], pt1[1], pt4[1], pt8[1], pt5[1], shade);
      return;
    }
    drawWall4(pt3[0], pt4[0], pt8[0], pt7[0], pt3[1], pt4[1], pt8[1], pt7[1], colour);
    drawWall4(pt1[0], pt2[0], pt3[0], pt4[0], pt1[1], pt2[1], pt3[1], pt4[1], colour);
    if(centerZ + (height / 2) > 0 && faceOrderFlag !== -2){
      drawWall4(pt5[0], pt6[0], pt7[0], pt8[0], pt5[1], pt6[1], pt7[1], pt8[1], colour);
    }
    drawWall4(pt1[0], pt4[0], pt8[0], pt5[0], pt1[1], pt4[1], pt8[1], pt5[1], colour);
    drawWall4(pt2[0], pt3[0], pt7[0], pt6[0], pt2[1], pt3[1], pt7[1], pt6[1], colour);
    if(centerZ + (height / 2) <= 0 && faceOrderFlag !== -2){
      drawWall4(pt5[0], pt6[0], pt7[0], pt8[0], pt5[1], pt6[1], pt7[1], pt8[1], colour);
    }
    drawWall4(pt1[0], pt2[0], pt6[0], pt5[0], pt1[1], pt2[1], pt6[1], pt5[1], shade);
  }

  function draw3dCube(distance, offset, colour, shade, rotation, flag){
    var centerY = ((distance * Math.cos(rotation)) + (offset * Math.sin(rotation)));
    var centerX = ((offset * Math.cos(rotation)) - (distance * Math.sin(rotation)));
    if(centerY < -0.5){
      return;
    }
    drawBox(centerX, centerY, 2, rotation, 8, 1 / Math.sqrt(2), colour, shade, flag);
  }

  function drawWall4(x1, x2, x3, x4, y1, y2, y3, y4, colour){
    ctx.fillStyle = colour;
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.lineTo(x4, y4);
    ctx.lineTo(x1, y1);
    ctx.fill();
    ctx.stroke();
  }

  function drawWall2(x1, x2, y1, y2, colour){
    drawWall4(x1, x2, x2, x1, y1, y2, 0, 0, colour);
  }

  function rotatePlayer(dir){
    char.facing = (char.facing + dir) % 4;
    if (char.facing < 0){
      char.facing = 3;
    }
    char.rotateTimer = 6 * dir;
  }

  function movePlayer(dir){
    originalx = char.x;
    originaly = char.y;
    char.x += dir * ((-1 * Math.abs(char.facing - 1)) + 1);
    char.y += dir * ((-1 * Math.abs(char.facing - 2)) + 1);
    if(char.x === mapSize){
      window.alert("Well done! You win!\nYou finished the maze in " + timer + " steps!");
      stop();
      return;
    }
    if(getCollision(char.x, char.y)){
      char.x = originalx;
      char.y = originaly;
      return;
    }
    char.stepTime = 6 * dir;
    timer++;
  }

  function openChest(){
    chestX = char.x + ((-1 * Math.abs(char.facing - 1)) + 1);
    chestY = char.y + ((-1 * Math.abs(char.facing - 2)) + 1);
    if([chestX, chestY] in chests){
      chest = chests[[chestX, chestY]];
      if(!chest.opened){
        getItem(chest.item);
        chest.opened = true;
        return true;
      }
    }
  }

  function breakWall(){
    if(char.pickaxe > 0){
      wallX = char.x + ((-1 * Math.abs(char.facing - 1)) + 1);
      wallY = char.y + ((-1 * Math.abs(char.facing - 2)) + 1);
      if(tiles[map[wallY][wallX]]["collision"] === "true"){
        if(wallX == 0 || wallX == mapSize-1 || wallY == 0 || wallY == mapSize-1){
          textBox("You can't break the outermost wall!");
          return;
        }
        map[wallY][wallX] = "g";
        char.pickaxe -= 1;
      }
    }
  }

  function keyIn(event){
    a = event.keyCode;
    input(a);
  }

  function button(event){
    input(parseInt(this.id));
  }

  function input(num){
    if(char.rotateTimer !== 0 || char.stepTime !== 0){
      return;
    }
    switch(num){
      case 32:
        if(!openChest()){
          breakWall();
        }
        break;
      case 37:
        rotatePlayer(-1);
        break;
      case 38:
        movePlayer(1);
        break;
      case 39:
        rotatePlayer(1);
        break;
      case 40:
        movePlayer(-1);
        break;
      default:
        return;
    }
  }
  
  function getCollision(x,y){
    if(x<0 || y<0 || y>=map.length || x>=map[0].length || tiles[map[y][x]]["collision"] === "true" || [x, y] in chests){
      return true;
    }
  }

  function collisionChest(x, y, flag){
    if(x<0 || y<0 || y>=map.length-1 || x>=map[0].length-1 || tiles[map[y][x]]["collision"] === "true" || (x === char.x && y === char.y && flag)){
      return true;
    }
  }
  
  function makeMaze(){
    var maze=[];
    for(var y=0;y<mapSize;y++){
      row=[];
      for(var x=0;x<mapSize;x++){
        row.push("w");
      }
      maze.push(row);
    }
    var startY=randomMazeLocation(0, 1, 0, mapSize - 1)[1];
    var endY=randomMazeLocation(0, 1, 0, mapSize - 1)[1];
    maze[startY][1]="g";
    char.x=1;
    char.y=startY;
    var walls = addWalls(1,startY,[]);
    while(walls.length>0){
      index = randomNumber(0,walls.length-1)
      wall = walls[index];
      ret=checkWall(wall,maze,walls);
      maze=ret[0];
      walls=ret[1];
      var index = walls.indexOf(wall);
      if(index > -1){
        walls.splice(index,1);
      }
    }
    map=maze;
    addChests();
    maze[endY][mapSize-1] = "g";
    map=maze;
    // addEnemies();
  }

  function addChests(){
    for (var x = 0; x < mapSize; x++){
      for (var y = 0; y < mapSize; y++){
        if(!collisionChest(x, y, true)){
          var adjacentWalls = 0;
          var openSpace = 0;
          for (var i = 0; i < 4; i++){
            x1 = x + ((-1 * Math.abs(i - 1)) + 1);
            y1 = y + ((-1 * Math.abs(i - 2)) + 1);
            if(collisionChest(x1, y1, false)){
              adjacentWalls++;
            } else{
              openSpace = i;
            }
          }
          randomChest = 0;
          if(difficulty == 0){
            randomChest = randomNumber(0, 3);
          } else if(difficulty == 1){
            randomChest = randomNumber(0, 9);
          } else if(difficulty == 2){
            randomChest = randomNumber(0, 12);
          }
          if(adjacentWalls === 3 && randomChest === 0){
            var chest = {
              x : x,
              y : y,
              item : randomNumber(0, 2),
              facing : openSpace,
              opened : false,
            }
            chests[[x, y]] = chest;
          }
        }
      }
    }
  }

  function getItem(item){
    if(item === 0){
      if(!char.compass){
        char.compass = true;
        textBox("You found a compass.");
      }else{
        getItem(1);
      }
    } else if(item === 1){
      char.map = true;
      for(var x = char.x - 10; x < char.x + 10; x++){
        for(var y = char.y - 10; y < char.y + 10; y++){
          if(!visited(x, y) && x > 0 && x < mapSize && y > 0 && y < mapSize){
            visitedTiles.push([x, y]);
          }
        }
      }
      textBox("You found a map.");
    } else if(item === 2){
      char.pickaxe += 1;
      textBox("You found a pickaxe. Press Space in front of a wall to destroy it.");
    }
  }

  function textBox(text){
    setTimeout(removeTextBox, 5000);
    textBoxText = text;
  }

  function removeTextBox(){
    textBoxText = "";
  }
  
  function checkWall(wall,maze,walls){
    if(wall.d==="l" && wall.x>=2 && maze[wall.y][wall.x-2]==="w"){
      maze[wall.y][wall.x-1]="g";
      maze[wall.y][wall.x-2]="g";
      walls=addWalls(wall.x-2,wall.y,walls);
    } else if(wall.d==="u" && wall.y>=2 && maze[wall.y-2][wall.x]==="w"){
      maze[wall.y-1][wall.x]="g";
      maze[wall.y-2][wall.x]="g";
      walls=addWalls(wall.x,wall.y-2,walls);
    } else if(wall.d==="r" && wall.x<maze[0].length-2 && maze[wall.y][wall.x+2]==="w"){
      maze[wall.y][wall.x+1]="g";
      maze[wall.y][wall.x+2]="g";
      walls=addWalls(wall.x+2,wall.y,walls);
    } else if(wall.d==="d" && wall.y < maze.length-2 && maze[wall.y+2][wall.x]==="w"){
      maze[wall.y+1][wall.x]="g";
      maze[wall.y+2][wall.x]="g";
      walls=addWalls(wall.x,wall.y+2,walls);
    }
    return [maze,walls];
  }
  
  function addWalls(x,y,walls){
    if(x-1>=0){
      walls.push({x:x,y:y,d:"l"});
    }
    if(y-1>=0){
      walls.push({x:x,y:y,d:"u"});
    }
    if(x+1<mapSize){
      walls.push({x:x,y:y,d:"r"});
    }
    if(y+1<mapSize){
      walls.push({x:x,y:y,d:"d"});
    }
    return walls;
  }
  
  function stop(){
    clearInterval(interval);
    document.removeEventListener("keydown", keyIn);
    name = window.prompt("Enter your name to save this score in the leaderboard or press cancel to try again!", "anon");
    if(name === 'null'){
      window.location.reload();
    }else{
      while(name.trim() === "" || name.length > 20){
        name = window.prompt("That is not a valid name.", "anon");
      }
      var url = 'submit_score.py';
      request = new XMLHttpRequest();
      request.addEventListener('readystatechange', response, false);
      request.open('POST', url, true);
      request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      request.send("name="+name.trim()+"&score="+timer+"&difficulty="+difficulty+"&version="+version);
      }
  }

  function response() {
    if ( request.readyState === 4 ) {
      if ( request.status === 200 ) {
        if ( request.responseText.trim() === '0' ) {
          getLeaderboard(difficulty);
        } else {
          getLeaderboard(difficulty);
        }
      }
    }
  }

  function getLeaderboard(diff){
    var url = 'leaderboard.py?difficulty='+diff+'&page='+page;
    request = new XMLHttpRequest();
    request.addEventListener('readystatechange', displayLeaderboard, false);
    request.open('GET', url, true);
    request.send(null);
  }

  function displayLeaderboard(){
    if ( request.readyState === 4 ) {
      if ( request.status === 200 ) {
        if ( request.responseText.trim() !== '1' ) {
          ctx.fillStyle = "white";
          ctx.fillRect(20, 20, width - 40, height - 40);
          ctx.font="18px Georgia";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "black";
          ctx.strokeStyle = "black";
          ctx.beginPath();
          var i = 40;
          while (i < height-20){
            ctx.moveTo(20, i);
            ctx.lineTo(width-20, i);
            i += 20;
          }
          ctx.moveTo(width/2, 40);
          ctx.lineTo(width/2, height-20);
          ctx.stroke();
          var title = "";
          if(difficulty == 0){
            title = "Easy Leaderboard";
          } else if(difficulty == 1){
            title = "Normal Leaderboard";
          } else if(difficulty == 2){
            title = "Hard Leaderboard";
          }
          ctx.fillText(title, width/2, 32);
          ctx.fillText("Name", width/4, 52);
          ctx.fillText("Score", 3*width/4, 52);
          result = request.responseText;
          lines = result.split("\n");
          for(var i = 0; i < lines.length; i++){
            line = lines[i];
            if(line === ""){
              break;
            }
            name = line.split(",")[0];
            name = name.substr(1, name.length-2);
            score = line.split(",")[1];
            h = 72 + i*20;
            ctx.fillText(name, width/4, h);
            ctx.fillText(score, 3*width/4, h);
          }
          if(lines.slice(-2,-1)[0][0] == "1"){
            ctx.fillText("Next Page", 3*width/4, height-28);
            hasNextPage = true;
            rectNext = {x: width/2, y: height-40, width: width/2-20, height: 20};
          }
          if(lines.slice(-2,-1)[0][1] == "1"){
            ctx.fillText("Previous Page", width/4, height-28);
            hasPrevPage = true;
            rectPrev = {x: 20, y: height-40, width:width/2-20, height: 20};
          }
          if(hasNextPage || hasPrevPage){
            canvas.addEventListener("click",clickLeaderboard);
          }
        }
      }
    }
  }

  function clickLeaderboard(event){
    var mousePos = getMousePos(canvas, event);
    if (isInside(mousePos, rectNext) && hasNextPage) {
      hasNextPage = false;
      page += 1;
    }else if(isInside(mousePos, rectPrev) && hasPrevPage) {
      hasPrevPage = false;
      page -= 1;
    }else{
      return;
    }
    canvas.removeEventListener("click",clickLeaderboard);
    getLeaderboard(difficulty);
  }
  
  function setup(){
    makeMaze();
  }

  function randomMazeLocation(xStart, yStart, xEnd, yEnd){
    var xOut = randomNumber(xStart, xEnd);
    var yOut = randomNumber(yStart, yEnd);
    if(yOut%2 === 0){
      yOut++;
      if(yOut >= mapSize){
        yOut -= 2;
      }
    }
    if(xOut%2 === 0){
      xOut++;
      if(xOut >= mapSize){
        xOut -= 2;
      }
    }
    return [xOut, yOut];
  }
  
  function randomNumber(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
})();
