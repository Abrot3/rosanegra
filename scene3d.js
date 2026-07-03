/* ==========================================================================
   ROSA NEGRA — 3D GRAPHICS ENGINE (THREE.JS + GLTFLOADER)
   Premium cinematic rendering for crime scene and autopsy
   ========================================================================== */

// --- Shared Helper for Hotspot Pulsing ---
function getPulseScale(time, freq, min, max) {
    return min + (Math.sin(time * freq) + 1) / 2 * (max - min);
}

// --- Shared Loading Overlay Helper ---
function showLoading3D(containerId, msg) {
    const container = document.getElementById(containerId);
    if (!container) return;
    let overlay = container.querySelector('.loading-3d-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'loading-3d-overlay';
        overlay.innerHTML = `
            <div class="loading-3d-inner">
                <svg class="loading-spinner" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
                    <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(239,68,68,0.2)" stroke-width="2"/>
                    <circle cx="30" cy="30" r="26" fill="none" stroke="#ef4444" stroke-width="2"
                        stroke-dasharray="40 120" stroke-linecap="round"/>
                    <circle cx="30" cy="30" r="18" fill="none" stroke="rgba(0,240,255,0.3)" stroke-width="1.5"
                        stroke-dasharray="20 60"/>
                </svg>
                <span class="loading-3d-text">${msg}</span>
            </div>
        `;
        container.appendChild(overlay);
    }
    overlay.style.display = 'flex';
}

function hideLoading3D(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const overlay = container.querySelector('.loading-3d-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.6s ease';
        setTimeout(() => { overlay.style.display = 'none'; }, 600);
    }
}

// --------------------------------------------------------------------------
// 1. CRIME SCENE 3D ENGINE — Cozinha.glb
// --------------------------------------------------------------------------
let scene3d = {
    renderer: null,
    scene: null,
    camera: null,
    controls: null,
    hotspots: [],
    animationFrameId: null,
    container: null,
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(),
    clock: new THREE.Clock(),
    model: null,
    clueModels: {},
    markers: []
};

window.initScene3D = function () {
    if (scene3d.renderer) return;

    scene3d.container = document.getElementById("crime-scene-canvas-container");
    if (!scene3d.container) return;

    let width = scene3d.container.clientWidth;
    let height = scene3d.container.clientHeight;

    // Se as dimensões forem zero durante o reflow inicial, obtém as do elemento pai
    if (width === 0 || height === 0) {
        const parentRect = scene3d.container.parentElement.getBoundingClientRect();
        width = parentRect.width || 360;
        height = parentRect.height || 500;
    }

    // A. Setup Scene — sem fog para garantir visibilidade do modelo
    scene3d.scene = new THREE.Scene();
    scene3d.scene.background = new THREE.Color(0x06060e);

    // B. Camera inicial — reposicionada após carregamento
    scene3d.camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 1000);
    scene3d.camera.position.set(0, 5, 12);

    // C. Renderer simples e compatível com r128
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    scene3d.renderer = new THREE.WebGLRenderer({
        antialias: !isMobile,
        powerPreference: "high-performance"
    });
    scene3d.renderer.setSize(width, height);
    scene3d.renderer.setPixelRatio(isMobile ? 1.0 : Math.min(window.devicePixelRatio, 1.5));
    scene3d.renderer.shadowMap.enabled = !isMobile;
    scene3d.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Não usar outputEncoding/toneMapping para evitar materiais pretos
    scene3d.container.appendChild(scene3d.renderer.domElement);

    scene3d.renderer.domElement.addEventListener("webglcontextlost", (event) => {
        event.preventDefault();
        console.warn("WebGL Context Lost na Cena do Crime. Recuperando...");
        if (window.logSystemEvent) {
            window.logSystemEvent("SISTEMA: WebGL Context Lost na Cena do Crime detectado. Recuperando...", "error");
        }
        setTimeout(() => {
            window.disposeScene3D();
            window.initScene3D();
            if (window.loadCrimeSceneClues) {
                window.loadCrimeSceneClues();
            }
        }, 1000);
    }, false);

    // D. Orbit Controls
    scene3d.controls = new THREE.OrbitControls(scene3d.camera, scene3d.renderer.domElement);
    scene3d.controls.enableDamping = true;
    scene3d.controls.dampingFactor = 0.06;
    scene3d.controls.screenSpacePanning = false;
    scene3d.controls.maxPolarAngle = Math.PI / 1.6;
    scene3d.controls.minDistance = 0.5;
    scene3d.controls.maxDistance = 200;

    // E. Iluminação
    setupSceneLighting();

    // F. Grid no chão
    const gridHelper = new THREE.GridHelper(40, 40, 0x0d0d1a, 0x0d0d1a);
    gridHelper.position.y = -0.01;
    scene3d.scene.add(gridHelper);

    // G. Eventos
    initScenePointerEvents();
    scene3d.renderer.domElement.addEventListener("mousemove", onSceneMouseMove);
    window.addEventListener("resize", onSceneResize);

    // H. Carrega modelo
    loadKitchenModel();

    // I. Botões de câmera
    initCameraSwitching();

    // J. Loop de render
    animateScene();
};

function setupSceneLighting() {
    // Luz ambiente forte para garantir visibilidade do modelo
    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    scene3d.scene.add(ambient);

    // Luz direcional principal de cima
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(5, 15, 8);
    keyLight.castShadow = true;
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const shadowSize = isMobile ? 512 : 2048;
    keyLight.shadow.mapSize.set(shadowSize, shadowSize);
    keyLight.shadow.camera.near = 0.1;
    keyLight.shadow.camera.far = 100;
    keyLight.shadow.camera.left = -20;
    keyLight.shadow.camera.right = 20;
    keyLight.shadow.camera.top = 20;
    keyLight.shadow.camera.bottom = -20;
    scene3d.scene.add(keyLight);

    // Preenchimento lateral frio
    const fillLight = new THREE.DirectionalLight(0x8899cc, 0.4);
    fillLight.position.set(-8, 5, -5);
    scene3d.scene.add(fillLight);

    // Rim vermelho sutil
    const rimLight = new THREE.DirectionalLight(0xff3311, 0.2);
    rimLight.position.set(0, 3, -10);
    scene3d.scene.add(rimLight);
}

function loadGLBAsset(path, scaleTarget, position, rotation, onLoadCallback, onErrorCallback) {
    const loader = new THREE.GLTFLoader();
    loader.load(
        path,
        function (gltf) {
            const model = gltf.scene;
            
            // Habilita sombras e ajusta materiais para alta performance e visibilidade clara
            model.traverse(function (child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    if (child.material) {
                        const mats = Array.isArray(child.material) ? child.material : [child.material];
                        mats.forEach(m => {
                            m.roughness = 0.6;
                            m.metalness = 0.1;
                        });
                    }
                }
            });

            // Ajuste de escala baseado no bounding box inicial do asset
            if (scaleTarget) {
                const box = new THREE.Box3().setFromObject(model);
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                if (maxDim > 0) {
                    const scale = scaleTarget / maxDim;
                    model.scale.set(scale, scale, scale);
                }
            }

            // Define posição e rotação relativas
            if (position) model.position.copy(position);
            if (rotation) model.rotation.copy(rotation);

            if (scene3d.kitchenGroup) {
                scene3d.kitchenGroup.add(model);
            }
            if (onLoadCallback) onLoadCallback(model);
        },
        undefined,
        function (error) {
            console.error("Erro ao carregar o modelo:", path, error);
            if (onErrorCallback) onErrorCallback(error);
        }
    );
}

function loadKitchenModel() {
    showLoading3D("crime-scene-canvas-container", "CARREGANDO CENA DO CRIME...");

    // Grupo de composição 3D da cena do crime
    scene3d.kitchenGroup = new THREE.Group();
    scene3d.scene.add(scene3d.kitchenGroup);

    let assetsLoadedCount = 0;
    const totalAssets = 5;

    function onAssetLoaded() {
        assetsLoadedCount++;
        if (assetsLoadedCount === 1) {
            hideLoading3D("crime-scene-canvas-container");
            
            // Foco inicial da câmera no corpo e na Rosa Negra
            scene3d.camera.position.set(0.1, 1.5, 0.2);
            scene3d.controls.target.set(1.3, 0.1, 0.1);
            scene3d.controls.update();
            
            // Renderiza os hotspots interativos
            placeSceneHotspots();
        }
    }

    // 1. Cenário da Cozinha (Cozinha.glb)
    loadGLBAsset(
        'Cozinha.glb',
        10.0,
        new THREE.Vector3(0, 0, 0),
        new THREE.Euler(0, 0, 0),
        function (model) {
            // Centralização geométrica e alinhamento do piso ao Y=0
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            model.position.x = -center.x;
            model.position.z = -center.z;
            model.position.y = -box.min.y; // Alinha o piso ao chão da cena (Y=0)
            
            window.logSystemEvent && window.logSystemEvent("CENA 3D: COZINHA.GLB CARREGADA COM SUCESSO.", "success");
            onAssetLoaded();
        },
        function (error) {
            window.logSystemEvent && window.logSystemEvent("ERRO AO CARREGAR COZINHA.GLB — ATIVANDO CENA PROCEDURAL.", "alert");
            buildFallbackRoom();
            onAssetLoaded();
        }
    );

    // 2. Corpo da Vítima (Corpo.glb)
    loadGLBAsset(
        'Corpo.glb',
        1.7,
        new THREE.Vector3(1.3, 0.1, 0.1),
        new THREE.Euler(-Math.PI / 2, 1.4, Math.PI),
        function (model) {
            window.logSystemEvent && window.logSystemEvent("CENA 3D: CORPO DA VÍTIMA INSTALADO NA CENA.", "success");
            onAssetLoaded();
        },
        function (error) {
            onAssetLoaded();
        }
    );

    // 3. Rosa Negra (Flor.glb)
    loadGLBAsset(
        'Flor.glb',
        0.2,
        new THREE.Vector3(1.3, 0.29, 0.2),
        new THREE.Euler(1, Math.PI, 0),
        function (model) {
            model.traverse(child => {
                child.userData.id = "rosa_negra";
                if (child.isMesh && child.material) {
                    const mats = Array.isArray(child.material) ? child.material : [child.material];
                    mats.forEach(m => {
                        m.color.setHex(0x050505);
                        m.roughness = 0.95;
                        m.metalness = 0.0;
                    });
                }
            });
            scene3d.clueModels["rosa_negra"] = model;
            if (window.appState && window.appState.sentToLab && window.appState.sentToLab["rosa_negra"]) {
                model.visible = true;
                spawnEvidenceMarker("rosa_negra", new THREE.Vector3(model.position.x - 0.15, model.position.y, model.position.z + 0.15));
            }
            onAssetLoaded();
        },
        function (error) {
            onAssetLoaded();
        }
    );

    // 4. Celular da Vítima (Celular.glb)
    loadGLBAsset(
        'Celular.glb',
        0.25,
        new THREE.Vector3(-0.5, 1.01, 0),
        new THREE.Euler(0, Math.PI / 2, 0),
        function (model) {
            model.traverse(child => {
                child.userData.id = "celular_vitima";
            });
            scene3d.clueModels["celular_vitima"] = model;
            if (window.appState && window.appState.sentToLab && window.appState.sentToLab["celular_vitima"]) {
                model.visible = true;
                spawnEvidenceMarker("celular_vitima", new THREE.Vector3(model.position.x - 0.15, model.position.y, model.position.z + 0.15));
            }
            onAssetLoaded();
        },
        function (error) {
            onAssetLoaded();
        }
    );

    // 5. Fragmento de Vidro (Vidro.glb)
    loadGLBAsset(
        'Vidro.glb',
        0.25,
        new THREE.Vector3(0.7, 0.01, 1.2),
        new THREE.Euler(1, Math.PI, 0),
        function (model) {
            model.traverse(child => {
                child.userData.id = "taca_quebrada";
            });
            scene3d.clueModels["taca_quebrada"] = model;
            if (window.appState && window.appState.sentToLab && window.appState.sentToLab["taca_quebrada"]) {
                model.visible = true;
                spawnEvidenceMarker("taca_quebrada", new THREE.Vector3(model.position.x - 0.15, model.position.y, model.position.z + 0.15));
            }
            onAssetLoaded();
        },
        function (error) {
            onAssetLoaded();
        }
    );
}

function buildFallbackRoom() {
    const mat = new THREE.MeshBasicMaterial({ color: 0x1e293b, wireframe: true });

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), mat);
    floor.rotation.x = -Math.PI / 2;
    if (scene3d.kitchenGroup) scene3d.kitchenGroup.add(floor);

    const wallBack = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), mat);
    wallBack.position.set(0, 2, -4);
    if (scene3d.kitchenGroup) scene3d.kitchenGroup.add(wallBack);

    const wallLeft = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), mat);
    wallLeft.rotation.y = Math.PI / 2;
    wallLeft.position.set(-4, 2, 0);
    if (scene3d.kitchenGroup) scene3d.kitchenGroup.add(wallLeft);

    const counter = new THREE.Mesh(new THREE.BoxGeometry(4, 0.8, 1), mat);
    counter.position.set(-2, 0.4, -3);
    if (scene3d.kitchenGroup) scene3d.kitchenGroup.add(counter);
}

function placeSceneHotspots() {
    // Remove hotspots anteriores da cena
    scene3d.hotspots.forEach(h => scene3d.scene.remove(h));
    scene3d.hotspots = [];

    // Spot 1: Rosa Negra (próximo ao corpo)
    createHotspot("rosa_negra", 1.3, 0.29, 0.2, 0xef4444, 0.18);
    // Spot 2: Fragmento de Vidro (no chão)
    createHotspot("taca_quebrada", 0.7, 0.01, 1.2, 0x00f0ff, 0.14);
    // Spot 3: Celular da Vítima (sobre o balcão)
    createHotspot("celular_vitima", -0.5, 1.01, 0, 0x10b981, 0.14);
}

function createHotspot(id, x, y, z, colorHex, radius) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.userData = { id: id };

    const outerGeo = new THREE.SphereGeometry(radius, 16, 16);
    const outerMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.0, // Invisível a pedido do usuário
        wireframe: true
    });
    const outerMesh = new THREE.Mesh(outerGeo, outerMat);
    group.add(outerMesh);

    const innerGeo = new THREE.SphereGeometry(radius * 0.4, 12, 12);
    const innerMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.0 // Invisível a pedido do usuário
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    group.add(innerMesh);

    scene3d.scene.add(group);
    scene3d.hotspots.push(group);
}

function initCameraSwitching() {
    const camButtons = document.querySelectorAll("#view-scene .camera-btn");
    
    // Configura botões para estado inicial
    camButtons.forEach(btn => {
        const camType = btn.getAttribute("data-camera");
        if (camType === "corpo") {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    camButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            camButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const camType = btn.getAttribute("data-camera");
            if (camType === "corpo") {
                gsapToCameraTarget(new THREE.Vector3(1.3, 0.1, 0.1), new THREE.Vector3(0.1, 1.5, 0.2));
            } else if (camType === "celular") {
                gsapToCameraTarget(new THREE.Vector3(-0.5, 1.01, 0), new THREE.Vector3(-0.5, 1.6, 0.8));
            } else if (camType === "vidro") {
                gsapToCameraTarget(new THREE.Vector3(0.7, 0.01, 1.2), new THREE.Vector3(0.7, 0.8, 2.0));
            }
        });
    });
}

function gsapToCameraTarget(targetPos, camPos) {
    if (!scene3d.controls || !scene3d.camera) return;
    const targetLook = new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z);
    const cameraTarget = new THREE.Vector3(camPos.x, camPos.y, camPos.z);
    let step = 0;
    const maxSteps = 25;

    function cameraTween() {
        if (step < maxSteps) {
            scene3d.controls.target.lerp(targetLook, 0.15);
            scene3d.camera.position.lerp(cameraTarget, 0.12);
            scene3d.controls.update();
            step++;
            requestAnimationFrame(cameraTween);
        }
    }
    cameraTween();
}


function initAutopsyCameraSwitching() {
    const autopsyBtns = document.querySelectorAll("#view-autopsy .camera-btn");
    autopsyBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            autopsyBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const region = btn.getAttribute("data-camera");
            
            let targetPos;
            if (region === "neck") {
                targetPos = new THREE.Vector3(0.0, 1.54, 0.08);
            } else {
                targetPos = new THREE.Vector3(0.09, 0.72, 0.12);
            }
            
            openAutopsyDrawer(region);
            gsapToAutopsyTarget(targetPos);
        });
    });
}

function animateScene() {
    scene3d.animationFrameId = requestAnimationFrame(animateScene);

    const elapsed = scene3d.clock.getElapsedTime();

    // Animate hotspot groups
    scene3d.hotspots.forEach((group, i) => {
        const scale = getPulseScale(elapsed + i * 0.5, 2.5, 0.8, 1.25);
        group.scale.set(scale, scale, scale);
        group.rotation.y += 0.02;
    });

    if (scene3d.controls) scene3d.controls.update();

    // Telemetry HUD update
    if (scene3d.camera) {
        const p = scene3d.camera.position;
        const tx = document.getElementById("scene-tel-x");
        const ty = document.getElementById("scene-tel-y");
        const tz = document.getElementById("scene-tel-z");
        const tr = document.getElementById("scene-tel-rot");
        if (tx) tx.textContent = p.x.toFixed(2);
        if (ty) ty.textContent = p.y.toFixed(2);
        if (tz) tz.textContent = p.z.toFixed(2);
        if (tr) tr.textContent = scene3d.camera.rotation.y.toFixed(2);
    }

    if (scene3d.renderer && scene3d.scene && scene3d.camera) {
        scene3d.renderer.render(scene3d.scene, scene3d.camera);
    }
}

function handleSceneRaycast() {
    scene3d.raycaster.setFromCamera(scene3d.mouse, scene3d.camera);

    if (!scene3d.kitchenGroup) return;
    const intersects = scene3d.raycaster.intersectObjects(scene3d.kitchenGroup.children, true);

    if (intersects.length > 0) {
        let evidenceId = null;
        let current = intersects[0].object;
        while (current) {
            if (current.userData && current.userData.id) {
                evidenceId = current.userData.id;
                break;
            }
            current = current.parent;
        }

        if (evidenceId && evidenceId !== "cozinha" && evidenceId !== "corpo") {
            if (window.appState && window.appState.sentToLab) {
                openEvidenceDrawer(evidenceId);
                
                // Zoom focus targets
                let targetPos;
                if (evidenceId === "rosa_negra") {
                    targetPos = new THREE.Vector3(1.3, 0.29, 0.2);
                } else if (evidenceId === "celular_vitima") {
                    targetPos = new THREE.Vector3(-0.5, 1.01, 0);
                } else {
                    targetPos = new THREE.Vector3(0.7, 0.01, 1.2);
                }
                gsapToTarget(targetPos);
            }
        }
    }
}

function openEvidenceDrawer(id) {
    const evidence = window.evidenceData[id];
    if (!evidence) return;

    window.appState.selectedEvidenceId = id;

    document.getElementById("scene-evidence-title").textContent = evidence.title;
    document.getElementById("scene-evidence-description").textContent = evidence.description;

    const sendBtn = document.getElementById("btn-send-to-lab");

    if (window.appState.sentToLab[id]) {
        sendBtn.innerHTML = `<i data-lucide="check"></i> JÁ RECOLHIDO E ENVIADO AO LAB`;
        sendBtn.className = "btn btn-secondary btn-full";
        sendBtn.disabled = true;
    } else {
        sendBtn.innerHTML = `<i data-lucide="flask"></i> RECOLHER E ENVIAR AO LABORATÓRIO`;
        sendBtn.className = "btn btn-primary btn-full";
        sendBtn.disabled = false;
    }

    lucide.createIcons();
    document.getElementById("scene-detail-panel").classList.add("active");
}

let isSceneDragging = false;
let sceneDragStartX = 0;
let sceneDragStartY = 0;

function initScenePointerEvents() {
    const el = scene3d.renderer.domElement;
    el.addEventListener("mousedown", (e) => {
        isSceneDragging = false;
        sceneDragStartX = e.clientX;
        sceneDragStartY = e.clientY;
    });
    
    el.addEventListener("mouseup", (e) => {
        const dx = e.clientX - sceneDragStartX;
        const dy = e.clientY - sceneDragStartY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 6) {
            isSceneDragging = true;
        }
        
        if (!isSceneDragging) {
            const rect = el.getBoundingClientRect();
            scene3d.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            scene3d.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            handleSceneRaycast();
        }
    });

    el.addEventListener("touchstart", (e) => {
        isSceneDragging = false;
        if (e.touches.length > 0) {
            sceneDragStartX = e.touches[0].clientX;
            sceneDragStartY = e.touches[0].clientY;
        }
    }, { passive: true });

    el.addEventListener("touchend", (e) => {
        if (e.changedTouches.length > 0) {
            const dx = e.changedTouches[0].clientX - sceneDragStartX;
            const dy = e.changedTouches[0].clientY - sceneDragStartY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 6) {
                isSceneDragging = true;
            }
        }
        
        if (!isSceneDragging && e.changedTouches.length > 0) {
            const rect = el.getBoundingClientRect();
            scene3d.mouse.x = ((e.changedTouches[0].clientX - rect.left) / rect.width) * 2 - 1;
            scene3d.mouse.y = -((e.changedTouches[0].clientY - rect.top) / rect.height) * 2 + 1;
            handleSceneRaycast();
        }
    });
}

function onSceneMouseMove(e) {
    if (!scene3d.renderer || !scene3d.kitchenGroup) return;
    
    const rect = scene3d.renderer.domElement.getBoundingClientRect();
    scene3d.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    scene3d.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    scene3d.raycaster.setFromCamera(scene3d.mouse, scene3d.camera);
    const intersects = scene3d.raycaster.intersectObjects(scene3d.kitchenGroup.children, true);

    let isHoveringClue = false;
    if (intersects.length > 0) {
        let current = intersects[0].object;
        while (current) {
            if (current.userData && current.userData.id) {
                const clueId = current.userData.id;
                if (clueId === "rosa_negra" || clueId === "celular_vitima" || clueId === "taca_quebrada") {
                    if (window.appState && window.appState.sentToLab && !window.appState.sentToLab[clueId]) {
                        isHoveringClue = true;
                    }
                }
                break;
            }
            current = current.parent;
        }
    }

    if (isHoveringClue) {
        scene3d.renderer.domElement.style.cursor = 'pointer';
    } else {
        scene3d.renderer.domElement.style.cursor = 'auto';
    }
}

function onSceneResize() {
    if (!scene3d.container || !scene3d.renderer || !scene3d.camera) return;
    const w = scene3d.container.clientWidth;
    const h = scene3d.container.clientHeight;
    scene3d.camera.aspect = w / h;
    scene3d.camera.updateProjectionMatrix();
    scene3d.renderer.setSize(w, h);
}

window.disposeScene3D = function () {
    cancelAnimationFrame(scene3d.animationFrameId);

    if (scene3d.renderer) {
        scene3d.renderer.domElement.removeEventListener("mousemove", onSceneMouseMove);
        window.removeEventListener("resize", onSceneResize);
        scene3d.container.removeChild(scene3d.renderer.domElement);
        scene3d.renderer.dispose();
    }

    scene3d.renderer = null;
    scene3d.scene = null;
    scene3d.camera = null;
    scene3d.controls = null;
    scene3d.hotspots = [];
    scene3d.model = null;
    scene3d.kitchenGroup = null;
    scene3d.clueModels = {};
    scene3d.markers = [];
};


// --------------------------------------------------------------------------
// 2. AUTOPSY 3D ENGINE — Corpo.glb
// --------------------------------------------------------------------------
let autopsy3d = {
    renderer: null,
    scene: null,
    camera: null,
    controls: null,
    hotspots: [],
    animationFrameId: null,
    container: null,
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(),
    clock: new THREE.Clock(),
    model: null,
    modelSize: { x: 1, y: 2, z: 1 },
    bodyMannequin: null,
    examinedMarkers: []
};

window.initAutopsy3D = function () {
    if (autopsy3d.renderer) return;

    autopsy3d.container = document.getElementById("autopsy-canvas-container");
    if (!autopsy3d.container) return;

    let width = autopsy3d.container.clientWidth;
    let height = autopsy3d.container.clientHeight;

    // Se as dimensões forem zero durante o reflow inicial, obtém as do elemento pai
    if (width === 0 || height === 0) {
        const parentRect = autopsy3d.container.parentElement.getBoundingClientRect();
        width = parentRect.width || 360;
        height = parentRect.height || 500;
    }

    // Scene setup — dark medical/forensic atmosphere
    autopsy3d.scene = new THREE.Scene();
    autopsy3d.scene.background = new THREE.Color(0x020208);
    autopsy3d.scene.fog = new THREE.FogExp2(0x020208, 0.04);

    autopsy3d.camera = new THREE.PerspectiveCamera(40, width / height, 0.01, 200);
    autopsy3d.camera.position.set(0, 3, 6);

    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    autopsy3d.renderer = new THREE.WebGLRenderer({
        antialias: !isMobile,
        powerPreference: "high-performance"
    });
    autopsy3d.renderer.setSize(width, height);
    autopsy3d.renderer.setPixelRatio(isMobile ? 1.0 : Math.min(window.devicePixelRatio, 1.5));
    autopsy3d.renderer.shadowMap.enabled = !isMobile;
    autopsy3d.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Sem outputEncoding/toneMapping para compatibilidade com r128
    autopsy3d.container.appendChild(autopsy3d.renderer.domElement);

    // Orbit controls — locked mostly top-down for autopsy table view
    autopsy3d.controls = new THREE.OrbitControls(autopsy3d.camera, autopsy3d.renderer.domElement);
    autopsy3d.controls.enableDamping = true;
    autopsy3d.controls.dampingFactor = 0.06;
    autopsy3d.controls.minDistance = 0.5;
    autopsy3d.controls.maxDistance = 20;
    autopsy3d.controls.target.set(0, 1, 0);

    // Autopsy lighting — cold, clinical, with a red forensic accent
    setupAutopsyLighting();

    // Autopsy table slab (ground plane)
    const tableGeo = new THREE.PlaneGeometry(6, 12);
    const tableMat = new THREE.MeshStandardMaterial({
        color: 0x0a1020,
        roughness: 0.8,
        metalness: 0.2
    });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.rotation.x = -Math.PI / 2;
    table.receiveShadow = true;
    autopsy3d.scene.add(table);

    // Subtle grid overlay
    const grid = new THREE.GridHelper(10, 20, 0x0d1a2e, 0x0d1a2e);
    grid.position.y = 0.001;
    autopsy3d.scene.add(grid);

    // Grupo contenedor para o corpo e marcadores holográficos
    autopsy3d.bodyMannequin = new THREE.Group();
    autopsy3d.scene.add(autopsy3d.bodyMannequin);

    // Load Corpo.glb
    loadBodyModel();

    // Event Listeners
    autopsy3d.renderer.domElement.addEventListener("mousedown", onAutopsyMouseDown);
    autopsy3d.renderer.domElement.addEventListener("mouseup", onAutopsyMouseUp);
    autopsy3d.renderer.domElement.addEventListener("touchstart", onAutopsyTouchStart, { passive: true });
    autopsy3d.renderer.domElement.addEventListener("touchend", onAutopsyTouchEnd);
    window.addEventListener("resize", onAutopsyResize);

    autopsy3d.renderer.domElement.addEventListener("webglcontextlost", (event) => {
        event.preventDefault();
        console.warn("WebGL Context Lost na Autópsia. Recuperando...");
        if (window.logSystemEvent) {
            window.logSystemEvent("SISTEMA: WebGL Context Lost na Autópsia detectado. Recuperando...", "error");
        }
        setTimeout(() => {
            window.disposeAutopsy3D();
            window.initAutopsy3D();
            if (window.loadAutopsyModel) {
                window.loadAutopsyModel();
            }
        }, 1000);
    }, false);

    // Wire autopsy region buttons
    initAutopsyCameraSwitching();

    animateAutopsy();
};

function setupAutopsyLighting() {
    // Dim base ambient
    const ambient = new THREE.AmbientLight(0x8090b0, 0.5);
    autopsy3d.scene.add(ambient);

    // Clinical overhead white light
    const overhead = new THREE.DirectionalLight(0xe8f0ff, 1.0);
    overhead.position.set(0, 8, 0);
    overhead.castShadow = true;
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const shadowSize = isMobile ? 512 : 1024;
    overhead.shadow.mapSize.set(shadowSize, shadowSize);
    overhead.shadow.camera.near = 0.5;
    overhead.shadow.camera.far = 20;
    overhead.shadow.camera.left = -4;
    overhead.shadow.camera.right = 4;
    overhead.shadow.camera.top = 6;
    overhead.shadow.camera.bottom = -6;
    autopsy3d.scene.add(overhead);

    // Cold blue side fill
    const fillBlue = new THREE.DirectionalLight(0x4488ff, 0.3);
    fillBlue.position.set(-4, 3, 2);
    autopsy3d.scene.add(fillBlue);

    // Red forensic accent from above-front
    const redSpot = new THREE.SpotLight(0xff1111, 0.4, 12, Math.PI / 8, 0.6);
    redSpot.position.set(0.5, 5, 2);
    redSpot.target.position.set(0, 0, 0);
    autopsy3d.scene.add(redSpot);
    autopsy3d.scene.add(redSpot.target);

    // Subtle green-tint fill (forensic UV light effect)
    const uvLight = new THREE.PointLight(0x00ff88, 0.12, 10);
    uvLight.position.set(2, 1, 1);
    autopsy3d.scene.add(uvLight);
}

function loadBodyModel() {
    showLoading3D("autopsy-canvas-container", "CARREGANDO MODELO DO CORPO...");

    const loader = new THREE.GLTFLoader();
    loader.load(
        'Corpo.glb',
        function (gltf) {
            const model = gltf.scene;

            model.traverse(function (child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    if (child.material) {
                        const mats = Array.isArray(child.material) ? child.material : [child.material];
                        mats.forEach(m => {
                            m.envMapIntensity = 0.3;
                        });
                    }
                }
            });

            // 1. Ajusta a escala baseado no bounding box inicial (para 1.8 units, padrão do site referência)
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const targetHeight = 1.8;
            const scaleF = size.y > 0 ? (targetHeight / size.y) : 1.0;
            model.scale.set(scaleF, scaleF, scaleF);

            // 2. Centraliza e posiciona a silhueta do corpo sobre a mesa usando o box já escalado
            const boxScaled = new THREE.Box3().setFromObject(model);
            const centerScaled = boxScaled.getCenter(new THREE.Vector3());
            model.position.x = -centerScaled.x;
            model.position.z = -centerScaled.z;
            model.position.y = -boxScaled.min.y; // Alinha com a superfície da mesa (Y=0)

            autopsy3d.model = model;
            if (autopsy3d.bodyMannequin) {
                autopsy3d.bodyMannequin.add(model);
            }

            // Compute final scaled dimensions
            const scaledSize = size.clone().multiplyScalar(scaleF);
            autopsy3d.modelSize = scaledSize;

            // Position camera for a good top-angled view
            const bodyHeight = scaledSize.y;
            const bodyDepth = Math.max(scaledSize.x, scaledSize.z);
            const camZ = bodyDepth * 2.5 + bodyHeight;
            const camY = bodyHeight * 1.6;

            autopsy3d.camera.position.set(0, camY, camZ * 0.8);
            autopsy3d.controls.target.set(0, bodyHeight * 0.5, 0);
            autopsy3d.controls.update();
            autopsy3d.controls.minDistance = 0.3;
            autopsy3d.controls.maxDistance = camZ * 2.5;

            // Place hotspots on the body
            placeAutopsyHotspots(scaledSize, model.position.y);

            hideLoading3D("autopsy-canvas-container");
            window.logSystemEvent && window.logSystemEvent("AUTÓPSIA 3D: CORPO.GLB CARREGADO — LAUDO NECROSCÓPICO ATIVO.", "success");
        },
        function (xhr) {
            const pct = Math.round((xhr.loaded / xhr.total) * 100);
            const overlay = document.querySelector('#autopsy-canvas-container .loading-3d-text');
            if (overlay) overlay.textContent = `CARREGANDO MODELO DO CORPO... ${pct}%`;
        },
        function (error) {
            console.error("Error loading Corpo.glb:", error);
            window.logSystemEvent && window.logSystemEvent("ERRO AO CARREGAR CORPO.GLB — ATIVANDO SILHUETA PROCEDURAL.", "alert");
            hideLoading3D("autopsy-canvas-container");
            buildFallbackBody();
        }
    );
}

function buildFallbackBody() {
    // Procedural body silhouette
    const wireMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8, wireframe: false });
    const bodyGroup = new THREE.Group();

    // Head
    bodyGroup.add(Object.assign(new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), wireMat), { position: new THREE.Vector3(0, 1.68, 0) }));
    // Neck
    bodyGroup.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.18, 8), wireMat), { position: new THREE.Vector3(0, 1.48, 0) }));
    // Torso
    bodyGroup.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 0.8, 10, 2), wireMat), { position: new THREE.Vector3(0, 1.0, 0) }));
    // Hips
    bodyGroup.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.35, 10, 2), wireMat), { position: new THREE.Vector3(0, 0.56, 0) }));
    // Arms
    const armGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.75, 8);
    const armL = new THREE.Mesh(armGeo, wireMat);
    armL.position.set(-0.42, 1.02, 0.05);
    armL.rotation.z = 0.3;
    bodyGroup.add(armL);
    const armR = armL.clone();
    armR.position.x = 0.42;
    armR.rotation.z = -0.3;
    bodyGroup.add(armR);
    // Legs
    const legGeo = new THREE.CylinderGeometry(0.1, 0.08, 1.0, 8);
    const legL = new THREE.Mesh(legGeo, wireMat);
    legL.position.set(-0.14, -0.12, 0);
    bodyGroup.add(legL);
    const legR = legL.clone();
    legR.position.x = 0.14;
    bodyGroup.add(legR);
    bodyGroup.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
    autopsy3d.model = bodyGroup;
    if (autopsy3d.bodyMannequin) {
        autopsy3d.bodyMannequin.add(bodyGroup);
    }

    autopsy3d.camera.position.set(0, 2.5, 4.5);
    autopsy3d.controls.target.set(0, 0.9, 0);
    autopsy3d.controls.update();

    placeAutopsyHotspots({ x: 0.6, y: 1.8, z: 0.4 }, 0);
}

function placeAutopsyHotspots(scaledSize, baseY) {
    // Limpa hotspots e elementos anteriores do mannequin
    autopsy3d.hotspots = [];
    if (autopsy3d.bodyMannequin && autopsy3d.model) {
        const toRemove = [];
        autopsy3d.bodyMannequin.children.forEach(child => {
            if (child !== autopsy3d.model) {
                toRemove.push(child);
            }
        });
        toRemove.forEach(child => autopsy3d.bodyMannequin.remove(child));
    }

    const currentScale = 1.0; // Proporção da escala de 1.8

    // 🔴 LESÃO 1: PESCOÇO (PERFURAÇÃO)
    const targetPescoco = new THREE.Vector3(0.0, 1.54 * currentScale, 0.08 * currentScale);
    const labelPescoco  = new THREE.Vector3(-0.45 * currentScale, 1.62 * currentScale, 0.15 * currentScale);
    addCallout("neck", "PERFURAÇÃO", targetPescoco, labelPescoco);

    // 🔴 LESÃO 2: COXA DIREITA (HEMATOMA DE TAPA)
    const targetCoxa = new THREE.Vector3(0.09 * currentScale, 0.72 * currentScale, 0.12 * currentScale);
    const labelCoxa  = new THREE.Vector3(0.55 * currentScale, 0.65 * currentScale, 0.15 * currentScale);
    addCallout("thigh", "HEMATOMA", targetCoxa, labelCoxa);
}

function addCallout(id, labelText, targetPos, labelPos) {
    // 1. Criar o Canvas da etiqueta de texto retro-forense
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    // Fundo escuro semitransparente
    ctx.fillStyle = 'rgba(8, 10, 16, 0.85)';
    ctx.fillRect(0, 0, 256, 64);
    
    // Borda vermelha brilhante de neon
    ctx.strokeStyle = '#ff1111';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, 256, 64);
    
    // Texto
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ff1111';
    ctx.shadowBlur = 6;
    ctx.fillText(labelText, 128, 32);
    
    // Gerar a textura a partir do Canvas
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.copy(labelPos);
    sprite.scale.set(0.5, 0.125, 1.0);
    sprite.userData = { markerId: id };
    sprite.isSprite = true;
    
    if (autopsy3d.bodyMannequin) {
        autopsy3d.bodyMannequin.add(sprite);
    }
    autopsy3d.hotspots.push(sprite);

    // 2. Criar a seta indicativa (ArrowHelper) que aponta do Texto para a lesão
    const direction = new THREE.Vector3().subVectors(targetPos, labelPos).normalize();
    const distance = labelPos.distanceTo(targetPos);
    
    const headLength = 0.08;
    const headWidth = 0.05;
    
    const arrow = new THREE.ArrowHelper(direction, labelPos, distance, 0xff1111, headLength, headWidth);
    
    if (arrow.line) {
        arrow.line.userData = { markerId: id };
        autopsy3d.hotspots.push(arrow.line);
    }
    if (arrow.cone) {
        arrow.cone.userData = { markerId: id };
        autopsy3d.hotspots.push(arrow.cone);
    }
    
    if (autopsy3d.bodyMannequin) {
        autopsy3d.bodyMannequin.add(arrow);
    }
}

function animateAutopsy() {
    autopsy3d.animationFrameId = requestAnimationFrame(animateAutopsy);

    const elapsed = autopsy3d.clock.getElapsedTime();

    // Pulsar e atualizar marcadores holográficos e setas de indicação
    if (autopsy3d.hotspots && autopsy3d.hotspots.length) {
        const t = elapsed * 3.0;
        autopsy3d.hotspots.forEach((m, i) => {
            const examined = autopsy3d.examinedMarkers && autopsy3d.examinedMarkers.includes(m.userData.markerId);
            const colorHex = examined ? 0x27ae60 : 0xff1111;

            if (m.isSprite) {
                // Pulsa escala mantendo a proporção
                const s = 1.0 + Math.sin(t + i * 1.5) * 0.06;
                m.scale.set(0.5 * s, 0.125 * s, 1.0);
                
                if (m.material) {
                    m.material.opacity = 0.85 + Math.sin(t * 2) * 0.15;
                    m.material.color.setHex(examined ? 0x27ae60 : 0xffffff);
                }
            } else {
                if (m.material) {
                    m.material.color.setHex(colorHex);
                }
            }
        });
    }

    if (autopsy3d.controls) autopsy3d.controls.update();

    // Telemetry HUD
    if (autopsy3d.camera) {
        const p = autopsy3d.camera.position;
        const tx = document.getElementById("autopsy-tel-x");
        const ty = document.getElementById("autopsy-tel-y");
        const tz = document.getElementById("autopsy-tel-z");
        const r = document.getElementById("autopsy-tel-rot");
        if (tx) tx.textContent = p.x.toFixed(2);
        if (ty) ty.textContent = p.y.toFixed(2);
        if (tz) tz.textContent = p.z.toFixed(2);
        if (r) r.textContent = (Math.abs(Math.sin(elapsed * 1.5)) * 40 + 60).toFixed(1);
    }

    if (autopsy3d.renderer && autopsy3d.scene && autopsy3d.camera) {
        autopsy3d.renderer.render(autopsy3d.scene, autopsy3d.camera);
    }
}

function handleAutopsyRaycast() {
    autopsy3d.raycaster.setFromCamera(autopsy3d.mouse, autopsy3d.camera);

    const intersects = autopsy3d.raycaster.intersectObjects(autopsy3d.hotspots, true);

    if (intersects.length > 0) {
        const obj = intersects[0].object;
        const regionId = obj.userData.markerId;
        if (regionId) {
            openAutopsyDrawer(regionId);
            
            // Zoom focus to targetPos
            let targetPos;
            if (regionId === "neck") {
                targetPos = new THREE.Vector3(0.0, 1.54, 0.08);
            } else {
                targetPos = new THREE.Vector3(0.09, 0.72, 0.12);
            }
            gsapToAutopsyTarget(targetPos);
        }
    }
}

function openAutopsyDrawer(id) {
    const region = window.autopsyData[id];
    if (!region) return;

    // Adiciona ao registro local de examinados para coloração dinâmica em verde
    if (autopsy3d.examinedMarkers && !autopsy3d.examinedMarkers.includes(id)) {
        autopsy3d.examinedMarkers.push(id);
    }

    document.getElementById("autopsy-region-title").textContent = region.title;
    document.getElementById("autopsy-region-severity").textContent = region.severity;
    document.getElementById("autopsy-region-description").textContent = region.description;
    document.getElementById("autopsy-region-relation").textContent = region.relation;

    const badge = document.getElementById("autopsy-region-severity");
    if (region.severity === "CRÍTICO" || region.severity === "GRAVE") {
        badge.className = "badge badge-danger";
        badge.style.borderColor = region.severity === "CRÍTICO" ? "rgba(239,68,68,0.8)" : "rgba(239,68,68,0.5)";
    } else {
        badge.className = "badge badge-accent";
        badge.style.borderColor = "";
    }

    document.getElementById("autopsy-detail-panel").classList.add("active");
}

function gsapToAutopsyTarget(targetPos) {
    const targetLook = new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z);
    let step = 0;
    const maxSteps = 20;

    function cameraTween() {
        if (step < maxSteps) {
            autopsy3d.controls.target.lerp(targetLook, 0.15);
            const camTarget = new THREE.Vector3(
                targetPos.x,
                targetPos.y + 0.6,
                targetPos.z + 1.8
            );
            autopsy3d.camera.position.lerp(camTarget, 0.08);
            step++;
            requestAnimationFrame(cameraTween);
        }
    }
    cameraTween();
}

let isAutopsyDragging = false;
let autopsyDragStartX = 0;
let autopsyDragStartY = 0;

function onAutopsyMouseDown(e) {
    isAutopsyDragging = false;
    autopsyDragStartX = e.clientX;
    autopsyDragStartY = e.clientY;
}

function onAutopsyMouseUp(e) {
    const deltaX = Math.abs(e.clientX - autopsyDragStartX);
    const deltaY = Math.abs(e.clientY - autopsyDragStartY);
    if (deltaX < 5 && deltaY < 5) {
        if (!autopsy3d.renderer) return;
        const rect = autopsy3d.renderer.domElement.getBoundingClientRect();
        autopsy3d.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        autopsy3d.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        handleAutopsyRaycast();
    }
}

function onAutopsyTouchStart(e) {
    isAutopsyDragging = false;
    if (e.touches.length > 0) {
        autopsyDragStartX = e.touches[0].clientX;
        autopsyDragStartY = e.touches[0].clientY;
    }
}

function onAutopsyTouchEnd(e) {
    if (e.changedTouches.length > 0) {
        const dx = e.changedTouches[0].clientX - autopsyDragStartX;
        const dy = e.changedTouches[0].clientY - autopsyDragStartY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 6) {
            isAutopsyDragging = true;
        }
    }
    
    if (!isAutopsyDragging && e.changedTouches.length > 0) {
        if (!autopsy3d.renderer) return;
        const rect = autopsy3d.renderer.domElement.getBoundingClientRect();
        autopsy3d.mouse.x = ((e.changedTouches[0].clientX - rect.left) / rect.width) * 2 - 1;
        autopsy3d.mouse.y = -((e.changedTouches[0].clientY - rect.top) / rect.height) * 2 + 1;
        handleAutopsyRaycast();
    }
}

function onAutopsyResize() {
    if (!autopsy3d.container || !autopsy3d.renderer || !autopsy3d.camera) return;
    const w = autopsy3d.container.clientWidth;
    const h = autopsy3d.container.clientHeight;
    autopsy3d.camera.aspect = w / h;
    autopsy3d.camera.updateProjectionMatrix();
    autopsy3d.renderer.setSize(w, h);
}

window.disposeAutopsy3D = function () {
    cancelAnimationFrame(autopsy3d.animationFrameId);

    if (autopsy3d.renderer) {
        autopsy3d.renderer.domElement.removeEventListener("mousedown", onAutopsyMouseDown);
        autopsy3d.renderer.domElement.removeEventListener("mouseup", onAutopsyMouseUp);
        autopsy3d.renderer.domElement.removeEventListener("touchstart", onAutopsyTouchStart);
        autopsy3d.renderer.domElement.removeEventListener("touchend", onAutopsyTouchEnd);
        window.removeEventListener("resize", onAutopsyResize);
        autopsy3d.container.removeChild(autopsy3d.renderer.domElement);
        autopsy3d.renderer.dispose();
    }

    autopsy3d.renderer = null;
    autopsy3d.scene = null;
    autopsy3d.camera = null;
    autopsy3d.controls = null;
    autopsy3d.hotspots = [];
    autopsy3d.model = null;
    autopsy3d.bodyMannequin = null;
    autopsy3d.examinedMarkers = [];
};

// --- Clue Collection & Forensics Evidence Marker Spawning ---
function spawnEvidenceMarker(clueId, position) {
    // Disable markers as requested by the user: "sem os pins e esses negocios amarelhos, apenas as evidencias"
    return;
}

window.collectClue3D = function(clueId) {
    const model = scene3d.clueModels && scene3d.clueModels[clueId];
    if (model && model.visible) {
        model.visible = false;
        
        // Spawn yellow forensic marker card
        spawnEvidenceMarker(clueId, model.position);
        
        if (window.logSystemEvent) {
            window.logSystemEvent(`CENA 3D: EVIDÊNCIA ${clueId.toUpperCase()} ARMAZENADA // MARCADOR REGISTRADO.`, "warning");
        }
    }
};
