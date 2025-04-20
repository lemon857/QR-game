let canvas

let gl
let texture

let texWidth
let texHeight

let pixelData

let gameField

let spawn_Y

let cur_figure

let score_element
let record_element
let shadow_switcher
let score = 0

let main_loop_id
let main_render_id

let enable_shadows = true

let colors = [ 
  {R: 255, G: 255, B: 255},
  {R: 8, G: 242, B: 242},
  {R: 8, G: 8, B: 242},
  {R: 240, G: 166, B: 2},
  {R: 242, G: 242, B: 8},
  {R: 2, G: 242, B: 2},
  {R: 242, G: 8, B: 2},
  {R: 166, G: 2, B: 242}
]

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
    gameField[i] = 0;
  }
  updateTexture();
}

function updateTexture() {
  
  for (let i = 0; i < pixelData.length; i += 3) {
    let cur = gameField[i / 3];
    pixelData[i] = colors[cur].R;
    pixelData[i + 1] = colors[cur].G;
    pixelData[i + 2] = colors[cur].B;
  } 
}

function updateField() {
  for (let i = 0; i < texHeight; i++) {
    let line = true;
    for (let j = 0; j < texWidth; ++j) {
      if (gameField[j + i * texWidth] == 0) {
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

let lose_flag = false

function mainLoop() {

  cur_figure.move(0, -1)

  if (lose_flag && cur_figure.y >= spawn_Y) {
    stopGame()
    return
  }

  if (!cur_figure.is_movable) {
    updateField()
    updateTexture()
    nextFigure()
    lose_flag = true
  } else {
    lose_flag = false
  }
}

function updateResolution(e) {
  e.target.blur()
  cur_width = e.target.options[e.target.selectedIndex].value;

  initSize(cur_width);
  
  generateField();

  nextFigure();
}

function startGame() {
  generateField();

  nextFigure();

  main_loop_id = setInterval(mainLoop, 500);

  main_render_id = setInterval(onRender, 10);

}

function stopGame() {
  lose_flag = false
  clearInterval(main_loop_id)
  clearInterval(main_render_id)
  // alert('Game stop, reload page for restart, your record: ' + score)
}

function restartGame() {
  stopGame()

  startGame()  
}

document.addEventListener('keypress', function(event) {
  // console.log(event.key);

  if (event.key == 'a') {          // a
    cur_figure.move(-1, 0)

  } else if (event.key == 'd') {  // d
    cur_figure.move(1, 0)

  } else if (event.key == 's') {  // s
    cur_figure.move(0, -1)

  } else if (event.key == 'r') {  // r 
    cur_figure.next_rotate()

  } else if (event.key == 'g') {  // g
    stopGame()
   
  } else if (event.key == ' ') {
    cur_figure.drop()
  }
});

const resolutions = [ 8, 12, 16, 20 ]

document.addEventListener('DOMContentLoaded', function() {
  canvas = document.getElementById("glCanvas")
  score_element = document.getElementById("score")
  record_element = document.getElementById("record")

  shadow_switcher = document.getElementById("shadowSwitch")

  shadow_switcher.addEventListener('change', function() {
    shadow_switcher.blur()
    if (shadow_switcher.checked) {
      enable_shadows = true
      setCookie('enable_shadows', 'true')
    } else {
      enable_shadows = false
      setCookie('enable_shadows', 'false')
    }
  })

  // console.log(getCookie('enable_shadows'))
  enable_shadows = (getCookie('enable_shadows') == 'true')
  shadow_switcher.checked = enable_shadows
  
  initSize(Number(getCookie('size')) == 0 ? 8 : Number(getCookie('size')))

  let select = document.getElementById("selectElement")
  
  for (let i = 0; i < resolutions.length; ++i) {
    var opt = document.createElement('option')
    opt.value = resolutions[i]
    opt.innerHTML = resolutions[i] + "x" + resolutions[i] * 2

    select.appendChild(opt)
  }

  select.selectedIndex = (texWidth - 8) / 4

  select.addEventListener('change', updateResolution)

  setupWebGL()

  startGame()

 });
