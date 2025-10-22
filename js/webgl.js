class SimpleRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

    if (!this.gl) {
      throw new Error("WebGL nije podržan u ovom pregledaču");
    }

    this.initShaders();
    this.setupBuffers();
    this.setupViewport();

    console.log("SimpleRenderer uspešno inicijalizovan");
  }

  initShaders() {
    // Vertex shader
    const vertexShaderSource = `
            attribute vec2 a_position;
            uniform vec2 u_resolution;
            
            void main() {
                vec2 clipSpace = ((a_position / u_resolution) * 2.0) - 1.0;
                gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
            }
        `;

    // Fragment shader
    const fragmentShaderSource = `
            precision mediump float;
            uniform vec4 u_color;
            
            void main() {
                gl_FragColor = u_color;
            }
        `;

    const vertexShader = this.createShader(
      this.gl.VERTEX_SHADER,
      vertexShaderSource
    );
    const fragmentShader = this.createShader(
      this.gl.FRAGMENT_SHADER,
      fragmentShaderSource
    );

    this.program = this.createProgram(vertexShader, fragmentShader);

    // Pronađi lokacije
    this.positionLocation = this.gl.getAttribLocation(
      this.program,
      "a_position"
    );
    this.resolutionLocation = this.gl.getUniformLocation(
      this.program,
      "u_resolution"
    );
    this.colorLocation = this.gl.getUniformLocation(this.program, "u_color");
  }

  createShader(type, source) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error(
        "Greška pri kompajliranju shadera:",
        this.gl.getShaderInfoLog(shader)
      );
      this.gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  createProgram(vertexShader, fragmentShader) {
    const program = this.gl.createProgram();
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error(
        "Greška pri linkovanju programa:",
        this.gl.getProgramInfoLog(program)
      );
      this.gl.deleteProgram(program);
      return null;
    }

    return program;
  }

  setupBuffers() {
    this.positionBuffer = this.gl.createBuffer();
  }

  setupViewport() {
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.clearColor(0.95, 0.95, 0.95, 1.0);
  }

  clear() {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  drawPoints(vertices, color = [0, 0, 1, 1], size = 8) {
    this.gl.useProgram(this.program);

    // Postavi pozicije
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(vertices),
      this.gl.STATIC_DRAW
    );

    // Omogući pozicioni atribut
    this.gl.enableVertexAttribArray(this.positionLocation);
    this.gl.vertexAttribPointer(
      this.positionLocation,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    );

    // Postavi rezoluciju i boju
    this.gl.uniform2f(
      this.resolutionLocation,
      this.canvas.width,
      this.canvas.height
    );
    this.gl.uniform4f(this.colorLocation, ...color);

    // Postavi veličinu tačke
    this.gl.uniform1f(
      this.gl.getUniformLocation(this.program, "u_pointSize"),
      size
    );

    // Crtaj tačke
    this.gl.drawArrays(this.gl.POINTS, 0, vertices.length / 2);
  }

  drawGrid() {
    const gridSize = 50;
    const width = this.canvas.width;
    const height = this.canvas.height;

    const lines = [];

    // Vertikalne linije
    for (let x = 0; x <= width; x += gridSize) {
      lines.push(x, 0, x, height);
    }

    // Horizontalne linije
    for (let y = 0; y <= height; y += gridSize) {
      lines.push(0, y, width, y);
    }

    if (lines.length > 0) {
      this.gl.useProgram(this.program);

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
      this.gl.bufferData(
        this.gl.ARRAY_BUFFER,
        new Float32Array(lines),
        this.gl.STATIC_DRAW
      );

      this.gl.enableVertexAttribArray(this.positionLocation);
      this.gl.vertexAttribPointer(
        this.positionLocation,
        2,
        this.gl.FLOAT,
        false,
        0,
        0
      );

      this.gl.uniform2f(
        this.resolutionLocation,
        this.canvas.width,
        this.canvas.height
      );
      this.gl.uniform4f(this.colorLocation, 0.8, 0.8, 0.8, 0.5);

      this.gl.drawArrays(this.gl.LINES, 0, lines.length / 2);
    }
  }

  screenToWorld(screenX, screenY) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: screenX - rect.left,
      y: screenY - rect.top,
    };
  }

  // Za zadavanje snapa — vraća najbliže koordinate preseka mreže
  snapToGrid(x, y, step = 50) {
    const sx = Math.round(x / step) * step;
    const sy = Math.round(y / step) * step;
    return { x: sx, y: sy };
  }

  // Iscrtavanje malog kružića oko tačke (popunjen krug)
  drawCircle(x, y, radius = 6, color = [0, 0, 1, 1], segments = 24) {
    const vertices = [];
    // Centar
    vertices.push(x, y);
    // Obruč
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const vx = x + Math.cos(theta) * radius;
      const vy = y + Math.sin(theta) * radius;
      vertices.push(vx, vy);
    }

    this.gl.useProgram(this.program);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(vertices),
      this.gl.STATIC_DRAW
    );

    this.gl.enableVertexAttribArray(this.positionLocation);
    this.gl.vertexAttribPointer(
      this.positionLocation,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    );

    this.gl.uniform2f(
      this.resolutionLocation,
      this.canvas.width,
      this.canvas.height
    );
    this.gl.uniform4f(this.colorLocation, ...color);

    this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, vertices.length / 2);
  }

  // Crtanje linije između dve tačke
  drawLine(x1, y1, x2, y2, color = [0, 0, 0, 1], width = 1) {
    const vertices = [x1, y1, x2, y2];

    this.gl.useProgram(this.program);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(vertices),
      this.gl.STATIC_DRAW
    );

    this.gl.enableVertexAttribArray(this.positionLocation);
    this.gl.vertexAttribPointer(
      this.positionLocation,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    );

    this.gl.uniform2f(
      this.resolutionLocation,
      this.canvas.width,
      this.canvas.height
    );
    this.gl.uniform4f(this.colorLocation, ...color);

    this.gl.drawArrays(this.gl.LINES, 0, 2);
  }

  // Crtanje trougla (za oslonce)
  drawTriangle(x, y, size = 8, color = [1, 0, 0, 1]) {
    const vertices = [
      x,
      y - size, // Vrh trougla
      x - size,
      y + size, // Levo dno
      x + size,
      y + size, // Desno dno
    ];

    this.gl.useProgram(this.program);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(vertices),
      this.gl.STATIC_DRAW
    );

    this.gl.enableVertexAttribArray(this.positionLocation);
    this.gl.vertexAttribPointer(
      this.positionLocation,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    );

    this.gl.uniform2f(
      this.resolutionLocation,
      this.canvas.width,
      this.canvas.height
    );
    this.gl.uniform4f(this.colorLocation, ...color);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
  }
}
