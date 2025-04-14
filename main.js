let canvas;

const vsSource = `
  attribute vec2 aPosition;
  attribute vec2 aTexCoord;
  varying vec2 vTexCoord;
  void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
    vTexCoord = aTexCoord;
  }
`;

const fsSource = `
  precision mediump float;
  varying vec2 vTexCoord;
  uniform sampler2D uTexture;
  void main() {
    gl_FragColor = texture2D(uTexture, vTexCoord);
  }
`;

function compileShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(vsSource, fsSource) {
  const vs = compileShader(gl.VERTEX_SHADER, vsSource);
  const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);

  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    return null;
  }
  return program;
}

let gl;
let texture;

const texWidth = 16;
const texHeight = 32;

let pixelData = new Uint8Array(texWidth * texHeight * 3);

let gameField = new Array(texHeight * texHeight);

function setupWebGL() {

  gl = canvas.getContext("webgl");

  if (!gl) {
    alert("WebGL not supported!");
  }

  const program = createProgram(vsSource, fsSource);
  gl.useProgram(program);

  const vertices = new Float32Array([
    -1, -1,   0, 0,
     1, -1,   1, 0,
    -1,  1,   0, 1,
     1,  1,   1, 1,
  ]);

  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  const aPosition = gl.getAttribLocation(program, 'aPosition');
  const aTexCoord = gl.getAttribLocation(program, 'aTexCoord');

  gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 16, 0);

  gl.enableVertexAttribArray(aTexCoord);
  gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 16, 8);

  texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}

function generateField() {
  // for (let i = 0; i < gameField.length - 3 * (texWidth * texHeight / 2); i++) {
  //   gameField[i] = Math.ceil(Math.random() * 10000) % 5 == 0;
  // }
  for (let i = 0; i < gameField.length; i++) {
    gameField[i] = false;
    // if (i < texWidth * 2 - 1 && i != texWidth - 1) {
    //   gameField[i] = true;
    // }
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

function onRender() {
  // updateTexture();
  cur_figure.draw();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGB,
    texWidth,
    texHeight,
    0,
    gl.RGB,
    gl.UNSIGNED_BYTE,
    pixelData
  );

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

let cur_point = { x: texWidth / 2, y: texHeight - 1 };

function drawPoint(point, cur) {
  let idx = point.x + point.y * texWidth;

  pixelData[idx * 3] = cur;
  pixelData[idx * 3 + 1] = cur;
  pixelData[idx * 3 + 2] = cur;

}

function drawToField(point, state = true) {
  gameField[point.x + point.y * texWidth] = state;
  drawPoint(point, state ? 0 : 255);
  }

// function movePoint(dx, dy) {
//   if ((cur_point.x + dx < 0) || (cur_point.x + dx > texWidth - 1)
//     || (cur_point.y + dy < 0) || (cur_point.y + dy > texWidth - 1)
//     || (gameField[(cur_point.x + dx) + (cur_point.y + dy) * texWidth])) {
//     return;
//   }
//
//   gameField[cur_point.x + cur_point.y * texWidth] = false;
//   cur_point.x += dx;
//   cur_point.y += dy;
//   gameField[cur_point.x + cur_point.y * texWidth] = true;
// }

class Figure {
  shadow = [];
  points = [];
  states = [];
  cur_state = 0;
  max_states = 0;

  is_movable = true;

  x = 0;
  y = 0;

  constructor(x, y, states) {
    this.x = x;
    this.y = y;
    this.states = states;
    this.max_states = states.length;
    const state = this.states[this.cur_state];
    for (let i = 0; i < state.length; ++i) {
      this.points.push({
        x: this.x + state[i].x,
        y: this.y + state[i].y
      });
    }

  }

  use_state() {

    const state = this.states[this.cur_state];
    for (let i = 0; i < state.length; ++i) {
      this.points[i].x = this.x + state[i].x;
      this.points[i].y = this.y + state[i].y;
      // this.points.push({
      //   x: this.x + state[i].x,
      //   y: this.y + state[i].y
      // });
    }
  }

  next_rotate() {
    if (!this.is_movable) return;

    this.clear_state();
    let old_cur = this.cur_state;

    this.cur_state++;
    if (this.cur_state >= this.max_states) {
      this.cur_state = 0;
    }

    let old_points  = this.points;
    this.points = [];

    const state = this.states[this.cur_state];
    for (let i = 0; i < state.length; ++i) {
      if (this.x + state[i].x < 0 || this.y + state[i].y < 0 
        || this.x + state[i].x > texWidth - 1 || this.y + state[i].y > texHeight - 1
        || this.is_other_wall(this.x + state[i].x, this.y + state[i].y)) {
        this.cur_state = old_cur;
        this.points = old_points;
        return;
      }

      this.points.push({
        x: this.x + state[i].x,
        y: this.y + state[i].y
      });
    }
    this.updateShadow();
  }

  clear_state() {
    for (let i = 0; i < this.shadow.length; ++i) {
      drawPoint(this.shadow[i], 255);
    }
    for (let i = 0; i < this.points.length; ++i) {
      drawToField(this.points[i], false);
    }
  }

  draw() {
    for (let i = 0; i < this.shadow.length; ++i) {
      drawPoint(this.shadow[i], 192);
    }
    for (let i = 0; i < this.points.length; ++i) {
      drawToField(this.points[i], true);
    }
  }

  move(dx, dy) {
    if (!this.is_movable) return;

    for (let i = 0; i < this.points.length; ++i) {
      if (this.points[i].x + dx < 0 || this.points[i].y + dy < 0 
        || this.points[i].x + dx > texWidth - 1 || this.points[i].y + dy > texHeight - 1
        || this.is_other_wall(this.points[i].x + dx, this.points[i].y + dy)) {

        if (this.is_other_wall(this.points[i].x, this.points[i].y + dy) || this.points[i].y + dy <= 0) {
          this.is_movable = false;
        }
        return;
      }
    }

    this.clear_state();

    this.x += dx;
    this.y += dy;

    this.use_state();
    this.updateShadow();
  }

  updateShadow() {
    this.shadow = [];
    for (let i = 0; i < this.points.length; ++i) {
      let px = this.points[i].x;
      let py = this.points[i].y;
      for (let k = py - 1; k >= 0; --k) {
        if (gameField[px + k * texWidth]) continue;
        this.shadow.push({ x: px, y: k });
      }
    }
  }

  is_other_wall(x, y) {
    return (gameField[x + y * texWidth] && !this.is_point_into(x, y));
  }

  is_point_into(x, y) {
    for (let i = 0; i < this.points.length; ++i) {
      if (this.points[i].x == x && this.points[i].y == y) {
        return true;
      }
    }
    return false;
  }
}

class Cube extends Figure {
  constructor(x, y) {
    super(x, y, [
      [ {x: 0, y: 0}, {x: 0, y: 1}, {x: 1, y: 0}, {x: 1, y: 1} ]
    ]);
  }
}

class Stick extends Figure {
  constructor(x, y) {
    super(x, y, [
      [ {x: -1, y: 0}, {x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0} ],
      [ {x: 0, y: -1}, {x: 0, y: 0}, {x: 0, y: 1}, {x: 0, y: 2} ]
    ]);
  }
}

class TLike extends Figure {
  constructor(x, y) {
    super(x, y, [
      [ {x: 0, y: 0}, {x: -1, y: 0}, {x: 1, y: 0}, {x: 0, y: 1} ],
      [ {x: 0, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}, {x: 1, y: 0} ],
      [ {x: 0, y: 0}, {x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: -1} ],
      [ {x: 0, y: 0}, {x: 0, y: -1}, {x: 0, y: 1}, {x: -1, y: 0} ]
    ]);
  }
}

class LFstairs extends Figure {
  constructor(x, y) {
    super(x, y, [
      [ {x: 0, y: 0}, {x: -1, y: 0}, {x: 0, y: -1}, {x: 1, y: -1} ],
      [ {x: 0, y: 0}, {x: 1, y: 1}, {x: 1, y: 0}, {x: 0, y: -1} ]
    ]);
  }
}

class RFstairs extends Figure {
  constructor(x, y) {
    super(x, y, [
      [ {x: 0, y: 0}, {x: 1, y: 0}, {x: 0, y: -1}, {x: -1, y: -1} ],
      [ {x: 0, y: 0}, {x: 0, y: -1}, {x: -1, y: 0}, {x: -1, y: 1} ]
    ]);
  }
}

class RLike extends Figure {
  constructor(x, y) {
    super(x, y, [
      [ {x: 0, y: 0}, {x: -1, y: 0}, {x: -1, y: 1}, {x: 1, y: 0} ],
      [ {x: 0, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}, {x: 0, y: -1} ],
      [ {x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: -1}, {x: -1, y: 0} ],
      [ {x: 0, y: 0}, {x: 0, y: -1}, {x: -1, y: -1}, {x: 0, y: 1} ]
    ]);
  }
}

class LLike extends Figure {
  constructor(x, y) {
    super(x, y, [
      [ {x: 0, y: 0}, {x: -1, y: 0}, {x: -1, y: -1}, {x: 1, y: 0} ],
      [ {x: 0, y: 0}, {x: 0, y: 1}, {x: -1, y: 1}, {x: 0, y: -1} ],
      [ {x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: 1}, {x: -1, y: 0} ],
      [ {x: 0, y: 0}, {x: 0, y: -1}, {x: 1, y: -1}, {x: 0, y: 1} ]
    ]);
  }
}

let spawn_Y = Math.floor(texHeight * (9/10) + 2);

console.log("Spawn Y: " + spawn_Y);

function getRandX() {
  return (Math.floor(Math.random() * 10000) % (texWidth - 4)) + 2;
}

let cur_figure;

function nextFigure() {
  let next = Math.floor(Math.random() * 6);
  switch (next) {
  case 0:
    cur_figure = new Cube(getRandX(), spawn_Y);
    break;
  case 1:
    cur_figure = new Stick(getRandX(), spawn_Y);
    break;
  case 2:
    cur_figure = new TLike(getRandX(), spawn_Y);
    break;
  case 3:
    cur_figure = new LFstairs(getRandX(), spawn_Y);
    break;
  case 4:
    cur_figure = new RFstairs(getRandX(), spawn_Y);
    break;
  case 5:
    cur_figure = new RLike(getRandX(), spawn_Y);
    break;
  case 6:
    cur_figure = new LLike(getRandX(), spawn_Y);
    break;
  }
}

let score_element;
let score = 0;

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
    updateField();
  }
}

function mainLoop() {

  cur_figure.move(0, -1);
  // cur_figure.draw();

  if (!cur_figure.is_movable) {
    updateField();    
    updateTexture();
    nextFigure(); 
  }

  // updateTexture();
}

let main_loop_id;
let main_render_id;

document.addEventListener('keypress', function(event) {
  // console.log(event.keyCode);

  if (event.keyCode == 97) {          // a
    cur_figure.move(-1, 0);
    // alert('a');
  } else if (event.keyCode == 100) {  // d
    cur_figure.move(1, 0);
    // alert('d');
  } else if (event.keyCode == 119) {  // w
    // cur_figure.move(0, 1);
    // alert('w');
  } else if (event.keyCode == 115) {  // s
    cur_figure.move(0, -1);
    // alert('s');
  } else if (event.keyCode == 114) {  // r 
    cur_figure.next_rotate();

  } else if (event.keyCode == 103) {  // g
    clearInterval(main_loop_id);
    clearInterval(main_render_id);
    alert('Game stop, reload page for restart');
  } 
});

document.addEventListener('DOMContentLoaded', function() {
  canvas = document.getElementById("glCanvas");
  score_element = document.getElementById("score");

  setupWebGL();

  generateField();

  nextFigure();

  main_loop_id = setInterval(mainLoop, 500);

  main_render_id = setInterval(onRender, 10);
});
