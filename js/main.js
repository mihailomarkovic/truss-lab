// Jednostavna aplikacija za dodavanje čvorova

class SimpleTrussApp {
  constructor() {
    this.canvas = document.getElementById("mainCanvas");
    this.renderer = new SimpleRenderer(this.canvas);

    // Lista čvorova
    this.nodes = [];
    // Lista štapova
    this.beams = [];

    // Lista sila
    this.forces = [];

    // Aktivni alat
    this.activeTool = "node"; // node | beam | support | force

    // Stanje za izbor čvorova za štapove
    this.selectedNodeForBeam = null;

    // Trenutni tip oslonca koji se postavlja
    this.supportType = null; // null | "fixed" | "movable"

    // Trenutni ugao oslonca
    this.supportAngle = 0; // 0 | 90 | 180 | 270

    // Trenutni ugao sile
    this.forceAngle = 0; // 0 | 45 | 90 | 135 | 180 | 225 | 270 | 315

    // Trenutni intenzitet sile
    this.forceIntensity = 0; // U Njutnima

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupToolButtons();
    this.setupResetButton();
    this.setupSupportSubmenu();
    this.setupAngleSubmenu();
    this.setupForceSubmenu();
    this.setupIntensityControls();
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
      } else if (this.activeTool === "force") {
        this.handleForceClick(snapped.x, snapped.y);
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

        // Ako je kliknut alat "support", prikaži podmeni
        if (tool === "support") {
          const submenu = document.getElementById("supportSubmenu");
          if (submenu) {
            submenu.style.display =
              submenu.style.display === "none" ? "flex" : "none";
          }

          // Postavi aktivni alat na "support"
          this.activeTool = "support";

          // Aktiviraj dugme "Oslonac"
          buttons.forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");

          // Resetuj tip oslonca kad se otvori podmeni
          this.supportType = null;
          this.supportAngle = 0;

          // Resetuj aktivne dugmiće u podmeniju
          const halfBtns = document.querySelectorAll(".half-btn");
          halfBtns.forEach((b) => b.classList.remove("active"));

          const angleBtns = document.querySelectorAll(".angle-btn");
          angleBtns.forEach((b) => b.classList.remove("active"));

          // Sakrij force podmeni ako je otvoren
          const forceSubmenu = document.getElementById("forceSubmenu");
          if (forceSubmenu) forceSubmenu.style.display = "none";

          // Resetuj aktivne dugmiće u force podmeniju
          const forceAngleBtns = document.querySelectorAll(".force-angle-btn");
          forceAngleBtns.forEach((b) => b.classList.remove("active"));

          const el = document.getElementById("coordText");
          if (el) el.textContent = "Alat: Oslonac | Izaberite tip i ugao";

          return;
        }

        // Ako je kliknut alat "force", prikaži podmeni
        if (tool === "force") {
          const submenu = document.getElementById("forceSubmenu");
          if (submenu) {
            submenu.style.display =
              submenu.style.display === "none" ? "flex" : "none";
          }

          // Postavi aktivni alat na "force"
          this.activeTool = "force";

          // Aktiviraj dugme "Sila"
          buttons.forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");

          // Resetuj izbor kad se otvori podmeni
          this.forceAngle = 0;

          // Resetuj aktivne dugmiće u podmeniju
          const forceAngleBtns = document.querySelectorAll(".force-angle-btn");
          forceAngleBtns.forEach((b) => b.classList.remove("active"));

          // Sakrij support podmeni ako je otvoren
          const supportSubmenu = document.getElementById("supportSubmenu");
          if (supportSubmenu) supportSubmenu.style.display = "none";

          // Resetuj aktivne dugmiće u support podmeniju
          const halfBtns = document.querySelectorAll(".half-btn");
          halfBtns.forEach((b) => b.classList.remove("active"));
          const angleBtns = document.querySelectorAll(".angle-btn");
          angleBtns.forEach((b) => b.classList.remove("active"));

          const el = document.getElementById("coordText");
          if (el)
            el.textContent = `Alat: Sila | Ugao: ${this.forceAngle}° | Intenzitet: ${this.forceIntensity}`;

          return;
        }

        // Sakrij support podmeni ako je izabran drugi alat
        const submenu = document.getElementById("supportSubmenu");
        if (submenu) submenu.style.display = "none";

        // Resetuj aktivne dugmiće u support podmeniju
        const halfBtns = document.querySelectorAll(".half-btn");
        halfBtns.forEach((b) => b.classList.remove("active"));
        const angleBtns = document.querySelectorAll(".angle-btn");
        angleBtns.forEach((b) => b.classList.remove("active"));

        // Sakrij force podmeni ako je izabran drugi alat
        const forceSubmenu = document.getElementById("forceSubmenu");
        if (forceSubmenu) forceSubmenu.style.display = "none";

        // Resetuj aktivne dugmiće u force podmeniju
        const forceAngleBtns = document.querySelectorAll(".force-angle-btn");
        forceAngleBtns.forEach((b) => b.classList.remove("active"));

        this.activeTool = tool;
        this.supportType = null; // Resetuj tip oslonca
        this.supportAngle = 0; // Resetuj ugao

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

  setupSupportSubmenu() {
    const halfBtns = document.querySelectorAll(".half-btn");
    halfBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const supportType = btn.getAttribute("data-support-type");
        if (!supportType) return;

        this.supportType = supportType;
        this.activeTool = "support";

        // Aktiviraj aktivni alat
        const buttons = document.querySelectorAll(".tool-btn");
        buttons.forEach((b) => b.classList.remove("active"));
        const supportBtn = document.querySelector(
          '.tool-btn[data-tool="support"]'
        );
        if (supportBtn) supportBtn.classList.add("active");

        // Aktiviraj kliknuti tip u podmeniju
        halfBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        const el = document.getElementById("coordText");
        if (el) {
          const typeLabel = supportType === "fixed" ? "Nepokretan" : "Pokretan";
          el.textContent = `Alat: Oslonac (${typeLabel}) | Ugao: ${this.supportAngle}° | Kliknite na čvor`;
        }
      });
    });
  }

  setupAngleSubmenu() {
    const angleBtns = document.querySelectorAll(".angle-btn");
    angleBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const angle = parseInt(btn.getAttribute("data-angle"));
        if (isNaN(angle)) return;

        this.supportAngle = angle;

        // Aktiviraj kliknuti ugao u podmeniju
        angleBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        const el = document.getElementById("coordText");
        if (el) {
          const typeLabel =
            this.supportType === "fixed" ? "Nepokretan" : "Pokretan";
          el.textContent = `Alat: Oslonac (${typeLabel}) | Ugao: ${angle}° | Kliknite na čvor`;
        }
      });
    });
  }

  setupResetButton() {
    const resetBtn = document.getElementById("resetBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        this.resetCanvas();
      });
    }

    const calculateBtn = document.getElementById("calculateBtn");
    if (calculateBtn) {
      calculateBtn.addEventListener("click", () => {
        this.calculate();
      });
    }
  }

  calculate() {
    console.log("Izračunaj:", {
      nodes: this.nodes,
      beams: this.beams,
      forces: this.forces,
    });

    const el = document.getElementById("coordText");
    if (el) {
      el.textContent = "Izračunavanje... (Za sada samo loguju podatke)";
    }

    // TODO: Implementirati proračun
  }

  resetCanvas() {
    // Obriši sve čvorove, štapove i sile
    this.nodes = [];
    this.beams = [];
    this.forces = [];
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
      type: "node", // node | support_fixed | support_movable
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
    // Proveri da li je tip oslonca izabran
    if (!this.supportType) {
      const el = document.getElementById("coordText");
      if (el)
        el.textContent =
          "Alat: Oslonac | Izaberite tip oslonca (Nepokretan/Pokretan)";
      return;
    }

    const clickedNode = this.findNodeAt(x, y);

    if (clickedNode) {
      // Pretvori čvor u oslonac odgovarajućeg tipa
      clickedNode.type = `support_${this.supportType}`;
      clickedNode.angle = this.supportAngle; // Dodaj ugao čvoru
      this.render();

      const el = document.getElementById("coordText");
      const typeLabel =
        this.supportType === "fixed" ? "nepokretan" : "pokretan";
      if (el)
        el.textContent = `Čvor ${clickedNode.id} pretvoren u ${typeLabel} oslonac (${this.supportAngle}°)`;

      console.log(
        `Čvor ${clickedNode.id} pretvoren u ${typeLabel} oslonac pod uglom ${this.supportAngle}°`
      );
    } else {
      const el = document.getElementById("coordText");
      if (el) {
        const typeLabel =
          this.supportType === "fixed" ? "Nepokretan" : "Pokretan";
        el.textContent = `Alat: Oslonac (${typeLabel}) | Ugao: ${this.supportAngle}° | Kliknite na čvor`;
      }
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
        [0.11, 0.08, 0.06, 1], // shadcn stone-900
        4 // Zadebljane linije
      );
    }

    // Crtaj sve čvorove
    for (const node of this.nodes) {
      if (node.type === "support_fixed") {
        // Crtaj nepokretan oslonac (trougao + krug)
        const angle = node.angle || 0;
        this.renderer.drawFixedSupport(node.x, node.y, angle);
      } else if (node.type === "support_movable") {
        // Crtaj pokretan oslonac (trougao + krug + linija)
        const angle = node.angle || 0;
        this.renderer.drawMovableSupport(node.x, node.y, angle);
      } else {
        // Crtaj običan čvor kao krug
        this.renderer.drawCircle(node.x, node.y, 6, [0.11, 0.08, 0.06, 1], 24); // shadcn stone-900
      }
    }

    // Crtaj sve sile
    for (const force of this.forces) {
      this.renderer.drawForceArrow(
        force.node.x,
        force.node.y,
        force.angle,
        force.intensity
      );
    }
  }

  setupForceSubmenu() {
    const forceAngleBtns = document.querySelectorAll(".force-angle-btn");
    forceAngleBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const angle = parseInt(btn.getAttribute("data-force-angle"));
        if (isNaN(angle)) return;

        this.forceAngle = angle;

        // Aktiviraj kliknuti ugao u podmeniju
        forceAngleBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        const el = document.getElementById("coordText");
        if (el) {
          el.textContent = `Alat: Sila | Ugao: ${angle}° | Intenzitet: ${this.forceIntensity}`;
        }
      });
    });
  }

  setupIntensityControls() {
    const increaseBtn = document.getElementById("increaseIntensity");
    const decreaseBtn = document.getElementById("decreaseIntensity");
    const intensityDisplay = document.getElementById("intensityValue");

    if (increaseBtn) {
      increaseBtn.addEventListener("click", () => {
        this.forceIntensity += 10;
        this.updateIntensityDisplay();
      });
    }

    if (decreaseBtn) {
      decreaseBtn.addEventListener("click", () => {
        this.forceIntensity = Math.max(0, this.forceIntensity - 10);
        this.updateIntensityDisplay();
      });
    }
  }

  updateIntensityDisplay() {
    const el = document.getElementById("intensityValue");
    if (el) {
      el.textContent = `${this.forceIntensity}`;
    }

    const statusEl = document.getElementById("coordText");
    if (statusEl && this.activeTool === "force") {
      statusEl.textContent = `Alat: Sila | Ugao: ${this.forceAngle}° | Intenzitet: ${this.forceIntensity}`;
    }
  }

  handleForceClick(x, y) {
    const clickedNode = this.findNodeAt(x, y);

    if (clickedNode) {
      // Dodaj silu na čvor (oslonac ili običan čvor)
      const force = {
        id: this.forces.length + 1,
        node: clickedNode,
        angle: this.forceAngle,
        intensity: this.forceIntensity,
      };

      // Proveri da li već postoji sila na ovom čvoru
      const existingForce = this.forces.find(
        (f) => f.node.id === clickedNode.id
      );
      if (existingForce) {
        // Zameni postojeću silu
        existingForce.angle = this.forceAngle;
        existingForce.intensity = this.forceIntensity;
      } else {
        this.forces.push(force);
      }

      this.render();

      const el = document.getElementById("coordText");
      if (el) {
        el.textContent = `Sila postavljena na čvor ${clickedNode.id} | ${this.forceIntensity} @ ${this.forceAngle}°`;
      }

      console.log("Dodata sila:", force);
    } else {
      const el = document.getElementById("coordText");
      if (el) {
        el.textContent = `Alat: Sila | Ugao: ${this.forceAngle}° | Intenzitet: ${this.forceIntensity} | Kliknite na čvor`;
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
