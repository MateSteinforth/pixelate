//--------------- POST EFFECT DEFINITION------------------------//
pc.extend(pc, function () {
    // Constructor - Creates an instance of our post effect
    var PixelatePostEffect = function (graphicsDevice, vs, fs) {
        // this is the shader definition for our effect
        this.shader = new pc.Shader(graphicsDevice, {
            attributes: {
                aPosition: pc.SEMANTIC_POSITION
            },
            vshader: [
                "attribute vec2 aPosition;",
                "",
                "varying vec2 vUv0;",
                "",
                "void main(void)",
                "{",
                "    gl_Position = vec4(aPosition, 0.0, 1.0);",
                "    vUv0 = (aPosition.xy + 1.0) * 0.5;",
                "}"
            ].join("\n"),
            fshader: [
                "precision " + graphicsDevice.precision + " float;",
                "",
                "uniform vec2 uResolution;",
                "uniform float uPixelize;",
                "uniform sampler2D uColorBuffer;",
                "",
                "varying vec2 vUv0;",
                "",
                "void main() {",
                "    vec2 uv = gl_FragCoord.xy / uResolution.xy;",
                "    vec2 div = vec2(uResolution.x * uPixelize / uResolution.y, uPixelize);",
                "    uv = floor(uv * div)/div;",
                "    vec4 color = texture2D(uColorBuffer, uv);",
                "    gl_FragColor = color;",
                "}"
            ].join("\n")
        });

        this.resolution = new Float32Array(2);
        this.pixelize = 100;
    };

    // Our effect must derive from pc.PostEffect
    PixelatePostEffect = pc.inherits(PixelatePostEffect, pc.PostEffect);

    PixelatePostEffect.prototype = pc.extend(PixelatePostEffect.prototype, {
        // Every post effect must implement the render method which 
        // sets any parameters that the shader might require and 
        // also renders the effect on the screen
        render: function (inputTarget, outputTarget, rect) {
            var device = this.device;
            var scope = device.scope;

            // Set the input render target to the shader. This is the image rendered from our camera
            scope.resolve("uColorBuffer").setValue(inputTarget.colorBuffer);
            
            this.resolution[0] = inputTarget.width;
            this.resolution[1] = inputTarget.height;
            scope.resolve("uResolution").setValue(this.resolution);       
            
            scope.resolve("uPixelize").setValue(this.pixelize);
            
            // Draw a full screen quad on the output target. In this case the output target is the screen.
            // Drawing a full screen quad will run the shader that we defined above
            pc.drawFullscreenQuad(device, outputTarget, this.vertexBuffer, this.shader, rect);
        }
    });

    return {
        PixelatePostEffect: PixelatePostEffect
    };
}());


//--------------- SCRIPT DEFINITION------------------------//
var PostEffectPixelate = pc.createScript('PostEffectPixelate');

PostEffectPixelate.attributes.add('pixelize', {
    type: 'number',
    default: 100
});

// initialize code called once per entity
PostEffectPixelate.prototype.initialize = function() {
    var effect = new pc.PixelatePostEffect(this.app.graphicsDevice);
    
    // add the effect to the camera's postEffects queue
    var queue = this.entity.camera.postEffects;
    queue.addEffect(effect);
    
    // when the script is enabled add our effect to the camera's postEffects queue
    this.on('enable', function () {
        queue.addEffect(effect, false); 
    });
    
    // when the script is disabled remove our effect from the camera's postEffects queue
    this.on('disable', function () {
        queue.removeEffect(effect); 
    });
    
    this.on('attr:pixelize', function (value, prev) {
        this.pixelize = value;
    });
};
