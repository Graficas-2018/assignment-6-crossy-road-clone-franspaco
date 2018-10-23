/// <reference path="../types/three/index.d.ts" />

var road_geo = new THREE.PlaneGeometry(5*game_values.side_limits, 2);
var car_geo = new THREE.BoxGeometry(3,2,1);

function makeRoad(Z){
    var tile = new THREE.Object3D();
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
    var tree_count = 3 + 4*Math.round(Math.random());
    for (let index = 0; index < tree_count; index++) {
        var X = 2*game_values.side_limits*Math.random() - game_values.side_limits;
        tile.add(makeTree(X, Z));
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