const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl");

if (!gl) {
  alert("WebGL not supported!");
}

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

const texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

const texWidth = 32;
const texHeight = 32;

let pixelData = new Uint8Array(texWidth * texHeight * 3);

let gameField = new Array(texHeight * texHeight);

function generateField() {
  for (let i = 0; i < gameField.length - 32 * 16; i++) {
    gameField[i] = Math.ceil(Math.random() * 10000) % 5 == 0;
  }
}

function updateTexture() {
  
  for (let i = 0; i < pixelData.length; i += 3) {
    let cur = gameField[i / 3] ? 0 : 255;
    pixelData[i] = cur;
    pixelData[i + 1] = cur;
    pixelData[i + 2] = cur;
  }

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

function drawPoint(point, state = true) {
  gameField[point.x + point.y * texWidth] = state;

  updateTexture();
}

function movePoint(dx, dy) {
  if ((cur_point.x + dx < 0) || (cur_point.x + dx > texWidth - 1)
    || (cur_point.y + dy < 0) || (cur_point.y + dy > texWidth - 1)
    || (gameField[(cur_point.x + dx) + (cur_point.y + dy) * texWidth])) {
    return;
  }

  gameField[cur_point.x + cur_point.y * texWidth] = false;
  cur_point.x += dx;
  cur_point.y += dy;
  gameField[cur_point.x + cur_point.y * texWidth] = true;
}

class Figure {
  points = [];
  states = [];
  cur_state = 0;
  max_states = 0;

  x = 0;
  y = 0;

  constructor(x, y, states) {
    this.x = x;
    this.y = y;
    this.states = states;
    this.max_states = states.length;
    this.use_state();
  }

  use_state() {
    this.points = [];

    const state = this.states[this.cur_state];
    for (let i = 0; i < state.length; ++i) {
      this.points.push({
        x: this.x + state[i].x,
        y: this.y + state[i].y
      });
    }
  }

  next_rotate() {
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
    }  }

  clear_state() {
    for (let i = 0; i < this.points.length; ++i) {
      drawPoint(this.points[i], false);
    }
  }

  draw() {
    for (let i = 0; i < this.points.length; ++i) {
      drawPoint(this.points[i], true);
    }
  }

  move(dx, dy) {
    for (let i = 0; i < this.points.length; ++i) {
      if (this.points[i].x + dx < 0 || this.points[i].y + dy < 0 
        || this.points[i].x + dx > texWidth - 1 || this.points[i].y + dy > texHeight - 1
        || this.is_other_wall(this.points[i].x + dx, this.points[i].y + dy)) {
        return;
      }
    }

    this.clear_state();

    this.x += dx;
    this.y += dy;

    this.use_state();
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

let cube = new Figure(20, 25, [
  [ {x: 0, y: 0}, {x: 0, y: 1}, {x: 1, y: 0}, {x: 1, y: 1} ]
]);

let stick = new Figure(20, 25, [
  [ {x: -1, y: 0}, {x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0} ],
  [ {x: 0, y: -1}, {x: 0, y: 0}, {x: 0, y: 1}, {x: 0, y: 2} ]
]);

let tlike = new Figure(20, 25, [
  [ {x: 0, y: 0}, {x: -1, y: 0}, {x: 1, y: 0}, {x: 0, y: 1} ],
  [ {x: 0, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}, {x: 1, y: 0} ],
  [ {x: 0, y: 0}, {x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: -1} ],
  [ {x: 0, y: 0}, {x: 0, y: -1}, {x: 0, y: 1}, {x: -1, y: 0} ]
]);

let lfstair = new Figure(20, 25, [
  [ {x: 0, y: 0}, {x: -1, y: 0}, {x: 0, y: -1}, {x: 1, y: -1} ],
  [ {x: 0, y: 0}, {x: 1, y: 1}, {x: 1, y: 0}, {x: 0, y: -1} ]
]);

let rfstair = new Figure(20, 25, [
  [ {x: 0, y: 0}, {x: 1, y: 0}, {x: 0, y: -1}, {x: -1, y: -1} ],
  [ {x: 0, y: 0}, {x: 0, y: -1}, {x: -1, y: 0}, {x: -1, y: 1} ]
]);

let cur_figure = rfstair;


// let figure = [
//   { x: texWidth / 2, y: texHeight - 1 },
//   { x: (texWidth / 2) - 1, y: texHeight - 1 },
//   { x: (texWidth / 2) + 1, y: texHeight - 1 },
//   { x: texWidth / 2, y: texHeight - 2 }
// ]
//
// let figure_state = 0;
//
// function movePointInFigure(figure, i, dx, dy) {
//   if ((figure[i].x + dx < 0) || (figure[i].x + dx > texWidth - 1)
//     || (figure[i].y + dy < 0) || (figure[i].y + dy > texWidth - 1)) {
//     return figure;
//   }
//
//   gameField[figure[i].x + figure[i].y * texWidth] = false;
//   figure[i].x += dx;
//   figure[i].y += dy;
//   gameField[figure[i].x + figure[i].y * texWidth] = true;
//   return figure;
// }
//
// function isFigureContains(x, y) {
//   for (let i = 0; i < figure.length; ++i) {
//     if (figure[i].x == x && figure[i].y == y) {
//       return true;
//     }
//   }
//   return false;
// }
// function moveFigure(dx, dy) {
//   for (let i = 0; i < figure.length; ++i) {
//     if ((figure[i].x + dx < 0) || (figure[i].x + dx > texWidth - 1)
//       || (figure[i].y + dy < 0) || (figure[i].y + dy > texWidth - 1)
//       || ((gameField[(figure[i].x + dx) + (figure[i].y + dy) * texWidth]) && !isFigureContains(figure[i].x + dx, figure[i].y + dy))) {
//       console.log('can\'t move!');
//       return;
//     }
//   }
//
//   for (let i = 0; i < figure.length; ++i) {
//     gameField[figure[i].x + figure[i].y * texWidth] = false;
//     figure[i].x += dx;
//     figure[i].y += dy;
//     gameField[figure[i].x + figure[i].y * texWidth] = true;
//   }
// }
//
// function rotateFigure() {
//   if (figure_state == 0) {
//     figure = movePointInFigure(figure, 1, 1, 1);
//     ++figure_state;
//   } else if (figure_state == 1) {
//     figure = movePointInFigure(figure, 3, -1, 1);
//     ++figure_state;
//   } else if (figure_state == 1) {
//     figure = movePointInFigure(figure, 2, -1, -1);
//     ++figure_state;
//   } else {
//     figure = movePointInFigure(figure, 1, 1, -1);
//     figure_state = 0;
//   }
// }

function mainLoop() {
  //movePoint(0, -1);
  //drawPoint();

  cur_figure.draw();
  updateTexture();
}

generateField();

const main_loop_id = setInterval(mainLoop, 100);

document.addEventListener("keypress", function(event) {
  console.log(event.keyCode);

  if (event.keyCode == 97) {          // a
    cur_figure.move(-1, 0);
    // alert('a');
  } else if (event.keyCode == 100) {  // d
    cur_figure.move(1, 0);
    // alert('d');
  } else if (event.keyCode == 119) {  // w
    cur_figure.move(0, 1);
    // alert('w');
  } else if (event.keyCode == 115) {  // s
    cur_figure.move(0, -1);
    // alert('s');
  } else if (event.keyCode == 114) {  // r 
    cur_figure.next_rotate();

  } else if (event.keyCode == 103) {   // g
    clearInterval(main_loop_id);
    alert('Game stop, reload page for restart');
  } 
});
