let canvas;

let gl;
let texture;

let texWidth;
let texHeight;

let pixelData;

let gameField;

let spawn_Y;

let cur_figure;

let score_element;
let record_element;
let score = 0;

let main_loop_id;
let main_render_id;

function initSize(width) {
  texWidth  = width;
  texHeight = width * 2;

  pixelData = new Uint8Array(texWidth * texHeight * 3);

  gameField = new Array(texHeight * texHeight);

  spawn_Y = Math.floor(texHeight * (11/12));

  setCookie('size', texWidth, 365)

  updateRecord()
}

function updateRecord() {
  record_element.textContent = "The local record for current size: " + getScore(texWidth)
}

function generateField() {
  for (let i = 0; i < gameField.length; i++) {
    gameField[i] = false;
  }
  updateTexture();
}

function updateTexture() {
  
  for (let i = 0; i < pixelData.length; i += 3) {
    let cur = gameField[i / 3] ? 0 : 255;
    pixelData[i] = cur;
    pixelData[i + 1] = cur;
    pixelData[i + 2] = cur;
  } 
}

function updateField() {
  for (let i = 0; i < texHeight; i++) {
    let line = true;
    for (let j = 0; j < texWidth; ++j) {
      if (!gameField[j + i * texWidth]) {
        line = false;
        break;
      }
    }

    if (!line) continue;
    
    for (let k = i; k < texHeight - 1; ++k) {
      for (let j = 0; j < texWidth; ++j) {
        gameField[j + k * texWidth] = gameField[j + (k + 1) * texWidth];
      }
    }

    i = 0;
    score++;
    score_element.textContent = "Score: " + score;
    if (getScore(texWidth) < score) {
      setScore(score, texWidth);
      updateRecord()
    }
    updateField();
  }
}

function mainLoop() {

  cur_figure.move(0, -1);

  if (!cur_figure.is_movable) {
    updateField();    
    updateTexture();
    nextFigure(); 
  }
}

function updateResolution(e) {
  cur_width = e.target.options[e.target.selectedIndex].value;

  initSize(cur_width);
  
  generateField();

  nextFigure();
}

document.addEventListener('keypress', function(event) {
  // console.log(event.keyCode);

  if (event.keyCode == 97) {          // a
    cur_figure.move(-1, 0);

  } else if (event.keyCode == 100) {  // d
    cur_figure.move(1, 0);

  } else if (event.keyCode == 115) {  // s
    cur_figure.move(0, -1);

  } else if (event.keyCode == 114) {  // r 
    cur_figure.next_rotate();

  } else if (event.keyCode == 103) {  // g
    clearInterval(main_loop_id);
    clearInterval(main_render_id);
    alert('Game stop, reload page for restart');
  } 
});

const resolutions = [ 8, 12, 16, 20 ];

document.addEventListener('DOMContentLoaded', function() {
  canvas = document.getElementById("glCanvas");
  score_element = document.getElementById("score");
  record_element = document.getElementById("record")

  initSize(Number(getCookie('size')) == 0 ? 8 : Number(getCookie('size')));

  let select = document.getElementById("selectElement");
  
  for (let i = 0; i < resolutions.length; ++i) {
    var opt = document.createElement('option');
    opt.value = resolutions[i];
    opt.innerHTML = resolutions[i] + "x" + resolutions[i] * 2;

    select.appendChild(opt);
  }

  select.selectedIndex = (texWidth - 8) / 4;

  select.addEventListener('change', updateResolution);

  setupWebGL();

  generateField();

  nextFigure();

  main_loop_id = setInterval(mainLoop, 500);

  main_render_id = setInterval(onRender, 10);
});
