// Jednostavna aplikacija za dodavanje čvorova

class SimpleTrussApp {
  constructor() {
    this.canvas = document.getElementById("mainCanvas");
    this.renderer = new SimpleRenderer(this.canvas);

    // Lista čvorova
    this.nodes = [];
    // Lista štapova
    this.beams = [];

    // Aktivni alat
    this.activeTool = "node"; // node | beam | support | force

    // Stanje za izbor čvorova za štapove
    this.selectedNodeForBeam = null;

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
      } else if (this.activeTool === "beam") {
        this.handleBeamClick(snapped.x, snapped.y);
      } else if (this.activeTool === "support") {
        this.handleSupportClick(snapped.x, snapped.y);
      } else {
        // Za sada samo obavesti koji je alat izabran
        const el = document.getElementById("coordText");
        if (el)
          el.textContent = `Alat: ${this.labelForTool(
            this.activeTool
          )} | Klik: x: ${snapped.x.toFixed(0)}, y: ${snapped.y.toFixed(0)}`;
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
    // Obriši sve čvorove i štapove
    this.nodes = [];
    this.beams = [];
    this.selectedNodeForBeam = null;

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
      type: "node", // node | support
    };

    this.nodes.push(node);
    this.render();

    console.log("Dodat čvor:", node);
    console.log("Ukupno čvorova:", this.nodes.length);
  }

  // Pronađi čvor na datoj poziciji (sa tolerancijom)
  findNodeAt(x, y, tolerance = 15) {
    for (const node of this.nodes) {
      const dx = node.x - x;
      const dy = node.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= tolerance) {
        return node;
      }
    }
    return null;
  }

  // Rukovanje klikom za štap
  handleBeamClick(x, y) {
    const clickedNode = this.findNodeAt(x, y);

    if (!clickedNode) {
      // Klik van čvora - resetuj izbor
      this.selectedNodeForBeam = null;
      const el = document.getElementById("coordText");
      if (el) el.textContent = "Alat: Štap | Izaberite prvi čvor";
      return;
    }

    if (!this.selectedNodeForBeam) {
      // Prvi čvor izabran
      this.selectedNodeForBeam = clickedNode;
      const el = document.getElementById("coordText");
      if (el)
        el.textContent = `Alat: Štap | Prvi čvor: ${clickedNode.id} | Izaberite drugi čvor`;
    } else if (this.selectedNodeForBeam.id !== clickedNode.id) {
      // Drugi čvor izabran - napravi štap
      this.addBeam(this.selectedNodeForBeam, clickedNode);
      this.selectedNodeForBeam = null; // Resetuj izbor za sledeći štap
      const el = document.getElementById("coordText");
      if (el)
        el.textContent = `Alat: Štap | Štap kreiran | Izaberite prvi čvor za sledeći štap`;
    }
  }

  // Dodaj štap između dva čvora
  addBeam(node1, node2) {
    // Proveri da li štap već postoji
    const existingBeam = this.beams.find(
      (beam) =>
        (beam.from.id === node1.id && beam.to.id === node2.id) ||
        (beam.from.id === node2.id && beam.to.id === node1.id)
    );

    if (existingBeam) {
      console.log("Štap već postoji između ovih čvorova");
      return;
    }

    const beam = {
      id: this.beams.length + 1,
      from: node1,
      to: node2,
    };

    this.beams.push(beam);
    this.render();

    console.log("Dodat štap:", beam);
  }

  // Rukovanje klikom za oslonac
  handleSupportClick(x, y) {
    const clickedNode = this.findNodeAt(x, y);

    if (clickedNode) {
      // Pretvori čvor u oslonac
      clickedNode.type = "support";
      this.render();

      const el = document.getElementById("coordText");
      if (el) el.textContent = `Čvor ${clickedNode.id} pretvoren u oslonac`;

      console.log(`Čvor ${clickedNode.id} pretvoren u oslonac`);
    } else {
      const el = document.getElementById("coordText");
      if (el)
        el.textContent =
          "Alat: Oslonac | Kliknite na čvor da ga pretvorite u oslonac";
    }
  }

  updateStatus(x, y) {
    const el = document.getElementById("coordText");
    if (el) {
      el.textContent = `Koordinate: x: ${x.toFixed(0)}, y: ${y.toFixed(0)}`;
    }
  }

  render() {
    this.renderer.clear();

    // Crtaj mrežu
    this.renderer.drawGrid();

    // Crtaj sve štapove
    for (const beam of this.beams) {
      this.renderer.drawLine(
        beam.from.x,
        beam.from.y,
        beam.to.x,
        beam.to.y,
        [0.2, 0.2, 0.2, 1],
        2
      );
    }

    // Crtaj sve čvorove
    for (const node of this.nodes) {
      if (node.type === "support") {
        // Crtaj oslonac kao trougao
        this.renderer.drawTriangle(node.x, node.y, 8, [1, 0, 0, 1]);
      } else {
        // Crtaj običan čvor kao krug
        this.renderer.drawCircle(node.x, node.y, 6, [0, 0, 1, 1], 24);
      }
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
    console.log("TrussLab aplikacija je uspešno pokrenuta!");
  } catch (error) {
    console.error("Greška pri pokretanju aplikacije:", error);
    alert(
      "Greška pri pokretanju aplikacije. Proverite da li vaš pregledač podržava WebGL."
    );
  }
});
