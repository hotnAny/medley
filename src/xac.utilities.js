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
XAC.loadStl = function(data, onStlLoaded) {
	var stlLoader = new THREE.STLLoader();
	var geometry = stlLoader.parse(data);
	var object = new THREE.Mesh(geometry, MATERIALNORMAL);
	XAC.scene.add(object);

	var dims = getBoundingBoxDimensions(object);
	var ctr = getBoundingBoxCenter(object);

	// reposition the ground & grid
	XAC.ground.position.y -= dims[1];

	XAC.scene.remove(XAC.grid);
	XAC.grid = XAC.drawGrid(dims[1]);
	XAC.scene.add(XAC.grid);

	// relocate the camera
	var r = Math.max(25, getBoundingSphereRadius(object));
	XAC.camera.position.copy(XAC.posCam.clone().normalize().multiplyScalar(r * 2));

	// re-lookAt for the camera
	XAC.mouseCtrls.target = new THREE.Vector3(0, 0, 0);

	// store the object
	XAC.objects.push(object);

	if(onStlLoaded != undefined) {
		onStlLoaded(object);
	}
}
