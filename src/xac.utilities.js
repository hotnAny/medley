/*------------------------------------------------------------------------------------*
 *
 * useful recurring routines
 *
 * by xiang 'anthony' chen, xiangchen@acm.org
 *
 *------------------------------------------------------------------------------------*/

var XAC = XAC || {};

function log(msg) {
	console.log(msg);
}

// //
// // longer log
// //
// function llog() {
// 	var strLog = "";
// 	for (var i = 0; i < arguments.length; i++) {
// 		if (typeof arguments[i] === 'object') {
// 			if (Array.isArray(arguments[i])) {
// 				if (arguments[i].length > 0 && arguments[i][0].length > 0) {
// 					for (var j = 0; j < arguments[i].length; j++) {
// 						log(arguments[i][j]);
// 					}
// 				} else {
// 					strLog += arguments[i] + '\n';
// 				}
// 			} else {
// 				for (key in arguments[i]) {
// 					log(typeof arguments[i][key])
// 					strLog += key + ': ' + arguments[i][key] + '\n';
// 				}
// 			}
// 		} else {
// 			strLog += arguments[i] + ' '
// 		}
// 	}
// 	console.log(strLog)
// }

//
//	load models from stl binary/ascii data
//
XAC.loadStl = function(data) {
	var stlLoader = new THREE.STLLoader();
	var geometry = stlLoader.parse(data);
	var object = new THREE.Mesh(geometry, MATERIALNORMAL);
	XAC.scene.add(object);

	var dims = getBoundingBoxDimensions(object);
	var ctr = getBoundingBoxCenter(object);

	// reposition the ground & grid
	XAC.ground.position.y -= dims[1] * 0.55;

	XAC.scene.remove(XAC.grid);
	XAC.grid = XAC.drawGrid(dims[1] * 0.55);
	XAC.scene.add(XAC.grid);

	// relocate the camera
	var r = Math.max(25, getBoundingSphereRadius(object));
	XAC.camera.position.copy(XAC.posCam.clone().normalize().multiplyScalar(r * 2));

	// re-lookAt for the camera
	XAC.mouseCtrls.target = new THREE.Vector3(0, 0, 0);

	// store the object
	XAC.objects.push(object);

	// XXX
	XAC.inputTechniques[object] = new MEDLEY.PaintInput(XAC.scene);
}

_balls = [];

function addABall(pt, clr, radius) {
	clr = clr == undefined ? 0xff0000 : clr;
	radius = radius == undefined ? 1 : radius;

	var geometry = new THREE.SphereGeometry(radius, 10, 10);
	var material = new THREE.MeshBasicMaterial({
		color: clr
	});
	var ball = new THREE.Mesh(geometry, material);
	ball.position.set(pt.x, pt.y, pt.z);

	_balls.push(ball);
	XAC.scene.add(ball);

	return ball;
}

function removeBalls() {
	for (var i = _balls.length - 1; i >= 0; i--) {
		XAC.scene.remove(_balls[i]);
	}
}
