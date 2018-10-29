/// <reference path="../types/three/index.d.ts" />

var road_geo = new THREE.PlaneGeometry(5*game_values.side_limits, 2);
var car_geo = new THREE.BoxGeometry(3,2,1);
var logBox_geo = new THREE.BoxGeometry(5, 2, 2);
var logLog_geo = new THREE.PlaneGeometry(5,1.8);

var TILE_SPACING = 2;

var tileEnum = {
    road:0,
    obstacle:1,
    river:2
}
Object.freeze(tileEnum);

function makeRoad(Z){
    var tile = new THREE.Object3D();
    tile.type = tileEnum.road;
    tile.Z = Z;
    scene.add(tile);
    var road = new THREE.Mesh(road_geo, materials['pavement']);
    road.position.set(0, 0.01, Z);
    road.rotation.x = -Math.PI/2;
    tile.add(road);
    var car1 = new THREE.Mesh(car_geo, materials['car']);
    tile.add(car1);
    objects.cars.push(car1);
    var car2 = new THREE.Mesh(car_geo, materials['car']);
    tile.add(car2);
    objects.cars.push(car2);

    tile.content = [];
    tile.content.push(car1);
    tile.content.push(car2);

    var start = 3*game_values.side_limits;
    var lane = 0.5;
    if(Math.random() > 0.5){
        start *= -1;
        lane *= -1;
    }
    car1.position.set(start, 0, Z + lane);
    car2.position.set(start, 0, Z - lane);
    var duration = 3000 + 2000*Math.random();

    car1.animation = new KF.KeyFrameAnimator;
    car1.animation.init({
        interps: [{ 
            keys:[0, 1], 
            values:[
                { x : start},
                { x : -start},
            ],
            target:car1.position
        }],
        loop: true,
        duration: duration
    });
    car2.animation = new KF.KeyFrameAnimator;
    car2.animation.init({
        interps: [{ 
            keys:[0, 1], 
            values:[
                { x : -start},
                { x : start},
            ],
            target:car2.position
        }],
        loop: true,
        duration: duration
    });
    setTimeout(()=>{car1.animation.start();}, 2000*Math.random());
    setTimeout(()=>{car2.animation.start();}, 2000*Math.random());
    return tile;
}

function makeObstacles(Z){
    var tile = new THREE.Object3D();
    tile.content = [];
    tile.type = tileEnum.obstacle;
    tile.Z = Z;
    var tree_count = 3 + 4*Math.round(Math.random());
    for (let index = 0; index < tree_count; index++) {
        var X = 2*game_values.side_limits*Math.random() - game_values.side_limits;
        var tree = makeTree(X, Z);
        tile.content.push(tree);
        tile.add(tree);
    }
    scene.add(tile);
    return tile;
}

function makeTree(X, Z){
    var newTree = objects.tree1.clone();
    objects.obstacles.push(newTree);
    newTree.position.set(X, 0, Z);
    newTree.box = new THREE.Box3().setFromObject(newTree);
    return newTree;
}

function makeRiver(Z){
    var tile = new THREE.Object3D();
    tile.content = [];
    tile.type = tileEnum.river;
    tile.Z = Z;
    scene.add(tile);
    var boxMin = new THREE.Vector3(-game_values.side_limits, 0, Z-1);
    var boxMax = new THREE.Vector3( game_values.side_limits, 5, Z+1);
    tile.box = new THREE.Box3(boxMin, boxMax);
    var river = new THREE.Mesh(road_geo, materials['river']);
    river.position.set(0, 0.01, Z);
    river.rotation.x = -Math.PI/2;
    tile.add(river);

    var period = 10000;

    var logs = 5;

    for (let index = 0; index < logs; index++) {
        var log = makeLog(Z, 5000 + 20000*Math.random());
        tile.add(log);
        tile.content.push(log);
        log.animation.start();
    }

    return tile;
}

function makeLog(Z, duration){
    var log = new THREE.Object3D();
    var logBox = new THREE.Mesh(logBox_geo, materials['invisible']);
    logBox.position.y = 1;
    var logLog = new THREE.Mesh(logLog_geo, materials['log']);
    logLog.rotation.x = -Math.PI/2;
    logLog.position.y = 0.1;
    log.add(logBox);
    log.add(logLog);
    log.box = logBox;
    log.position.z = Z;
    log.animation = new KF.KeyFrameAnimator;
    var start = 3*game_values.side_limits;
    log.animation.init({
        interps: [{ 
            keys:[0, 1], 
            values:[
                { x : -start},
                { x : start},
            ],
            target:log.position
        }],
        loop: true,
        duration: duration
    });
    return log;
}