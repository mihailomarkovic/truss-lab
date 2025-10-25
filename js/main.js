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
    this.forceIntensity = 0;

    // Prikaz mreže
    this.showGrid = true;

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

    // Tastaturne prečice
    window.addEventListener("keydown", (e) => {
      // G - Toggle Grid
      if (e.key === "g" || e.key === "G") {
        this.showGrid = !this.showGrid;
        this.render();
        const el = document.getElementById("coordText");
        if (el) {
          el.textContent = `Mreža: ${
            this.showGrid ? "UKLJUČENA" : "ISKLJUČENA"
          } (pritisni G za promenu)`;
        }
      }

      // Q - Zatvori (prikaži poruku)
      if (e.key === "q" || e.key === "Q") {
        if (confirm("Da li želite da zatvorite aplikaciju?")) {
          window.close();
        }
      }

      // E - Export fajl
      if (e.key === "e" || e.key === "E") {
        this.exportToFile();
      }
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

          this.activeTool = "support";
          buttons.forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");

          this.supportType = null;
          this.supportAngle = 0;

          const halfBtns = document.querySelectorAll(".half-btn");
          halfBtns.forEach((b) => b.classList.remove("active"));

          const angleBtns = document.querySelectorAll(".angle-btn");
          angleBtns.forEach((b) => b.classList.remove("active"));

          const forceSubmenu = document.getElementById("forceSubmenu");
          if (forceSubmenu) forceSubmenu.style.display = "none";

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

          this.activeTool = "force";
          buttons.forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");

          this.forceAngle = 0;

          const forceAngleBtns = document.querySelectorAll(".force-angle-btn");
          forceAngleBtns.forEach((b) => b.classList.remove("active"));

          const supportSubmenu = document.getElementById("supportSubmenu");
          if (supportSubmenu) supportSubmenu.style.display = "none";

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

        const halfBtns = document.querySelectorAll(".half-btn");
        halfBtns.forEach((b) => b.classList.remove("active"));
        const angleBtns = document.querySelectorAll(".angle-btn");
        angleBtns.forEach((b) => b.classList.remove("active"));

        // Sakrij force podmeni ako je izabran drugi alat
        const forceSubmenu = document.getElementById("forceSubmenu");
        if (forceSubmenu) forceSubmenu.style.display = "none";

        const forceAngleBtns = document.querySelectorAll(".force-angle-btn");
        forceAngleBtns.forEach((b) => b.classList.remove("active"));

        this.activeTool = tool;
        this.supportType = null;
        this.supportAngle = 0;

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

        const buttons = document.querySelectorAll(".tool-btn");
        buttons.forEach((b) => b.classList.remove("active"));
        const supportBtn = document.querySelector(
          '.tool-btn[data-tool="support"]'
        );
        if (supportBtn) supportBtn.classList.add("active");

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
    const el = document.getElementById("coordText");
    if (el) {
      el.textContent = "Izračunavanje...";
    }

    // Izvršavanje MKE proračuna
    const results = this.performMKECalculation();

    if (results.success) {
      this.displayResults(results);
      el.textContent = `Proračun završen! Pomeranja: ${results.displacements.length}, Naponi: ${results.stresses.length}`;
    } else {
      el.textContent = `Greška: ${results.error}`;
    }
  }

  // MKE Proračun
  performMKECalculation() {
    try {
      // Validacija podataka
      if (this.nodes.length < 2) {
        return { success: false, error: "Potrebno je najmanje 2 čvora" };
      }
      if (this.beams.length === 0) {
        return { success: false, error: "Potrebno je najmanje 1 štap" };
      }

      // Proveri da li ima oslonaca
      const supports = this.nodes.filter(
        (node) =>
          node.type === "support_fixed" || node.type === "support_movable"
      );
      if (supports.length === 0) {
        return { success: false, error: "Potrebno je najmanje 1 oslonac" };
      }

      const modulusInput = document.getElementById("modulusInput");
      const areaInput = document.getElementById("areaInput");
      // Konverzija: MPa → Pa (×10^6), cm² → m² (×10^-4)
      const E = modulusInput
        ? parseFloat(modulusInput.value) * 1e6
        : 200000000000;
      const A = areaInput ? parseFloat(areaInput.value) * 1e-4 : 0.0005;

      // Broj čvorova i štapova
      const numNodes = this.nodes.length;

      // Kreiranje globalne matrice krutosti
      const globalStiffness = this.createGlobalStiffnessMatrix(numNodes, E, A);

      // Kreiranje vektora opterećenja
      const loadVector = this.createLoadVector(numNodes);

      // Primena graničnih uslova (oslonci)
      const { reducedStiffness, reducedLoad, freeDOFs } =
        this.applyBoundaryConditions(globalStiffness, loadVector);

      // Rešavanje sistema jednačina
      const freeDisplacements = this.solveSystem(reducedStiffness, reducedLoad);

      // Kreiranje kompletnog vektora pomeranja
      const displacements = Array(numNodes * 2).fill(0);
      freeDOFs.forEach((dof, index) => {
        displacements[dof] = freeDisplacements[index];
      });

      // Izračunavanje napona u štapovima
      const stresses = this.calculateStresses(displacements, E);

      // Izračunavanje reakcija oslonaca
      const reactions = this.calculateReactions(
        globalStiffness,
        displacements,
        loadVector
      );

      return {
        success: true,
        displacements: displacements,
        stresses: stresses,
        reactions: reactions,
        nodes: this.nodes,
        beams: this.beams,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  createGlobalStiffnessMatrix(numNodes, E, A) {
    const size = numNodes * 2; // 2 DOF po čvoru (x, y)
    const K = Array(size)
      .fill()
      .map(() => Array(size).fill(0));

    this.beams.forEach((beam) => {
      const node1 = this.nodes.find((n) => n.id === beam.from.id);
      const node2 = this.nodes.find((n) => n.id === beam.to.id);

      if (!node1 || !node2) return;

      // Dužina štapa
      const dx = node2.x - node1.x;
      const dy = node2.y - node1.y;
      const L = Math.sqrt(dx * dx + dy * dy);

      if (L === 0) return;

      // Kosinus i sinus ugla štapa
      const cos = dx / L;
      const sin = dy / L;

      // Lokalna matrica krutosti štapa
      const k = (E * A) / L;
      const ke = [
        [k * cos * cos, k * cos * sin, -k * cos * cos, -k * cos * sin],
        [k * cos * sin, k * sin * sin, -k * cos * sin, -k * sin * sin],
        [-k * cos * cos, -k * cos * sin, k * cos * cos, k * cos * sin],
        [-k * cos * sin, -k * sin * sin, k * cos * sin, k * sin * sin],
      ];

      // Indeksi u globalnoj matrici
      const node1Index = this.nodes.findIndex((n) => n.id === node1.id);
      const node2Index = this.nodes.findIndex((n) => n.id === node2.id);
      const dof1 = node1Index * 2;
      const dof2 = node1Index * 2 + 1;
      const dof3 = node2Index * 2;
      const dof4 = node2Index * 2 + 1;

      // Dodavanje u globalnu matricu
      const indices = [dof1, dof2, dof3, dof4];
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          K[indices[i]][indices[j]] += ke[i][j];
        }
      }
    });

    return K;
  }

  createLoadVector(numNodes) {
    const size = numNodes * 2;
    const F = Array(size).fill(0);

    this.forces.forEach((force) => {
      const node = this.nodes.find((n) => n.id === force.node?.id);

      if (!node) return;

      const angleRad = (force.angle * Math.PI) / 180;
      const fx = force.intensity * Math.cos(angleRad);
      const fy = force.intensity * Math.sin(angleRad);

      const nodeIndex = this.nodes.findIndex((n) => n.id === node.id);
      const dofX = nodeIndex * 2;
      const dofY = nodeIndex * 2 + 1;

      F[dofX] += fx;
      F[dofY] += fy;
    });

    return F;
  }

  applyBoundaryConditions(K, F) {
    const size = K.length;
    const fixedDOFs = [];

    // Pronađi oslonce (čvorove sa ograničenjima)
    this.nodes.forEach((node) => {
      if (node.type === "support_fixed" || node.type === "support_movable") {
        const nodeIndex = this.nodes.findIndex((n) => n.id === node.id);
        if (node.type === "support_fixed") {
          fixedDOFs.push(nodeIndex * 2); // x pomeranje
          fixedDOFs.push(nodeIndex * 2 + 1); // y pomeranje
        } else if (node.type === "support_movable") {
          // Samo y pomeranje je ograničeno za pokretni oslonac
          fixedDOFs.push(nodeIndex * 2 + 1);
        }
      }
    });

    // Kreiranje reducirane matrice
    const freeDOFs = [];
    for (let i = 0; i < size; i++) {
      if (!fixedDOFs.includes(i)) {
        freeDOFs.push(i);
      }
    }

    const reducedSize = freeDOFs.length;
    const Kr = Array(reducedSize)
      .fill()
      .map(() => Array(reducedSize).fill(0));
    const Fr = Array(reducedSize).fill(0);

    for (let i = 0; i < reducedSize; i++) {
      Fr[i] = F[freeDOFs[i]];
      for (let j = 0; j < reducedSize; j++) {
        Kr[i][j] = K[freeDOFs[i]][freeDOFs[j]];
      }
    }

    return { reducedStiffness: Kr, reducedLoad: Fr, freeDOFs: freeDOFs };
  }

  solveSystem(K, F) {
    const n = K.length;

    // Gauss eliminacija
    for (let i = 0; i < n; i++) {
      // Pivot
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(K[k][i]) > Math.abs(K[maxRow][i])) {
          maxRow = k;
        }
      }

      // Zamena redova
      [K[i], K[maxRow]] = [K[maxRow], K[i]];
      [F[i], F[maxRow]] = [F[maxRow], F[i]];

      // Eliminacija
      for (let k = i + 1; k < n; k++) {
        const factor = K[k][i] / K[i][i];
        for (let j = i; j < n; j++) {
          K[k][j] -= factor * K[i][j];
        }
        F[k] -= factor * F[i];
      }
    }

    // Supstitucija unazad
    const x = Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      x[i] = F[i];
      for (let j = i + 1; j < n; j++) {
        x[i] -= K[i][j] * x[j];
      }
      x[i] /= K[i][i];
    }

    return x;
  }

  calculateStresses(displacements, E) {
    const stresses = [];

    this.beams.forEach((beam) => {
      const node1 = this.nodes.find((n) => n.id === beam.from.id);
      const node2 = this.nodes.find((n) => n.id === beam.to.id);

      if (!node1 || !node2) return;

      const dx = node2.x - node1.x;
      const dy = node2.y - node1.y;
      const L = Math.sqrt(dx * dx + dy * dy);

      if (L === 0) return;

      const cos = dx / L;
      const sin = dy / L;

      // Lokalne pomeranja
      const node1Index = this.nodes.findIndex((n) => n.id === node1.id);
      const node2Index = this.nodes.findIndex((n) => n.id === node2.id);
      const u1 = displacements[node1Index * 2];
      const v1 = displacements[node1Index * 2 + 1];
      const u2 = displacements[node2Index * 2];
      const v2 = displacements[node2Index * 2 + 1];

      // Napon u štapu
      const strain = (cos * (u2 - u1) + sin * (v2 - v1)) / L;
      const stress = E * strain;

      stresses.push({
        beamId: beam.id,
        stress: stress,
        strain: strain,
      });
    });

    return stresses;
  }

  calculateReactions(K, displacements, F) {
    const reactions = [];
    const size = K.length;

    // Izračunaj ukupne sile
    const totalForces = Array(size).fill(0);
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        totalForces[i] += K[i][j] * displacements[j];
      }
    }

    // Reakcije su razlika između ukupnih sila i spoljašnjih opterećenja
    this.nodes.forEach((node) => {
      if (node.type === "support_fixed" || node.type === "support_movable") {
        const nodeIndex = this.nodes.findIndex((n) => n.id === node.id);
        const dofX = nodeIndex * 2;
        const dofY = nodeIndex * 2 + 1;

        const rx = totalForces[dofX] - F[dofX];
        const ry = totalForces[dofY] - F[dofY];

        reactions.push({
          nodeId: node.id,
          rx: rx,
          ry: ry,
        });
      }
    });

    return reactions;
  }

  displayResults(results) {
    console.log("\n╔════════════════════════════════════════════════════╗");
    console.log("║           REZULTATI MKE PRORAČUNA                  ║");
    console.log("╚════════════════════════════════════════════════════╝\n");

    // Ispis ulaznih podataka
    const modulusInput = document.getElementById("modulusInput");
    const areaInput = document.getElementById("areaInput");
    const E_MPa = modulusInput ? parseFloat(modulusInput.value) : 200000;
    const A_cm2 = areaInput ? parseFloat(areaInput.value) : 5;
    // Konverzija: MPa → Pa (×10^6), cm² → m² (×10^-4)
    const E = E_MPa * 1e6;
    const A = A_cm2 * 1e-4;

    console.log("─── ULAZNI PODACI ───");
    console.log(`Broj čvorova: ${this.nodes.length}`);
    console.log(`Broj štapova: ${this.beams.length}`);
    console.log(`Broj sila: ${this.forces.length}`);
    console.log(
      `Modul elastičnosti (E): ${E_MPa} MPa = ${E.toExponential(2)} Pa`
    );
    console.log(`Poprečni presek (A): ${A_cm2} cm² = ${A.toExponential(4)} m²`);

    // Ispis koordinata čvorova
    console.log("\n─── KOORDINATE ČVOROVA ───");
    this.nodes.forEach((node) => {
      const type =
        node.type === "support_fixed"
          ? "(nepokretan oslonac)"
          : node.type === "support_movable"
          ? "(pokretan oslonac)"
          : "";
      console.log(
        `Čvor ${node.id}: x = ${node.x.toFixed(1)}, y = ${node.y.toFixed(
          1
        )} ${type}`
      );
    });

    // Ispis definicije štapova
    console.log("\n─── DEFINICIJA ŠTAPOVA ───");
    this.beams.forEach((beam) => {
      const dx = beam.to.x - beam.from.x;
      const dy = beam.to.y - beam.from.y;
      const L = Math.sqrt(dx * dx + dy * dy);
      console.log(
        `Štap ${beam.id}: Čvor ${beam.from.id} → Čvor ${
          beam.to.id
        }, Dužina = ${L.toFixed(2)}`
      );
    });

    // Ispis sila
    console.log("\n─── OPTEREĆENJA ───");
    this.forces.forEach((force) => {
      const angleRad = (force.angle * Math.PI) / 180;
      const fx = force.intensity * Math.cos(angleRad);
      const fy = force.intensity * Math.sin(angleRad);
      console.log(
        `Sila na čvoru ${force.node.id}: Fx = ${fx.toFixed(
          2
        )} N, Fy = ${fy.toFixed(2)} N (Ugao: ${force.angle}°, Intenzitet: ${
          force.intensity
        } N)`
      );
    });

    // Ispis pomeranja
    console.log("\n─── POMERANJA ČVOROVA ───");
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      const ux = results.displacements[i * 2];
      const uy = results.displacements[i * 2 + 1];
      console.log(
        `Čvor ${node.id}: ux = ${ux.toExponential(
          4
        )} m, uy = ${uy.toExponential(4)} m`
      );
    }

    // Ispis napona
    console.log("\n─── NAPONI U ŠTAPOVIMA ───");
    results.stresses.forEach((stress) => {
      const type = stress.stress < 0 ? "PRITISAK" : "ZATEZANJE";
      console.log(
        `Štap ${stress.beamId}: σ = ${stress.stress.toExponential(
          4
        )} Pa [${type}]`
      );
    });

    // Ispis reakcija
    console.log("\n─── REAKCIJE OSLONACA ───");
    results.reactions.forEach((reaction) => {
      const node = this.nodes.find((n) => n.id === reaction.nodeId);
      const supportType =
        node?.type === "support_fixed" ? "Nepokretan" : "Pokretan";
      console.log(
        `Čvor ${
          reaction.nodeId
        } (${supportType}): Rx = ${reaction.rx.toExponential(
          4
        )} N, Ry = ${reaction.ry.toExponential(4)} N`
      );
    });

    console.log("\n" + "═".repeat(54) + "\n");

    // Prikaz pomeranja
    const displacementsEl = document.getElementById("displacementsResults");
    if (displacementsEl) {
      let html = "";
      for (let i = 0; i < this.nodes.length; i++) {
        const node = this.nodes[i];
        const ux = results.displacements[i * 2];
        const uy = results.displacements[i * 2 + 1];
        html += `
          <div class="result-item">
            <strong>Čvor ${node.id}</strong>
            <div class="result-value">
              ux = ${ux.toExponential(4)} m<br>
              uy = ${uy.toExponential(4)} m
            </div>
          </div>
        `;
      }
      displacementsEl.innerHTML = html;
    }

    // Prikaz napona
    const stressesEl = document.getElementById("stressesResults");
    if (stressesEl) {
      let html = "";
      results.stresses.forEach((stress) => {
        const beam = this.beams.find((b) => b.id === stress.beamId);
        const dx = beam.to.x - beam.from.x;
        const dy = beam.to.y - beam.from.y;
        const L = Math.sqrt(dx * dx + dy * dy);
        const isCompression = stress.stress < 0;
        const stressType = isCompression ? "pritisak" : "zatezanje";
        html += `
          <div class="result-item">
            <strong>Štap ${stress.beamId}</strong>
            <div class="result-value">
              Dužina: ${L.toFixed(2)} px<br>
              σ = ${stress.stress.toExponential(4)} Pa<br>
              ε = ${stress.strain.toExponential(4)}<br>
              Tip: ${stressType}
            </div>
          </div>
        `;
      });
      stressesEl.innerHTML = html || '<p class="empty-state">Nema napona</p>';
    }

    // Prikaz reakcija
    const reactionsEl = document.getElementById("reactionsResults");
    if (reactionsEl) {
      let html = "";
      results.reactions.forEach((reaction) => {
        const node = this.nodes.find((n) => n.id === reaction.nodeId);
        const supportType =
          node?.type === "support_fixed" ? "Nepokretan" : "Pokretan";
        const magnitude = Math.sqrt(
          reaction.rx * reaction.rx + reaction.ry * reaction.ry
        );
        html += `
          <div class="result-item">
            <strong>Čvor ${reaction.nodeId} (${supportType})</strong>
            <div class="result-value">
              Pozicija: (${node.x.toFixed(0)}, ${node.y.toFixed(0)})<br>
              Rx = ${reaction.rx.toExponential(4)} N<br>
              Ry = ${reaction.ry.toExponential(4)} N<br>
              |R| = ${magnitude.toExponential(4)} N
            </div>
          </div>
        `;
      });
      reactionsEl.innerHTML =
        html || '<p class="empty-state">Nema reakcija</p>';
    }
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

    // Očisti rezultate
    const displacementsEl = document.getElementById("displacementsResults");
    const stressesEl = document.getElementById("stressesResults");
    const reactionsEl = document.getElementById("reactionsResults");

    if (displacementsEl) {
      displacementsEl.innerHTML =
        '<p class="empty-state">Pokrenite proračun da vidite rezultate</p>';
    }
    if (stressesEl) {
      stressesEl.innerHTML =
        '<p class="empty-state">Pokrenite proračun da vidite rezultate</p>';
    }
    if (reactionsEl) {
      reactionsEl.innerHTML =
        '<p class="empty-state">Pokrenite proračun da vidite rezultate</p>';
    }
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
      type: "node",
    };

    this.nodes.push(node);
    this.render();
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
      this.selectedNodeForBeam = null;
      const el = document.getElementById("coordText");
      if (el) el.textContent = "Alat: Štap | Izaberite prvi čvor";
      return;
    }

    if (!this.selectedNodeForBeam) {
      this.selectedNodeForBeam = clickedNode;
      const el = document.getElementById("coordText");
      if (el)
        el.textContent = `Alat: Štap | Prvi čvor: ${clickedNode.id} | Izaberite drugi čvor`;
    } else if (this.selectedNodeForBeam.id !== clickedNode.id) {
      this.addBeam(this.selectedNodeForBeam, clickedNode);
      this.selectedNodeForBeam = null;
      const el = document.getElementById("coordText");
      if (el)
        el.textContent = `Alat: Štap | Štap kreiran | Izaberite prvi čvor za sledeći štap`;
    }
  }

  // Dodaj štap između dva čvora
  addBeam(node1, node2) {
    const existingBeam = this.beams.find(
      (beam) =>
        (beam.from.id === node1.id && beam.to.id === node2.id) ||
        (beam.from.id === node2.id && beam.to.id === node1.id)
    );

    if (existingBeam) {
      return;
    }

    const beam = {
      id: this.beams.length + 1,
      from: node1,
      to: node2,
    };

    this.beams.push(beam);
    this.render();
  }

  // Rukovanje klikom za oslonac
  handleSupportClick(x, y) {
    if (!this.supportType) {
      const el = document.getElementById("coordText");
      if (el)
        el.textContent =
          "Alat: Oslonac | Izaberite tip oslonca (Nepokretan/Pokretan)";
      return;
    }

    const clickedNode = this.findNodeAt(x, y);

    if (clickedNode) {
      clickedNode.type = `support_${this.supportType}`;
      clickedNode.angle = this.supportAngle;
      this.render();

      const el = document.getElementById("coordText");
      const typeLabel =
        this.supportType === "fixed" ? "nepokretan" : "pokretan";
      if (el)
        el.textContent = `Čvor ${clickedNode.id} pretvoren u ${typeLabel} oslonac (${this.supportAngle}°)`;
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

    // Crtaj mrežu (ako je uključena)
    if (this.showGrid) {
      this.renderer.drawGrid();
    }

    // Crtaj sve štapove
    for (const beam of this.beams) {
      this.renderer.drawLine(
        beam.from.x,
        beam.from.y,
        beam.to.x,
        beam.to.y,
        [0.11, 0.08, 0.06, 1],
        4
      );
    }

    // Crtaj sve čvorove
    for (const node of this.nodes) {
      if (node.type === "support_fixed") {
        const angle = node.angle || 0;
        this.renderer.drawFixedSupport(node.x, node.y, angle);
      } else if (node.type === "support_movable") {
        const angle = node.angle || 0;
        this.renderer.drawMovableSupport(node.x, node.y, angle);
      } else {
        this.renderer.drawCircle(node.x, node.y, 6, [0.11, 0.08, 0.06, 1], 24);
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
        this.forceIntensity += 100;
        this.updateIntensityDisplay();
      });
    }

    if (decreaseBtn) {
      decreaseBtn.addEventListener("click", () => {
        this.forceIntensity = Math.max(0, this.forceIntensity - 100);
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
      const force = {
        id: this.forces.length + 1,
        node: clickedNode,
        angle: this.forceAngle,
        intensity: this.forceIntensity,
      };

      const existingForce = this.forces.find(
        (f) => f.node.id === clickedNode.id
      );
      if (existingForce) {
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

  exportToFile() {
    if (this.nodes.length === 0) {
      alert("Nema podataka za export. Prvo nacrtaj konstrukciju.");
      return;
    }

    const modulusInput = document.getElementById("modulusInput");
    const areaInput = document.getElementById("areaInput");
    const E_MPa = modulusInput ? parseFloat(modulusInput.value) : 200000;
    const A_cm2 = areaInput ? parseFloat(areaInput.value) : 5;
    const E = E_MPa * 1e6;
    const A = A_cm2 * 1e-4;

    // Broj podataka
    const numNodes = this.nodes.length;
    const numBeams = this.beams.length;
    const numMaterials = 1;
    const numLoads = this.forces.length;

    // Broj sprečenih pomeranja
    const supports = this.nodes.filter(
      (n) => n.type === "support_fixed" || n.type === "support_movable"
    );
    let numConstraints = 0;
    supports.forEach((node) => {
      if (node.type === "support_fixed") numConstraints += 2; // x i y
      else numConstraints += 1; // samo y
    });

    let content = "";
    content += `${numNodes}\n`;
    content += `${numBeams}\n`;
    content += `${numMaterials}\n`;
    content += `${numLoads}\n`;
    content += `${numConstraints}\n\n`;

    // Koordinate čvorova
    content += "# Koordinate čvorova (x, y)\n";
    this.nodes.forEach((node) => {
      content += `${(node.x / 100).toFixed(6)}  ${(node.y / 100).toFixed(6)}\n`;
    });
    content += "\n";

    // Definicija štapova
    content += "# Definicija štapova (čvor1, čvor2, materijal_id)\n";
    this.beams.forEach((beam) => {
      const idx1 = this.nodes.findIndex((n) => n.id === beam.from.id);
      const idx2 = this.nodes.findIndex((n) => n.id === beam.to.id);
      content += `${idx1}  ${idx2}  0\n`;
    });
    content += "\n";

    // Karakteristike materijala
    content += "# Karakteristike materijala (A, E)\n";
    content += `${A.toExponential(6)}  ${E.toExponential(6)}\n\n`;

    // Opterećenja
    content += "# Opterećenja (čvor, Fx, Fy)\n";
    this.forces.forEach((force) => {
      const idx = this.nodes.findIndex((n) => n.id === force.node.id);
      const angleRad = (force.angle * Math.PI) / 180;
      const fx = force.intensity * Math.cos(angleRad);
      const fy = force.intensity * Math.sin(angleRad);
      content += `${idx}  ${fx.toFixed(6)}  ${fy.toFixed(6)}\n`;
    });
    content += "\n";

    // Sprečena pomeranja
    content += "# Sprečena pomeranja (čvor, pravac, vrednost)\n";
    this.nodes.forEach((node, idx) => {
      if (node.type === "support_fixed") {
        content += `${idx}  0  0.000000\n`;
        content += `${idx}  1  0.000000\n`;
      } else if (node.type === "support_movable") {
        content += `${idx}  1  0.000000\n`;
      }
    });

    // Kreiranje i download fajla
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "MKE-2D.ulz";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    const el = document.getElementById("coordText");
    if (el) {
      el.textContent = `Fajl 'MKE-2D.ulz' je sačuvan! (Čvorovi: ${numNodes}, Štapovi: ${numBeams})`;
    }

    console.log("=== EXPORT MKE-2D.ulz ===");
    console.log(content);
  }
}

// Pokreni aplikaciju kada se stranica učita
document.addEventListener("DOMContentLoaded", () => {
  try {
    const app = new SimpleTrussApp();
    console.log("╔════════════════════════════════════════════════════╗");
    console.log("║   2D REŠETKA - POSTAVKA PROBLEMA                   ║");
    console.log("╠════════════════════════════════════════════════════╣");
    console.log("║  Tastaturne prečice:                               ║");
    console.log("║  [G] - Uključi/isključi mrežu                      ║");
    console.log("║  [E] - Export u MKE-2D.ulz                         ║");
    console.log("║  [Q] - Zatvori aplikaciju                          ║");
    console.log("╚════════════════════════════════════════════════════╝");
  } catch (error) {
    console.error("Greška pri pokretanju aplikacije:", error);
    alert(
      "Greška pri pokretanju aplikacije. Proverite da li vaš pregledač podržava WebGL."
    );
  }
});
