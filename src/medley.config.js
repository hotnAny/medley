//
//
//

var MEDLEY = MEDLEY || {};

//
//  resource
//
MEDLEY.ASSETDIR = 'assets';
MEDLEY.TEMPLATEDIR = 'assets';
MEDLEY.DIRLIBRARY = 'library.json';

//
//  material related
//
MEDLEY.NUMSTARS = 5;
MEDLEY.HEATCONDUCTIVITY = 'heat conductivity';
MEDLEY.TENSILESTRENGTH = 'tensile strength';
MEDLEY.COMPRESSIONSTRENGTH = 'compression strength';
MEDLEY.SOFTNESS = 'softness';
MEDLEY.FRICTION = 'friction';
MEDLEY.ELASTICITY = 'elasticity';
MEDLEY.SHEARSTRENGTH = 'shear strength';
MEDLEY.ABRASIVERESISTANCE = 'abrasive resistance';
MEDLEY.FLEXIBILITY = 'flexibility';
MEDLEY.OPACITY = 'opacity';
MEDLEY.RESILIENCE = 'resilience';
MEDLEY.PLACITICITY = 'placiticity';
// ...

MEDLEY.MATERIALPROPERTIES = [
    '-',
    MEDLEY.HEATCONDUCTIVITY,
    MEDLEY.TENSILESTRENGTH,
    MEDLEY.COMPRESSIONSTRENGTH,
    MEDLEY.SOFTNESS,
    MEDLEY.FRICTION,
    MEDLEY.ELASTICITY,
    MEDLEY.SHEARSTRENGTH,
    MEDLEY.ABRASIVERESISTANCE,
    MEDLEY.FLEXIBILITY,
    MEDLEY.OPACITY,
    MEDLEY.RESILIENCE,
    MEDLEY.PLACITICITY
    // ...
];

//
//  embedding related
//
MEDLEY.MINRADIUS1D = 0.5;
MEDLEY.MAXRADIUS1D = 2.0;
MEDLEY.MINBENDRADIUS = 30;
MEDLEY.MAXBENDRADIUS = 100;
MEDLEY.MINTHICKNESS = 0.5;
MEDLEY.MAXTHICKNESS = 10;

//
//  fab related
//
MEDLEY.LAYERHEIGHT = 0.2; // mm
MEDLEY.MINNUMBEROFBOUNDINGLAYERS = 8;
MEDLEY.YUP = new THREE.Vector3(0, 1, 0);

//
//  ui related
//

// panel
MEDLEY.WIDTHPANEL = 360;
MEDLEY.PADDINGPANEL = 10;

// search box
MEDLEY.TABLEPANEL = MEDLEY.TEMPLATEDIR + '/panel_table.html';
MEDLEY.WIDTHSEARCHBOX = 225;
MEDLEY.NUMSEARCHRESULTSCOLS = 1;
MEDLEY.PADDINGSEARCHRESULTS = 8;
MEDLEY.WIDTHSEARCHRESULTITEM = 64;
MEDLEY.PADDINGSEARCHRESULTITEM = 0;
MEDLEY.CODEWHITESTAR = '&#9734;';
MEDLEY.CODEBLACKSTAR = '&#9733;';
MEDLEY.MAXNUMPROPERTIESONCARD = 3;

// material properties dialog
MEDLEY.WIDTHDIALOG = 480;
MEDLEY.HEIGHTDIALOG = 560;
MEDLEY.WIDTHDIALOGTHUMBNAIL = 96;
MEDLEY.TABLEINFODIALOG = MEDLEY.TEMPLATEDIR + '/dialog_table.html';
MEDLEY.CODECROSS = '&#10006;';//'&times;';