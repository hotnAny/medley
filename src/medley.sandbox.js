var MEDLEY = MEDLEY || {};

function onStlLoaded(object) {
    XAC.inputTechniques[object] = new MEDLEY.PaintInput(XAC.scene);

    if(object.geometry.isBufferGeometry) {
        object.geometry = new THREE.Geometry().fromBufferGeometry(object.geometry);
        log('buffergeometry converted.')
    }

    object.geometry.computeFaceNormals();
    object.geometry.computeVertexNormals();
}
