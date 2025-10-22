// Jednostavna aplikacija za dodavanje čvorova

class SimpleTrussApp {
  constructor() {
    this.canvas = document.getElementById("mainCanvas");
    this.renderer = new SimpleRenderer(this.canvas);

    // Lista čvorova
    this.nodes = [];

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.render();
  }

  setupEventListeners() {
    // Klik na canvas
    this.canvas.addEventListener("click", (e) => {
      const worldPos = this.renderer.screenToWorld(e.clientX, e.clientY);
      const snapped = this.renderer.snapToGrid(worldPos.x, worldPos.y, 50);
      this.addNode(snapped.x, snapped.y);
      this.updateStatus(snapped.x, snapped.y);
    });

    // Resize prozora
    window.addEventListener("resize", () => {
      this.handleResize();
    });
  }

  addNode(x, y) {
    const node = {
      id: this.nodes.length + 1,
      x: x,
      y: y,
    };

    this.nodes.push(node);
    this.render();

    console.log("Dodat čvor:", node);
    console.log("Ukupno čvorova:", this.nodes.length);
  }

  updateStatus(x, y) {
    const el = document.getElementById("coordText");
    if (el) {
      el.textContent = `Koordinate: (${x.toFixed(0)}, ${y.toFixed(0)})`;
    }
  }

  render() {
    this.renderer.clear();

    // Crtaj mrežu
    this.renderer.drawGrid();

    // Crtaj sve čvorove
    for (const node of this.nodes) {
      this.renderer.drawCircle(node.x, node.y, 6, [0, 0, 1, 1], 24);
    }
  }

  handleResize() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.renderer.setupViewport();
    this.render();
  }
}

// Pokreni aplikaciju kada se stranica učita
document.addEventListener("DOMContentLoaded", () => {
  try {
    const app = new SimpleTrussApp();
    console.log("Jednostavna 2D Resetka aplikacija je uspešno pokrenuta!");
  } catch (error) {
    console.error("Greška pri pokretanju aplikacije:", error);
    alert(
      "Greška pri pokretanju aplikacije. Proverite da li vaš pregledač podržava WebGL."
    );
  }
});
