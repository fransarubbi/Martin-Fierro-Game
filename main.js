import * as THREE from 'three';
import { GUI } from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import Stats from 'stats.js';
//import { FirstPersonControls } from 'three/examples/jsm/Addons.js';

var renderer;
var scene;
var camera;
var controls;

var ambientLight;
var directionalLight;
var lampSpotLight;

var clock = new THREE.Clock(), delta = 0, stats, fps = 60, maxTime = 1/fps;

const gui = new GUI();

function inicio(){
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    scene = new THREE.Scene();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    // Helper de cuadrícula y ejes
    var helper = new THREE.GridHelper(10, 10);
    scene.add(helper);

    var axes = new THREE.AxesHelper(20);
    scene.add(axes);

    //inicializar Stats.js para mostrar los FPS
    stats = new Stats();
    stats.showPanel(0);  //0 para mostrar los FPS
    document.body.appendChild(stats.dom);

    // Propiedades de la GUI
    var props = {
        Cuadricula: true,
        Ejes: true,
        Ambiental: true,
        Direccional: true,
        ColorLuz : 0xffffff,
        IntensidadLuz : 1,
        AnguloApertura: Math.PI / 4, //ángulo por defecto (45 grados)
        TamanoSombras: 1024,
        FPS: 60,
    };

    var f1 = gui.addFolder('Ejercicio 6');
    f1.add(props, 'Cuadricula').onChange(function (e) {
        helper.visible = e;
    });
    f1.add(props, 'Ejes').onChange(function (e) {
        axes.visible = e;
    });
    f1.add(props, 'Ambiental').onChange(function (e) {
        if (e)
            scene.add(ambientLight);
        else
            scene.remove(ambientLight);
    });
    f1.add(props, 'Direccional').onChange(function (e) {
        if (e)
            scene.add(directionalLight);
        else
            scene.remove(directionalLight);
    });
    f1.addColor(props, 'ColorLuz').onChange(function (e) {
        lampSpotLight.color.setHex(e);
    });
    f1.add(props, 'IntensidadLuz', 1, 20).onChange(function (e) {
        lampSpotLight.intensity = e;
    });
    f1.add(props, 'AnguloApertura', 0, Math.PI / 2).onChange(function (e) {
        lampSpotLight.angle = e;
    });
    f1.add(props, 'TamanoSombras', 256, 2048).onChange(function (e) {
        lampSpotLight.shadow.mapSize.width = e;
        lampSpotLight.shadow.mapSize.height = e;
        lampSpotLight.shadow.needsUpdate = true; // Forzar la actualización
    });
    f1.add(props, 'FPS', 2, 60).name('FPS').onChange(value => {
        fps = value;  // Actualiza el valor de FPS
        maxTime = 1 / fps;  // Recalcula el tiempo entre cuadros
    });

    // Configuración de la cámara
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    camera.position.set(1, 2, 5);
    
    sceneBuild();
    lights();

    document.addEventListener("keydown", eventoPresionoTecla, false);
}


function lights(){
    //luz ambiental
    ambientLight = new THREE.AmbientLight(0xffffff);
    scene.add(ambientLight);

    //luz direccional
    directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(-500, 1000, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.shadow.camera.near = 0.7;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    //luz spot en linterna
    lampSpotLight = new THREE.SpotLight(0xffffff, 1, 100, Math.PI / 4, 0.5, 2);
    lampSpotLight.angle = Math.PI/6;
    lampSpotLight.penumbra = 0.5;
    lampSpotLight.distance = 30;
    lampSpotLight.decay = 1;
    lampSpotLight.castShadow = true;
    lampSpotLight.shadow.mapSize.width = 2048; 
    lampSpotLight.shadow.mapSize.height = 2048;
    lampSpotLight.shadow.radius = 2;
    scene.add(lampSpotLight);
    scene.add(lampSpotLight.target); //añadir el objetivo de la luz    
}


function flashlight(){
    lampSpotLight.position.x = camera.position.x;
    lampSpotLight.position.y = camera.position.y;
    lampSpotLight.position.z = camera.position.z;

    const cameraDir = new THREE.Vector3();
    camera.getWorldDirection(cameraDir);
    
    const target = new THREE.Vector3();
    target.addVectors(camera.position, cameraDir);

    spotLight.target.position.copy(target);
}


function sceneBuild(){
    
    const loader = new GLTFLoader();

    const ground = new URL('../media/Ground.glb', import.meta.url);
    loader.load(ground.href,
        function(gltf){
            meshGround = gltf.scene;   
            meshGround.traverse(function(child){
                child.castShadow =  true;
                child.receiveShadow = true;
            })         
            meshGround.position.set(0, 0, 0);
            meshGround.scale.set(1.7,0.1,1.5);
            scene.add(meshGround);
        },
        undefined,
        function(error){ console.error(error); }
    );

    const farm = new URL('../media/Granjero.glb', import.meta.url);
    loader.load(farm.href,
        function(gltf){
            meshFarm = gltf.scene;   
            meshFarm.traverse(function(child){
                child.castShadow =  true;
                child.receiveShadow = true;
            })         
            meshFarm.position.set(13, 0.5, -17);
            meshFarm.scale.set(1,1.3,1);
            scene.add(meshFarm);
        },
        undefined,
        function(error){ console.error(error); }
    );

    const woodHouse = new URL('../media/Casa_madera.glb', import.meta.url);
    loader.load(woodHouse.href,
        function(gltf){
            meshWoodHouse = gltf.scene;   
            meshWoodHouse.traverse(function(child){
                child.castShadow =  true;
                child.receiveShadow = true;
            })         
            meshWoodHouse.position.set(0, 0.5, 25);
            meshWoodHouse.rotation.y = Math.PI/2;
            meshWoodHouse.scale.set(1,1.5,1);
            scene.add(meshWoodHouse);
        },
        undefined,
        function(error){ console.error(error); }
    );

    const house = new URL('../media/House.glb', import.meta.url);
    loader.load(house.href,
        function(gltf){
            meshHouse = gltf.scene;   
            meshHouse.traverse(function(child){
                child.castShadow =  true;
                child.receiveShadow = true;
            })         
            meshHouse.position.set(-10, 0.5, 7);
            meshHouse.rotation.y = Math.PI/2;
            meshHouse.scale.set(0.02,0.02,0.02);
            scene.add(meshHouse);
        },
        undefined,
        function(error){ console.error(error); }
    );

    const oldTree = new URL('../media/Arbol.glb', import.meta.url);
    loader.load(oldTree.href,
        function(gltf){
            meshOldTree = gltf.scene;   
            meshOldTree.traverse(function(child){
                child.castShadow =  true;
                child.receiveShadow = true;
            })         
            meshOldTree.position.set(-4,0.2,-10);
            meshOldTree.scale.set(0.5,0.5,0.5);
            scene.add(meshOldTree);
        },
        undefined,
        function(error){ console.error(error); }
    );

    loader.load(oldTree.href,
        function(gltf){
            meshOldTree2 = gltf.scene;   
            meshOldTree2.traverse(function(child){
                child.castShadow =  true;
                child.receiveShadow = true;
            })         
            meshOldTree2.position.set(-8,0.2,-20);
            meshOldTree2.scale.set(0.7,0.7,0.7);
            scene.add(meshOldTree2);
        },
        undefined,
        function(error){ console.error(error); }
    );

    loader.load(oldTree.href,
        function(gltf){
            meshOldTree2 = gltf.scene;   
            meshOldTree2.traverse(function(child){
                child.castShadow =  true;
                child.receiveShadow = true;
            })         
            meshOldTree2.position.set(-14,0.2,-11);
            meshOldTree2.scale.set(0.8,0.8,0.8);
            scene.add(meshOldTree2);
        },
        undefined,
        function(error){ console.error(error); }
    );

    loader.load(oldTree.href,
        function(gltf){
            meshOldTree2 = gltf.scene;   
            meshOldTree2.traverse(function(child){
                child.castShadow =  true;
                child.receiveShadow = true;
            })         
            meshOldTree2.position.set(-16,0.2,-20);
            meshOldTree2.scale.set(0.5,0.5,0.5);
            scene.add(meshOldTree2);
        },
        undefined,
        function(error){ console.error(error); }
    );

    const grass = new URL('../media/Fardos.glb', import.meta.url);
    loader.load(grass.href,
        function(gltf){
            meshGrass = gltf.scene;   
            meshGrass.traverse(function(child){
                child.castShadow =  true;
                child.receiveShadow = true;
            })         
            meshGrass.position.set(16,0,22);
            meshGrass.rotation.y = Math.PI;
            meshGrass.scale.set(5,3,5);
            scene.add(meshGrass);
        },
        undefined,
        function(error){ console.error(error); }
    );

    loader.load(grass.href,
        function(gltf){
            meshGrass2 = gltf.scene;   
            meshGrass2.traverse(function(child){
                child.castShadow =  true;
                child.receiveShadow = true;
            })         
            meshGrass2.position.set(11,0,15);
            meshGrass2.scale.set(3,3,3);
            scene.add(meshGrass2);
        },
        undefined,
        function(error){ console.error(error); }
    );
    
    const carriage = new URL('../media/Carruaje.glb', import.meta.url);
    loader.load(carriage.href,
        function(gltf){
            meshCarriage = gltf.scene;   
            meshCarriage.traverse(function(child){
                child.castShadow =  true;
                child.receiveShadow = true;
            })         
            meshCarriage.position.set(17,0,3);
            //meshCarriage.rotation.y = -Math.PI/6;
            meshCarriage.scale.set(0.4,0.4,0.4);
            scene.add(meshCarriage);
        },
        undefined,
        function(error){ console.error(error); }
    );

    const waterWell = new URL('../media/Pozo_agua.glb', import.meta.url);
    loader.load(waterWell.href,
        function(gltf){
            meshWaterWell = gltf.scene;   
            meshWaterWell.traverse(function(child){
                child.castShadow =  true;
                child.receiveShadow = true;
            })         
            meshWaterWell.position.set(5,0,3);
            meshWaterWell.scale.set(0.015,0.015,0.015);
            scene.add(meshWaterWell);
        },
        undefined,
        function(error){ console.error(error); }
    );

    const cow = new URL('../media/Vaca.glb', import.meta.url);
    loader.load(cow.href,
        function(gltf){
            meshCow = gltf.scene;   
            meshCow.traverse(function(child){
                child.castShadow =  true;
                child.receiveShadow = true;
            })         
            meshCow.position.set(0,0,0);
            meshCow.scale.set(0.2,0.2,0.2);
            scene.add(meshCow);
        },
        undefined,
        function(error){ console.error(error); }
    );

}




function eventoPresionoTecla(event) {
    switch(event.key) {
        case 'w':
        case 'W':
            camera.position.y++;
            break;
        case 's':
        case 'S':
            camera.position.y--;
            break;
        case 'd':
        case 'D':
            camera.position.x++;
            break;
        case 'a':
        case 'A':
            camera.position.x--;
            break;
        case 'e':
        case 'E':
            camera.position.z++;
            break;
        case 'q':
        case 'Q':
            camera.position.z--;
            break;
        case 'o':
        case 'O':
            camaraLookAt = !camaraLookAt;
            break;
        case 'Enter':
            init = true;
            break;
    }
}


function buclePrincipal() {
    
    delta += clock.getDelta();  //acumular el delta del reloj

    //solo renderizar si ha pasado suficiente tiempo (según los fps configurados)
    if (delta >= maxTime) {
        stats.begin();  //inicia la medición de FPS
        controls.update(); //actualiza OrbitControls
        renderer.render(scene, camera);  //renderizar la escena
        delta = delta % maxTime;  //restablecer el delta para la siguiente iteración
        stats.end();  //termina la medición de FPS
    }

    requestAnimationFrame(buclePrincipal); 
}


inicio();
buclePrincipal();
