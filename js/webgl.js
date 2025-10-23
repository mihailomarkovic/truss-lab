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
    this.gl.clearColor(0.96, 0.96, 0.95, 1.0); // shadcn stone-100
  }

  clear() {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  drawPoints(vertices, color = [0, 0, 1, 1], size = 10) {
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
    const gridSize = 50; // 500px / 10 = 50px po kvadratu
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
      this.gl.uniform4f(this.colorLocation, 0.66, 0.64, 0.62, 0.5); // shadcn stone-400

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

  // Funkcija za rotaciju tačke oko centra (suprotno od kazaljke na satu)
  rotatePoint(x, y, centerX, centerY, angleDegrees) {
    const angleRad = (-angleDegrees * Math.PI) / 180; // Negativan ugao za suprotno od kazaljke
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);

    // Translacija u centar
    const dx = x - centerX;
    const dy = y - centerY;

    // Rotacija
    const rotatedX = dx * cos - dy * sin;
    const rotatedY = dx * sin + dy * cos;

    // Translacija nazad
    return {
      x: rotatedX + centerX,
      y: rotatedY + centerY,
    };
  }

  // Crtanje nepokretnog oslonca (trougao + krug na vrhu)
  drawFixedSupport(x, y, angle = 0) {
    const size = 8 * 1.3; // Povećano za 1.3x
    const triangleHeight = size * 1.5; // Visina trougla

    // Definiši trougao bez rotacije (vrh na poziciji čvora)
    let triangleVertices = [
      x,
      y, // Vrh trougla na poziciji čvora
      x - size,
      y + triangleHeight, // Levo dno
      x + size,
      y + triangleHeight, // Desno dno
    ];

    // Rotuj trougao oko vrha ako je angle != 0
    if (angle !== 0) {
      const rotated = [];
      for (let i = 0; i < triangleVertices.length; i += 2) {
        const rotatedPoint = this.rotatePoint(
          triangleVertices[i],
          triangleVertices[i + 1],
          x, // Centar rotacije je vrh trougla
          y,
          angle
        );
        rotated.push(rotatedPoint.x, rotatedPoint.y);
      }
      triangleVertices = rotated;
    }

    this.gl.useProgram(this.program);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(triangleVertices),
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
    this.gl.uniform4f(this.colorLocation, 0.8, 0.2, 0.2, 1); // shadcn red-600
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);

    // Crtaj krug na vrhu trougla (na poziciji čvora)
    this.drawCircle(x, y, 4, [0.8, 0.2, 0.2, 1], 16); // shadcn red-600
  }

  // Crtanje pokretnog oslonca (trougao + krug + linija ispod)
  drawMovableSupport(x, y, angle = 0) {
    const size = 8 * 1.3; // Povećano za 1.3x
    const triangleHeight = size * 1.5; // Visina trougla

    // Definiši trougao bez rotacije (vrh na poziciji čvora)
    let triangleVertices = [
      x,
      y, // Vrh trougla na poziciji čvora
      x - size,
      y + triangleHeight, // Levo dno
      x + size,
      y + triangleHeight, // Desno dno
    ];

    // Rotuj trougao oko vrha ako je angle != 0
    if (angle !== 0) {
      const rotated = [];
      for (let i = 0; i < triangleVertices.length; i += 2) {
        const rotatedPoint = this.rotatePoint(
          triangleVertices[i],
          triangleVertices[i + 1],
          x, // Centar rotacije je vrh trougla
          y,
          angle
        );
        rotated.push(rotatedPoint.x, rotatedPoint.y);
      }
      triangleVertices = rotated;
    }

    this.gl.useProgram(this.program);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(triangleVertices),
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
    this.gl.uniform4f(this.colorLocation, 0.8, 0.2, 0.2, 1); // shadcn red-600
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);

    // Crtaj krug na vrhu trougla (na poziciji čvora)
    this.drawCircle(x, y, 4, [0.8, 0.2, 0.2, 1], 16); // shadcn red-600

    // Crtaj horizontalnu liniju ispod trougla
    const lineY = y + triangleHeight + 4; // Malo ispod donje stranice trougla
    const lineLength = size * 1.5;

    // Definiši liniju bez rotacije
    let lineStartX = x - lineLength;
    let lineStartY = lineY;
    let lineEndX = x + lineLength;
    let lineEndY = lineY;

    // Rotuj liniju ako je angle != 0
    if (angle !== 0) {
      const rotatedStart = this.rotatePoint(
        lineStartX,
        lineStartY,
        x,
        y,
        angle
      );
      const rotatedEnd = this.rotatePoint(lineEndX, lineEndY, x, y, angle);
      lineStartX = rotatedStart.x;
      lineStartY = rotatedStart.y;
      lineEndX = rotatedEnd.x;
      lineEndY = rotatedEnd.y;
    }

    this.drawLine(
      lineStartX,
      lineStartY,
      lineEndX,
      lineEndY,
      [0.8, 0.2, 0.2, 1],
      2
    ); // shadcn red-600
  }

  // Crtanje strelice za silu
  drawForceArrow(x, y, angle, intensity) {
    const arrowLength = 30; // Dužina strelice
    const arrowHeadSize = 8; // Veličina vrha strelice

    // Konvertuj ugao u radijane
    const angleRad = (-angle * Math.PI) / 180; // Negativan za suprotno od kazaljke
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);

    // Krajnja tačka strelice
    const endX = x + cos * arrowLength;
    const endY = y + sin * arrowLength;

    // Crtaj liniju strelice
    this.drawLine(x, y, endX, endY, [0.8, 0.2, 0.2, 1], 3); // Crvena

    // Crtaj vrh strelice (trougao)
    const headAngle1 = angleRad + Math.PI * 0.8; // 144° offset
    const headAngle2 = angleRad - Math.PI * 0.8; // 144° offset

    const headX1 = endX + Math.cos(headAngle1) * arrowHeadSize;
    const headY1 = endY + Math.sin(headAngle1) * arrowHeadSize;
    const headX2 = endX + Math.cos(headAngle2) * arrowHeadSize;
    const headY2 = endY + Math.sin(headAngle2) * arrowHeadSize;

    // Crtaj trougao za vrh strelice
    const triangleVertices = [endX, endY, headX1, headY1, headX2, headY2];

    this.gl.useProgram(this.program);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(triangleVertices),
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
    this.gl.uniform4f(this.colorLocation, 0.8, 0.2, 0.2, 1); // shadcn red-600
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
  }
}
