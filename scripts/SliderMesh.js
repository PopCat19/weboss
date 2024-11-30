/*
* Custom class, extends PIXI.Container
* Each instance is a Pixi-renderable slider
* Properties: alpha
*
* Constructor params
*   curve: array of points, in osu pixels
*   radius: radius of hit circle, in osu pixels
*   transform: {dx,ox,dy,oy} (x,y)->(x*dx+ox, y*dy+oy) [-1,1]x[-1,1]
*   tint: 24-bit integer color of inner slider body, RGB from highbits to lowbits
*/

define([], function() {

    // Import the PIXI.Container class
    Container = PIXI.Container;

    // Vertex shader source
    // This shader is used to transform the vertices of the slider mesh
    const vertexSrc = `
    precision mediump float;
    attribute vec4 position;
    varying float dist;
    uniform float dx,dy,dt,ox,oy,ot;
    void main() {
        // Calculate the distance from the center of the slider
        dist = position[3];
        // Transform the vertex position
        gl_Position = vec4(position[0], position[1], position[3] + 2.0 * float(position[2]*dt>ot), 1.0);
        // Apply the transformation matrix
        gl_Position.x = gl_Position.x * dx + ox;
        gl_Position.y = gl_Position.y * dy + oy;
    }`;

    // Fragment shader source
    // This shader is used to color the slider mesh
    const fragmentSrc = `
    precision mediump float;
    varying float dist;
    uniform sampler2D uSampler2;
    uniform float alpha;
    uniform float texturepos;
    void main() {
        // Sample the texture at the current position
        gl_FragColor = alpha * texture2D(uSampler2, vec2(dist, texturepos));
    }`;

    // Create a line texture for the slider from the given tint color
    function newTexture(colors, SliderTrackOverride, SliderBorder) {
        // Define some constants for the texture generation
        const borderwidth = 0.128;
        const innerPortion = 1 - borderwidth;
        const edgeOpacity = 0.8;
        const centerOpacity = 0.3;
        const blurrate = 0.015;
        const width = 200;

        // Create a buffer to store the texture data
        let buff = new Uint8Array(colors.length * width * 4);

        // Loop over each color in the colors array
        for (let k = 0; k < colors.length; ++k) {
            // Get the current color and border color
            let tint = (typeof(SliderTrackOverride) != 'undefined') ? SliderTrackOverride : colors[k];
            let bordertint = (typeof(SliderBorder) != 'undefined') ? SliderBorder : 0xffffff;

            // Extract the RGB components of the colors
            let borderR = (bordertint >> 16) / 255;
            let borderG = ((bordertint >> 8) & 255) / 255;
            let borderB = (bordertint & 255) / 255;
            let borderA = 1.0;
            let innerR = (tint >> 16) / 255;
            let innerG = ((tint >> 8) & 255) / 255;
            let innerB = (tint & 255) / 255;
            let innerA = 1.0;

            // Loop over each pixel in the texture
            for (let i = 0; i < width; i++) {
                // Calculate the position in the texture
                let position = i / width;

                // Determine whether to draw the border or inner color
                let R, G, B, A;
                if (position >= innerPortion) { // draw border color
                    R = borderR;
                    G = borderG;
                    B = borderB;
                    A = borderA;
                } else { // draw inner color
                    R = innerR;
                    G = innerG;
                    B = innerB;
                    // Calculate the opacity of the inner color
                    A = innerA * ((edgeOpacity - centerOpacity) * position / innerPortion + centerOpacity);
                }

                // Pre-multiply the alpha channel
                R *= A;
                G *= A;
                B *= A;

                // Blur the edge of the texture for anti-aliasing
                if (1 - position < blurrate) { // outer edge
                    R *= (1 - position) / blurrate;
                    G *= (1 - position) / blurrate;
                    B *= (1 - position) / blurrate;
                    A *= (1 - position) / blurrate;
                }
                if (innerPortion - position > 0 && innerPortion - position < blurrate) {
                    let mu = (innerPortion - position) / blurrate;
                    R = mu * R + (1 - mu) * borderR * borderA;
                    G = mu * G + (1 - mu) * borderG * borderA;
                    B = mu * B + (1 - mu) * borderB * borderA;
                    A = mu * innerA + (1 - mu) * borderA;
                }

                // Store the pixel data in the buffer
                buff[(k * width + i) * 4] = R * 255;
                buff[(k * width + i) * 4 + 1] = G * 255;
                buff[(k * width + i) * 4 + 2] = B * 255;
                buff[(k * width + i) * 4 + 3] = A * 255;
            }
        }

        // Create a texture from the buffer
        return PIXI.Texture.fromBuffer(buff, width, colors.length);
    }

    // Define a constant for the number of sides in the circle approximation
    const DIVIDES = 64;

    // Create a mesh from the control curve
    function curveGeometry(curve0, radius) {
        // Filter out coinciding points in the curve
        curve = new Array();
        for (let i = 0; i < curve0.length; ++i)
            if (i == 0 ||
                Math.abs(curve0[i].x - curve0[i - 1].x) > 0.00001 ||
                Math.abs(curve0[i].y - curve0[i - 1].y) > 0.00001)
                curve.push(curve0[i]);

        // Create arrays to store the vertex and index data
        let vert = new Array();
        let index = new Array();

        // Add the first point on the curve
        vert.push(curve[0].x, curve[0].y, curve[0].t, 0.0);

        // Loop over each segment of the curve
for (let i = 1; i < curve.length; ++i) {
    // Calculate the position and tangent of the current segment
    let x = curve[i].x;
    let y = curve[i].y;
    let t = curve[i].t;
    let lx = curve[i - 1].x;
    let ly = curve[i - 1].y;
    let lt = curve[i - 1].t;
    let dx = x - lx;
    let dy = y - ly;
    let length = Math.hypot(dx, dy);
    let ox = radius * -dy / length;
    let oy = radius * dx / length;

    // Add the vertices for the current segment
    vert.push(lx + ox, ly + oy, lt, 1.0);
    vert.push(lx - ox, ly - oy, lt, 1.0);
    vert.push(x + ox, y + oy, t, 1.0);
    vert.push(x - ox, y - oy, t, 1.0);
    vert.push(x, y, t, 0.0);

    // Add the indices for the current segment
    let n = 5 * i + 1;
    index.push(n - 6, n - 5, n - 1, n - 5, n - 1, n - 3);
    index.push(n - 6, n - 4, n - 1, n - 4, n - 1, n - 2);
}

// Function to add an arc to the mesh
function addArc(c, p1, p2, t) {
    // Calculate the angles of the arc
    let theta_1 = Math.atan2(vert[4 * p1 + 1] - vert[4 * c + 1], vert[4 * p1] - vert[4 * c])
    let theta_2 = Math.atan2(vert[4 * p2 + 1] - vert[4 * c + 1], vert[4 * p2] - vert[4 * c])
    if (theta_1 > theta_2)
        theta_2 += 2 * Math.PI;
    let theta = theta_2 - theta_1;
    let divs = Math.ceil(DIVIDES * Math.abs(theta) / (2 * Math.PI));
    theta /= divs;
    let last = p1;

    // Add the vertices and indices for the arc
    for (let i = 1; i < divs; ++i) {
        vert.push(vert[4 * c] + radius * Math.cos(theta_1 + i * theta),
            vert[4 * c + 1] + radius * Math.sin(theta_1 + i * theta), t, 1.0);
        let newv = vert.length / 4 - 1;
        index.push(c, last, newv);
        last = newv;
    }
    index.push(c, last, p2);
}

// Add the arcs for the head and tail of the curve
addArc(0, 1, 2, curve[0].t);
addArc(5 * curve.length - 5, 5 * curve.length - 6, 5 * curve.length - 7, curve[curve.length - 1].t);

// Add the arcs for the turning points of the curve
for (let i = 1; i < curve.length - 1; ++i) {
    let dx1 = curve[i].x - curve[i - 1].x;
    let dy1 = curve[i].y - curve[i - 1].y;
    let dx2 = curve[i + 1].x - curve[i].x;
    let dy2 = curve[i + 1].y - curve[i].y;
    let t = dx1 * dy2 - dx2 * dy1; // d1 x d2
    if (t > 0) { // turning counterclockwise
        addArc(5 * i, 5 * i - 1, 5 * i + 2);
    } else { // turning clockwise or straight back
        addArc(5 * i, 5 * i + 1, 5 * i - 2);
    }
}

// Create a PIXI.Geometry object from the vertex and index data
return new PIXI.Geometry().addAttribute('position', vert, 4).addIndex(index)
}

// Function to create a circle geometry
function circleGeometry(radius) {
    // Create arrays to store the vertex and index data
    let vert = new Array();
    let index = new Array();

    // Add the center of the circle
    vert.push(0.0, 0.0, 0.0, 0.0);

    // Loop over each segment of the circle
    for (let i = 0; i < DIVIDES; ++i) {
        // Calculate the angle of the current segment
        let theta = 2 * Math.PI / DIVIDES * i;

        // Add the vertex for the current segment
        vert.push(radius * Math.cos(theta), radius * Math.sin(theta), 0.0, 1.0);

        // Add the index for the current segment
        index.push(0, i + 1, (i + 1) % DIVIDES + 1);
    }

    // Create a PIXI.Geometry object from the vertex and index data
    return new PIXI.Geometry().addAttribute('position', vert, 4).addIndex(index);
}

// Constructor for the SliderMesh class
function SliderMesh(curve, radius, tintid) {
    // Call the constructor of the parent class (Container)
    Container.call(this);

    // Initialize the properties of the SliderMesh
    this.curve = curve;
    this.geometry = curveGeometry(curve.curve, radius);
    this.alpha = 1.0;
    this.tintid = tintid;
    this.startt = 0.0;
    this.endt = 1.0;

    // Initialize the state of the SliderMesh
    this.state = PIXI.State.for2d();
    this.drawMode = PIXI.DRAW_MODES.TRIANGLES;
    this.blendMode = PIXI.BLEND_MODES.NORMAL;
    this._roundPixels = PIXI.settings.ROUND_PIXELS;
}

// Set the prototype of the SliderMesh class to inherit from the Container class
if (Container) {
    SliderMesh.__proto__ = Container;
}
SliderMesh.prototype = Object.create(Container && Container.prototype);
SliderMesh.prototype.constructor = SliderMesh;

// Function to initialize the SliderMesh
SliderMesh.prototype.initialize = function (colors, radius, transform, SliderTrackOverride, SliderBorder) {
    // Initialize the properties of the SliderMesh
    this.ncolors = colors.length;
    this.uSampler2 = newTexture(colors, SliderTrackOverride, SliderBorder);
    this.circle = circleGeometry(radius);
    this.uniforms = {
        uSampler2: this.uSampler2,
        alpha: 1.0,
        dx: transform.dx,
        dy: transform.dy,
        ox: transform.ox,
        oy: transform.oy,
        texturepos: 0,
    };
    this.shader = PIXI.Shader.from(vertexSrc, fragmentSrc, this.uniforms);
};

// Function to reset the transform of the SliderMesh
SliderMesh.prototype.resetTransform = function (transform) {
    // Update the uniforms of the SliderMesh
    this.uniforms.dx = transform.dx;
    this.uniforms.dy = transform.dy;
    this.uniforms.ox = transform.ox;
    this.uniforms.oy = transform.oy;
};

// Function to render the SliderMesh
SliderMesh.prototype._render = function (renderer) {
    // Not batchable, manual rendering
    this._renderDefault(renderer);
};

// Function to render the SliderMesh in the default way
SliderMesh.prototype._renderDefault = function (renderer) {
    // Get the shader and uniforms of the SliderMesh
    var shader = this.shader;
    shader.alpha = this.worldAlpha;
    if (shader.update) {
        shader.update();
    }

    // Flush the batch
    renderer.batch.flush();

    // Update the uniforms of the SliderMesh
    this.uniforms.alpha = this.alpha;
    this.uniforms.texturepos = this.tintid / this.ncolors;
    this.uniforms.dt = 0;
    this.uniforms.ot = 0.5;

    // Get the OpenGL context
    const gl = renderer.gl;

    // Clear the depth buffer
    gl.clearDepth(1.0);
    gl.clear(gl.DEPTH_BUFFER_BIT);

    // First render: to store min depth in depth buffer, but not actually drawing anything
    gl.colorMask(false, false, false, false);

    // Set the state of the SliderMesh
    renderer.state.set(this.state);
    renderer.state.setDepthTest(true);

    // Get the geometry and index length of the SliderMesh
    let glType;
    let indexLength;

    // Function to bind the geometry and index of the SliderMesh
    function bind(geometry) {
        // Bind the shader and sync uniforms
        renderer.shader.bind(shader);

        // Bind the geometry
        renderer.geometry.bind(geometry, shader);

        // Get the byte size and type of the index
        let byteSize = geometry.indexBuffer.data.BYTES_PER_ELEMENT;
        glType = byteSize === 2 ? gl.UNSIGNED_SHORT : gl.UNSIGNED_INT;
        indexLength = geometry.indexBuffer.data.length;
    }

    // Render the SliderMesh
    if (this.startt == 0.0 && this.endt == 1.0) {
        // Display whole slider
        this.uniforms.dt = 0;
        this.uniforms.ot = 1;
        bind(this.geometry);
        gl.drawElements(this.drawMode, indexLength, glType, 0);
    } else if (this.endt == 1.0) {
        // Snaking out
        if (this.startt != 1.0) {
            // We want portion: t > this.startt
            this.uniforms.dt = -1;
            this.uniforms.ot = -this.startt;
            bind(this.geometry);
            gl.drawElements(this.drawMode, indexLength, glType, 0);
        }
        this.uniforms.dt = 0;
        this.uniforms.ot = 1;
        let p = this.curve.pointAt(this.startt);
        this.uniforms.ox += p.x * this.uniforms.dx;
        this.uniforms.oy += p.y * this.uniforms.dy;
        bind(this.circle);
        gl.drawElements(this.drawMode, indexLength, glType, 0);
    } else if (this.startt == 0.0) {
        // Snaking in
        if (this.endt != 0.0) {
            // We want portion: t < this.endt
            this.uniforms.dt = 1;
            this.uniforms.ot = this.endt;
            bind(this.geometry);
            gl.drawElements(this.drawMode, indexLength, glType, 0);
        }
        this.uniforms.dt = 0;
        this.uniforms.ot = 1;
        let p = this.curve.pointAt(this.endt);
        this.uniforms.ox += p.x * this.uniforms.dx;
        this.uniforms.oy += p.y * this.uniforms.dy;
        bind(this.circle);
        gl.drawElements(this.drawMode, indexLength, glType, 0);
    } // If none of the above conditions are met, throw an error
    else {
        console.error("Can't snake both ends of slider");
    }
    
    // Second render: draw at previously calculated min depth
    gl.depthFunc(gl.EQUAL);
    gl.colorMask(true, true, true, true);
    
    if (this.startt == 0.0 && this.endt == 1.0) {
        // Display whole slider
        gl.drawElements(this.drawMode, indexLength, glType, 0);
    } else if (this.endt == 1.0) {
        // Snaking out
        if (this.startt != 1.0) {
            gl.drawElements(this.drawMode, indexLength, glType, 0);
            this.uniforms.ox = ox0;
            this.uniforms.oy = oy0;
            this.uniforms.dt = -1;
            this.uniforms.ot = -this.startt;
            bind(this.geometry);
        }
        gl.drawElements(this.drawMode, indexLength, glType, 0);
    } else if (this.startt == 0.0) {
        // Snaking in
        if (this.endt != 0.0) {
            gl.drawElements(this.drawMode, indexLength, glType, 0);
            this.uniforms.ox = ox0;
            this.uniforms.oy = oy0;
            this.uniforms.dt = 1;
            this.uniforms.ot = this.endt;
            bind(this.geometry);
        }
        gl.drawElements(this.drawMode, indexLength, glType, 0);
    }
    
    // Restore state
    gl.depthFunc(gl.LESS);
    renderer.state.setDepthTest(false);
    this.uniforms.ox = ox0;
    this.uniforms.oy = oy0;
    };
    
    // Function to destroy the SliderMesh
    SliderMesh.prototype.destroy = function (options) {
        // Call the destroy function of the parent class (Container)
        Container.prototype.destroy.call(this, options);
    
        // Dispose of the geometry and shader
        this.geometry.dispose();
        this.geometry = null;
        this.shader = null;
        this.state = null;
    };
    
    // Return the SliderMesh class
    return SliderMesh;
})