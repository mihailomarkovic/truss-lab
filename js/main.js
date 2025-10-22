// Jednostavna aplikacija za dodavanje čvorova

class SimpleTrussApp {
  constructor() {
    this.canvas = document.getElementById("mainCanvas");
    this.renderer = new SimpleRenderer(this.canvas);

    // Lista čvorova
    this.nodes = [];

    // Aktivni alat
    this.activeTool = "node"; // node | beam | support | force

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupToolButtons();
    this.setupResetButton();
    this.render();
  }

  setupEventListeners() {
    // Klik na canvas
    this.canvas.addEventListener("click", (e) => {
      const worldPos = this.renderer.screenToWorld(e.clientX, e.clientY);
      const snapped = this.renderer.snapToGrid(worldPos.x, worldPos.y, 50);
      if (this.activeTool === "node") {
        this.addNode(snapped.x, snapped.y);
        this.updateStatus(snapped.x, snapped.y);
      } else {
        // Za sada samo obavesti koji je alat izabran
        const el = document.getElementById("coordText");
        if (el)
          el.textContent = `Alat: ${this.labelForTool(
            this.activeTool
          )} | Klik: (${snapped.x.toFixed(0)}, ${snapped.y.toFixed(0)})`;
      }
    });

    // Resize prozora
    window.addEventListener("resize", () => {
      this.handleResize();
    });
  }

  setupToolButtons() {
    const buttons = document.querySelectorAll(".tool-btn");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const tool = btn.getAttribute("data-tool");
        if (!tool) return;
        this.activeTool = tool;
        // UI aktivno stanje
        buttons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        const el = document.getElementById("coordText");
        if (el)
          el.textContent = `Alat: ${this.labelForTool(tool)} | Koordinate: —`;
      });
    });

    const defaultBtn = document.querySelector('.tool-btn[data-tool="node"]');
    if (defaultBtn) defaultBtn.classList.add("active");
  }

  setupResetButton() {
    const resetBtn = document.getElementById("resetBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        this.resetCanvas();
      });
    }
  }

  resetCanvas() {
    // Obriši sve čvorove
    this.nodes = [];

    // Ponovo renderuj (samo mreža će ostati)
    this.render();

    // Resetuj status
    const el = document.getElementById("coordText");
    if (el) {
      el.textContent = "Koordinate: —";
    }

    console.log("Canvas je resetovan");
  }

  labelForTool(tool) {
    switch (tool) {
      case "node":
        return "Čvor";
      case "beam":
        return "Štap";
      case "support":
        return "Oslonac";
      case "force":
        return "Sila";
      default:
        return tool;
    }
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
